import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';
import { MoltbookModule } from '../moltbook/moltbook.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [MoltbookModule, PostsModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
