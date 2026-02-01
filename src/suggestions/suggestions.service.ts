import { Injectable } from '@nestjs/common';

export interface Suggestion {
  id: string;
  url: string;
  description?: string;
  suggested_by: string;
  suggested_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Injectable()
export class SuggestionsService {
  private suggestions: Suggestion[] = [];

  private loadData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'suggestions.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        this.suggestions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error.message);
      this.suggestions = [];
    }
  }

  private saveData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const dataPath = path.join(dataDir, 'suggestions.json');

      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(this.suggestions, null, 2));
    } catch (error) {
      console.error('Failed to save suggestions:', error.message);
    }
  }

  create(url: string, description: string, suggestedBy?: string): Suggestion {
    this.loadData();

    const suggestion: Suggestion = {
      id: `sug_${Date.now()}`,
      url,
      description,
      suggested_by: suggestedBy || 'anonymous',
      suggested_at: new Date().toISOString(),
      status: 'pending',
    };

    this.suggestions.push(suggestion);
    this.saveData();

    return suggestion;
  }

  getAll(): Suggestion[] {
    this.loadData();
    return this.suggestions;
  }

  updateStatus(id: string, status: Suggestion['status']): Suggestion | null {
    this.loadData();
    const suggestion = this.suggestions.find((s) => s.id === id);
    if (suggestion) {
      suggestion.status = status;
      this.saveData();
    }
    return suggestion;
  }
}
