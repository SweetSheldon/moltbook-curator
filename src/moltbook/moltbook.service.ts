import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MoltbookService {
  private readonly baseUrl = 'https://www.moltbook.com/api/v1';
  private readonly apiKey = process.env.MOLTBOOK_API_KEY;

  private headers = {
    Authorization: `Bearer ${this.apiKey}`,
  };

  async fetchPosts(sort: 'hot' | 'new' | 'top' | 'rising' = 'hot', limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/posts`, {
        headers: this.headers,
        params: { sort, limit },
      });
      return response.data.posts || [];
    } catch (error) {
      console.error('Moltbook API error:', error.message);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
  }

  async fetchPost(postId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/posts/${postId}`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      console.error('Moltbook API error:', error.message);
      throw new Error(`Failed to fetch post: ${error.message}`);
    }
  }

  async search(query: string, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: this.headers,
        params: { q: query, limit },
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Moltbook API error:', error.message);
      throw new Error(`Failed to search: ${error.message}`);
    }
  }
}
