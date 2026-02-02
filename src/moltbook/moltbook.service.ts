import { Injectable } from '@nestjs/common';

interface MoltbookPost {
  id: string;
  created_at: string;
  title: string;
}

@Injectable()
export class MoltbookService {
  private readonly API = 'https://www.moltbook.com/api/v1';
  private readonly MAX_HOURS_OLD = 8;

  /**
   * Normalize Moltbook URL to canonical format
   * Converts /t/uuid, /p/uuid to /post/uuid
   */
  normalizeUrl(url: string): string | null {
    // Match moltbook.com with any path that ends with a UUID
    const match = url.match(/moltbook\.com\/(?:post|p|t)\/([a-f0-9-]{36})/i);
    if (!match) return null;
    
    const uuid = match[1];
    return `https://www.moltbook.com/post/${uuid}`;
  }

  /**
   * Extract post ID from Moltbook URL (any format)
   */
  extractPostId(url: string): string | null {
    const match = url.match(/moltbook\.com\/(?:post|p|t)\/([a-f0-9-]{36})/i);
    return match?.[1] || null;
  }

  /**
   * Check if URL is a Moltbook post (any format)
   */
  isMoltbookUrl(url: string): boolean {
    return /moltbook\.com\/(?:post|p|t)\/[a-f0-9-]{36}/i.test(url);
  }

  /**
   * Fetch post from Moltbook API
   */
  async getPost(postId: string): Promise<MoltbookPost | null> {
    try {
      const res = await fetch(`${this.API}/posts/${postId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('API error');
      return (await res.json()).post;
    } catch {
      throw new Error('Failed to fetch from Moltbook');
    }
  }

  /**
   * Validate a Moltbook post URL
   * Returns { ok: true, normalizedUrl } if valid
   */
  async validate(url: string): Promise<{ ok: boolean; error?: string; normalizedUrl?: string }> {
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) {
      return { ok: false, error: 'Invalid Moltbook URL format' };
    }

    const postId = this.extractPostId(url);
    if (!postId) {
      return { ok: false, error: 'Invalid Moltbook URL format' };
    }

    const post = await this.getPost(postId);
    if (!post) {
      return { ok: false, error: 'Post not found on Moltbook' };
    }

    const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
    if (hoursAgo > this.MAX_HOURS_OLD) {
      return { ok: false, error: `Post is ${hoursAgo.toFixed(1)}h old (max: ${this.MAX_HOURS_OLD}h)` };
    }

    return { ok: true, normalizedUrl };
  }
}
