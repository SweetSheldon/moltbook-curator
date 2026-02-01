import { Module } from '@nestjs/common';
import { MoltbookService } from './moltbook.service';

@Module({
  providers: [MoltbookService],
  exports: [MoltbookService],
})
export class MoltbookModule {}
