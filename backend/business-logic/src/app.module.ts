import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module.js';
import { FastApiModule } from './fastapi-client/apiclient.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    FastApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
