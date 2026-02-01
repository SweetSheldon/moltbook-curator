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

  getAll(): Post[] {
    this.loadData();
    return this.posts;
  }

  getTop(limit: number): Post[] {
    this.loadData();
    return this.posts
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);
  }

  getRecent(limit: number): Post[] {
    this.loadData();
    return this.posts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  getFeed(limit: number): Post[] {
    this.loadData();
    const topCount = Math.floor(limit * 0.4);
    const recentCount = limit - topCount;

    const topPosts = this.getTop(topCount);
    const recentPosts = this.getRecent(recentCount);

    const seenIds = new Set(topPosts.map(p => p.id));
    const combined = [...topPosts];

    for (const post of recentPosts) {
      if (!seenIds.has(post.id)) {
        combined.push(post);
        seenIds.add(post.id);
      }
    }

    return combined;
  }

  findById(id: string): Post | undefined {
    this.loadData();
    return this.posts.find(p => p.id === id);
  }

  updateVotes(id: string, increment = true): Post | undefined {
    this.loadData();
    const post = this.posts.find(p => p.id === id);
    if (post) {
      post.votes = (post.votes || 0) + (increment ? 1 : -1);
      post.last_voted_at = new Date().toISOString();
      this.saveData();
    }
    return post;
  }

  updateAllPosts(posts: Post[]) {
    this.posts = posts;
    this.saveData();
  }
}
