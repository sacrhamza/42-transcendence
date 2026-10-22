import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available globally
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
