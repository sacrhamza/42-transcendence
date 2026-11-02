import { Module } from '@nestjs/common';
import { FastApiService } from './apiclient.service.js';

@Module({
  imports: [],
  providers: [FastApiService],
  exports: [FastApiService],
})
export class FastApiModule {}