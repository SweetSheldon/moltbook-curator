import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  suggested_by?: string;
}
