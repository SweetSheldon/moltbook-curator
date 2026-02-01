import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsUrl, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSuggestionDto {
  @IsUrl({}, { message: 'URL must be a valid URL' })
  @IsNotEmpty({ message: 'URL is required' })
  @Matches(/^https?:\/\/(www\.)?moltbook\.com\//, {
    message: 'URL must be from moltbook.com (e.g., https://moltbook.com/post/...)'
  })
  @MaxLength(2000, { message: 'URL must be less than 2000 characters' })
  @Transform(({ value }) => value?.trim())
  url: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Description must be at least 1 character' })
  @MaxLength(500, { message: 'Description must be less than 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Suggested by must be at least 1 character' })
  @MaxLength(100, { message: 'Suggested by must be less than 100 characters' })
  @Transform(({ value }) => value?.trim())
  suggested_by?: string;
}
