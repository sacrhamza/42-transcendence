import { Module } from '@nestjs/common';
import { UsersService } from './user.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
