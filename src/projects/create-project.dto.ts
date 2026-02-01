import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsUrl,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export interface CreateProjectDto {
  @IsUrl({}, { message: 'URL must be a valid URL' })
  @IsNotEmpty({ message: 'URL is required' })
  @MaxLength(2000, { message: 'URL must be less than 2000 characters' })
  @Transform(({ value }) => value?.trim())
  url: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Description must be at least 1 character' })
  @MaxLength(1000, { message: 'Description must be less than 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Submitted by must be at least 1 character' })
  @MaxLength(50, { message: 'Submitted by must be less than 50 characters' })
  @Transform(({ value }) => value?.trim())
  submitted_by?: string;
}
