import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  bot_name: string;

  @IsString()
  @IsNotEmpty()
  post_id: string;
}
