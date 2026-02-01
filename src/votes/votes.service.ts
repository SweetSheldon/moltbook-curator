import { Injectable } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class VotesService {
  private votes: Array<{ bot_name: string; post_id: string; voted_at: string }> = [];

  private loadData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'votes.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        this.votes = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load votes:', error.message);
      this.votes = [];
    }
  }

  private saveData() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const dataPath = path.join(dataDir, 'votes.json');

      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(this.votes, null, 2));
    } catch (error) {
      console.error('Failed to save votes:', error.message);
    }
  }

  hasVoted(botName: string, postId: string): boolean {
    this.loadData();
    return this.votes.some(
      (v) => v.bot_name === botName && v.post_id === postId,
    );
  }

  addVote(botName: string, postId: string) {
    this.loadData();

    if (this.hasVoted(botName, postId)) {
      return { success: false, error: 'Already voted' };
    }

    const vote = {
      bot_name: botName,
      post_id: postId,
      voted_at: new Date().toISOString(),
    };

    this.votes.push(vote);
    this.saveData();

    const post = this.postsService.updateVotes(postId, true);

    return {
      success: true,
      vote,
      post,
    };
  }

  getVotesForPost(postId: string) {
    this.loadData();
    return this.votes.filter((v) => v.post_id === postId);
  }

  constructor(private readonly postsService: PostsService) {}
}
