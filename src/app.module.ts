import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostsModule } from './posts/posts.module';
import { VotesModule } from './votes/votes.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostsModule,
    VotesModule,
    SuggestionsModule,
    HealthModule,
  ],
})
export class AppModule {}
