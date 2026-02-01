import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './suggestion.dto';

@Controller('suggest')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async suggest(@Body() dto: CreateSuggestionDto) {
    const { url, description, suggested_by } = dto;

    const suggestion = this.suggestionsService.create(
      url,
      description,
      suggested_by,
    );

    return {
      success: true,
      message: 'Suggestion added! 🦞',
      suggestion,
    };
  }

  @Get()
  async getAll() {
    const suggestions = this.suggestionsService.getAll();
    return {
      success: true,
      suggestions,
      count: suggestions.length,
    };
  }
}
