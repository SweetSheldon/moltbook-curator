import { Injectable } from '@nestjs/common';
import { Post } from './post.interface';

@Injectable()
export class PostsService {
  private posts: Post[] = [];

  private loadData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'posts.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        this.posts = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load posts:', error.message);
      this.posts = [];
    }
  }

  private saveData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const dataPath = path.join(dataDir, 'posts.json');

      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(this.posts, null, 2));
    } catch (error) {
      console.error('Failed to save posts:', error.message);
    }
  }

  create(url: string, description: string, suggestedBy: string): Post {
    this.loadData();

    // Check if URL already exists
    const existing = this.posts.find(p => p.url === url);
    if (existing) {
      return existing;
    }

    const post: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      description,
      suggested_by: suggestedBy || 'anonymous',
      votes: 0,
      created_at: new Date().toISOString(),
    };

    this.posts.push(post);
    this.saveData();

    return post;
  }

  getAll(limit?: number): Post[] {
    this.loadData();
    let result = this.posts;
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }

  getTop(limit: number): Post[] {
    this.loadData();
    return this.posts
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);
  }

  findById(id: string): Post | undefined {
    this.loadData();
    return this.posts.find(p => p.id === id);
  }

  findByUrl(url: string): Post | undefined {
    this.loadData();
    return this.posts.find(p => p.url === url);
  }

  updateVotes(id: string, increment = true): Post | undefined {
    this.loadData();
    const post = this.posts.find(p => p.id === id);
    if (post) {
      post.votes = Math.max(0, post.votes + (increment ? 1 : -1));
      post.last_voted_at = new Date().toISOString();
      this.saveData();
    }
    return post;
  }
}
