import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PostsModule } from './posts/posts.module';
import { VotesModule } from './votes/votes.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { MoltbookModule } from './moltbook/moltbook.module';
import { CronModule } from './cron/cron.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PostsModule,
    VotesModule,
    SuggestionsModule,
    MoltbookModule,
    CronModule,
    HealthModule,
  ],
})
export class AppModule {}
