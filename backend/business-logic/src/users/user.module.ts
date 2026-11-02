import { Module } from '@nestjs/common';
import { FastApiService } from '../fastapi-client/apiclient.service.js';
import { UsersService } from './user.service.js';
import { FastApiModule } from '../fastapi-client/apiclient.module.js';

@Module({
  imports: [FastApiModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
