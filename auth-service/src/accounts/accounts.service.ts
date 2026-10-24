import {
  Injectable,
  ConflictException,
  NotFoundException,
  UUIDVersion,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { UUID } from 'crypto';

@Injectable()
export class AccountService {
  constructor(private readonly prismaService: PrismaService) {}

  // Get all users
  async getAll() {
    return await this.prismaService.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
      },
    });
  }

  async findById(id: string) {
    const check_user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!check_user) return null;
    return check_user;
  }

  async findByEmailForAuth(email: string) {
    const check_user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    return check_user;
  }

  async createOne(body: CreateUserDto) {
    const check_user = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });
    if (check_user) {
      throw new ConflictException('This email is already registered.');
    }
    const pass_hashed = await bcrypt.hash(body.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        firstName: body.firstname,
        lastName: body.lastname,
        email: body.email,
        passwordHash: pass_hashed,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    return user;
  }

  async updateUser(id: string, body: UpdateUserDto) {
    const check_user = await this.findById(id);
    if (!check_user) throw new NotFoundException('User Not Found!');
    // if(body.password) 
    const update = await this.prismaService.user.update({
      where: { id },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
    });
    return update;
  }

  async deleteone(id: string) {
    try {
      await this.prismaService.user.delete({
        where: {
          id: id,
        },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code == 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
