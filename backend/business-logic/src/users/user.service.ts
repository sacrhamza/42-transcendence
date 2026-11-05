import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from '../auth/dto/RegisterDto.js';
import { Prisma } from '../generated/prisma/client.js';


import * as bcrypt from 'bcrypt';

/*
UsersService method	      HTTP
------------------------------
createUser(data)	        POST
findByEmail(email)	      GET
findById(id)	            GET
findByUsername(username)	GET
updateUser(id, data)	    PATCH
deleteUser(id)	          DELETE
*/

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // find
  async findByUsername(username: string) {
    return this.prisma.users.findUnique({
      where: { name: username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.normal_users.findUnique({
      where: {
        mail: email,
      },
      select: {
        mail: true,
      },
    });
  }

  async createUser(data: RegisterDto) {
    // hash the password !
    const hashedPass = await bcrypt.hash(data.password, 12);

    try {
      const res = await this.prisma.users.create({
        data: {
          name: data.username,
          bio: '',
          normal_users: {
            create: {
              mail: data.email,
              password: hashedPass,
            },
          },
        },
        select: {
          id: true,
        },
      });

      return {
        message: 'User registered successfully',
        userId: res.id.toString(),
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email already registered');
      }

      throw error;
    }
  }
}
