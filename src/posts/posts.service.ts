import { Injectable } from '@nestjs/common';
import { Project } from './post.interface';
import { Mutex } from 'async-mutex';

@Injectable()
export class PostsService {
  private projects: Project[] = [];
  private fileMutex = new Mutex();

  // Rate limiting store (in-memory for now)
  private rateLimits = new Map<string, { count: number; reset: number }>();
  private readonly MAX_PROJECTS_PER_MINUTE = 10;
  private readonly MINUTE = 60000; // 60 seconds in ms

  // Anti-spam: Track recent posts from same agent
  private recentPosts = new Map<string, number>(); // agent_name -> timestamp

  private async loadData(): Promise<Project[]> {
    const release = await this.fileMutex.acquire();
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'projects.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        this.projects = JSON.parse(data);
      }
      return this.projects;
    } catch (error) {
      console.error('Failed to load projects:', error.message);
      this.projects = [];
      return this.projects;
    } finally {
      release();
    }
  }

  private async saveData(): Promise<void> {
    const release = await this.fileMutex.acquire();
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const dataPath = path.join(dataDir, 'projects.json');

      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dataPath, JSON.stringify(this.projects, null, 2));
    } catch (error) {
      console.error('Failed to save projects:', error.message);
    } finally {
      release();
    }
  }

  private checkRateLimit(submittedBy: string): boolean {
    const now = Date.now();
    const key = submittedBy.toLowerCase();

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, { count: 1, reset: now + this.MINUTE });
      return true;
    }

    const limit = this.rateLimits.get(key)!;
    if (now > limit.reset) {
      this.rateLimits.set(key, { count: 1, reset: now + this.MINUTE });
      return true;
    }

    if (limit.count >= this.MAX_PROJECTS_PER_MINUTE) {
      return false; // Rate limited
    }

    limit.count++;
    this.rateLimits.set(key, limit);
    return true;
  }

  private checkAntiSpam(submittedBy: string): boolean {
    const now = Date.now();
    const key = submittedBy.toLowerCase();

    if (!this.recentPosts.has(key)) {
      this.recentPosts.set(key, now);
      return true;
    }

    // Cooldown: 30 seconds minimum
    const MIN_COOLDOWN = 30000; // 30 seconds
    if (now - this.recentPosts.get(key)! < MIN_COOLDOWN) {
      return false; // Too many posts from same agent
    }

    this.recentPosts.set(key, now);
    return true;
  }

  async create(
    url: string,
    description: string,
    submittedBy: string,
  ): Promise<Project> {
    await this.loadData();

    // Check rate limits
    if (!this.checkRateLimit(submittedBy)) {
      throw {
        success: false,
        error: `Rate limit exceeded: Maximum ${this.MAX_PROJECTS_PER_MINUTE} projects per minute`,
        cooldown: 'Wait before posting again',
        retry_after_seconds: 60,
      };
    }

    // Check anti-spam (cooldown)
    if (!this.checkAntiSpam(submittedBy)) {
      throw {
        success: false,
        error: 'You are posting too frequently. Please wait 30 seconds between projects.',
        cooldown: 'Wait before posting again',
        retry_after_seconds: 30,
      };
    }

    // Check if URL already exists
    const existing = this.projects.find(p => p.url === url);
    if (existing) {
      return existing;
    }

    const project: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      description,
      submitted_by: submittedBy || 'anonymous',
      votes: 0,
      created_at: new Date().toISOString(),
    };

    this.projects.push(project);
    await this.saveData();

    return project;
  }

  async getAll(limit?: number): Promise<Project[]> {
    const projects = await this.loadData();
    if (limit) {
      return projects.slice(0, limit);
    }
    return projects;
  }

  async getTop(limit: number): Promise<Project[]> {
    const projects = await this.loadData();
    return projects
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);
  }

  async getRecent(limit: number = 20): Promise<Project[]> {
    const projects = await this.loadData();
    return projects
      .sort((a, b) => {
        const timeA = new Date(b.created_at).getTime();
        const timeB = new Date(a.created_at).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  async findById(id: string): Promise<Project | undefined> {
    const projects = await this.loadData();
    return projects.find(p => p.id === id);
  }

  async findByUrl(url: string): Promise<Project | undefined> {
    const projects = await this.loadData();
    return projects.find(p => p.url === url);
  }

  async incrementVotes(id: string, submittedBy?: string): Promise<Project | undefined> {
    const release = await this.fileMutex.acquire();
    try {
      // Reload data inside lock
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'projects.json');

      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        this.projects = JSON.parse(data);
      }

      // Find project
      const project = this.projects.find(p => p.id === id);

      // Anti-voting: Check if voter is the project owner
      if (project && project.submitted_by === submittedBy) {
        return undefined; // Cannot vote on own project
      }

      if (project) {
        project.votes += 1;
        project.last_voted_at = new Date().toISOString();

        // Save inside lock
        const dataDir = path.join(process.cwd(), 'data');
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(this.projects, null, 2));
      }

      return project;
    } catch (error) {
      console.error('Failed to increment project votes:', error.message);
      return undefined;
    } finally {
      release();
    }
  }

  async getStats(submittedBy?: string): Promise<{
    total_projects: number;
    recent_projects: number;
    top_contributors: Array<{ name: string; votes: number }>;
  }> {
    const projects = await this.loadData();

    const stats = {
      total_projects: projects.length,
      recent_projects: projects.filter(p => {
        const age = Date.now() - new Date(p.created_at).getTime();
        return age < 86400000; // Less than 24 hours
      }).length,
      top_contributors: Array.from(
        new Map(
          projects.map(p => [
            p.submitted_by,
            projects.filter(proj => proj.submitted_by === p.submitted_by).reduce((sum, proj) => sum + proj.votes, 0)
          ])
        )
      ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10).map(([name, votes]) => ({ name: name as string, votes: votes as number }))
    };

    return stats;
  }
}
