import { Injectable, OnModuleInit } from '@nestjs/common';
import { Project } from './post.interface';
import * as path from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require('better-sqlite3');

@Injectable()
export class PostsService implements OnModuleInit {
  private db: any;

  onModuleInit() {
    const dataDir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dataDir, { recursive: true });

    this.db = new Database(path.join(dataDir, 'curator.db'));
    this.db.pragma('journal_mode = WAL'); // Fast writes
    this.db.pragma('synchronous = NORMAL'); // Good balance of safety/speed

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        submitted_by TEXT DEFAULT 'anonymous',
        votes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_voted_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_projects_votes ON projects(votes DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_url ON projects(url);

      CREATE TABLE IF NOT EXISTS archives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        archived_at TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_archives_date ON archives(archived_at DESC);
    `);
  }

  async create(url: string, description: string, submittedBy: string): Promise<Project> {
    // Check if exists
    const existing = this.db.prepare('SELECT * FROM projects WHERE url = ?').get(url) as Project | undefined;
    if (existing) {
      return existing;
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created_at = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, url, description, submitted_by, votes, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    stmt.run(id, url, description || '', submittedBy || 'anonymous', created_at);

    return { id, url, description: description || '', submitted_by: submittedBy || 'anonymous', votes: 0, created_at };
  }

  async getAll(limit: number = 50): Promise<Project[]> {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ?').all(limit) as Project[];
  }

  async getTop(limit: number = 10): Promise<Project[]> {
    return this.db.prepare('SELECT * FROM projects ORDER BY votes DESC LIMIT ?').all(limit) as Project[];
  }

  async getRecent(limit: number = 20): Promise<Project[]> {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ?').all(limit) as Project[];
  }

  async findById(id: string): Promise<Project | undefined> {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  }

  async findByUrl(url: string): Promise<Project | undefined> {
    return this.db.prepare('SELECT * FROM projects WHERE url = ?').get(url) as Project | undefined;
  }

  async incrementVotes(id: string, submittedBy?: string): Promise<Project | undefined> {
    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;

    if (!project) return undefined;

    // Can't vote on own post
    if (submittedBy && project.submitted_by === submittedBy) {
      return undefined;
    }

    const last_voted_at = new Date().toISOString();
    this.db.prepare('UPDATE projects SET votes = votes + 1, last_voted_at = ? WHERE id = ?').run(last_voted_at, id);

    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
  }

  async getStats(): Promise<{
    total_projects: number;
    recent_projects: number;
    top_contributors: Array<{ name: string; votes: number }>;
  }> {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };

    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const recent = this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE created_at > ?').get(dayAgo) as { count: number };

    const contributors = this.db.prepare(`
      SELECT submitted_by as name, SUM(votes) as votes
      FROM projects
      GROUP BY submitted_by
      ORDER BY votes DESC
      LIMIT 10
    `).all() as Array<{ name: string; votes: number }>;

    return {
      total_projects: total.count,
      recent_projects: recent.count,
      top_contributors: contributors,
    };
  }

  async getLatestArchive(): Promise<{
    posts: Project[];
    count: number;
    archived_at: string | null;
  }> {
    const archive = this.db.prepare('SELECT * FROM archives ORDER BY archived_at DESC LIMIT 1').get() as { archived_at: string; data: string } | undefined;

    if (!archive) {
      return { posts: [], count: 0, archived_at: null };
    }

    const posts = JSON.parse(archive.data) as Project[];
    return { posts, count: posts.length, archived_at: archive.archived_at };
  }

  // Called by reset-cycle.sh via API
  async archiveAndReset(): Promise<{ archived_count: number }> {
    const projects = this.db.prepare('SELECT * FROM projects ORDER BY votes DESC').all() as Project[];

    if (projects.length > 0) {
      const archived_at = new Date().toISOString();
      this.db.prepare('INSERT INTO archives (archived_at, data) VALUES (?, ?)').run(archived_at, JSON.stringify(projects));

      // Keep only last 42 archives (7 days * 6 per day)
      this.db.prepare('DELETE FROM archives WHERE id NOT IN (SELECT id FROM archives ORDER BY archived_at DESC LIMIT 42)').run();
    }

    // Reset projects
    this.db.prepare('DELETE FROM projects').run();

    return { archived_count: projects.length };
  }
}
