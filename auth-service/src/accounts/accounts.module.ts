import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountService } from './accounts.service';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [AccountService],
  exports: [AccountService],
})
export class UsersModule {}
