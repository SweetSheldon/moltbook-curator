import { Module } from '@nestjs/common';
import { SuggestionsController } from './suggestions.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  controllers: [SuggestionsController],
})
export class SuggestionsModule {}
