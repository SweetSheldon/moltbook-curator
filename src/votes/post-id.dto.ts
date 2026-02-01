import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class PostIdDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^post_\d+_[a-z0-9]+$/, {
    message: 'Invalid post ID format. Expected: post_1234567890_abc123'
  })
  post_id: string;
}
