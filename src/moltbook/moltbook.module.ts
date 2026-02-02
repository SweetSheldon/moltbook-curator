import { Module } from '@nestjs/common';
import { MoltbookService } from './moltbook.service';
import { ValidationWorker } from './validation.worker';

@Module({
  providers: [MoltbookService, ValidationWorker],
  exports: [MoltbookService],
})
export class MoltbookModule {}
