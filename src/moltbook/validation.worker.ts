import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MoltbookService } from './moltbook.service';
import * as path from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require('better-sqlite3');

@Injectable()
export class ValidationWorker implements OnModuleInit {
  private readonly logger = new Logger(ValidationWorker.name);
  private readonly MAX_RETRIES = 3;
  private readonly INTERVAL_MS = 2000; // Process one every 2 seconds
  private db: any;

  constructor(private readonly moltbookService: MoltbookService) {}

  onModuleInit() {
    // Connect to same database as PostsService
    const dataDir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    this.db = new Database(path.join(dataDir, 'curator.db'));

    // Start background worker
    this.logger.log('Validation worker started');
    setInterval(() => this.processOne(), this.INTERVAL_MS);
  }

  private async processOne() {
    try {
      // Get next pending project
      const pending = this.db.prepare(`
        SELECT * FROM projects 
        WHERE status = 'pending' AND retry_count < ?
        ORDER BY created_at 
        LIMIT 1
      `).get(this.MAX_RETRIES);

      if (!pending) return;

      // Skip if not a Moltbook URL
      if (!this.moltbookService.isMoltbookUrl(pending.url)) {
        this.db.prepare(`UPDATE projects SET status = 'approved' WHERE id = ?`).run(pending.id);
        this.logger.log(`Approved non-Moltbook URL: ${pending.id}`);
        return;
      }

      // Validate via Moltbook API
      const { ok, error, normalizedUrl } = await this.moltbookService.validate(pending.url);

      if (ok) {
        // Update status and normalize URL
        this.db.prepare(`UPDATE projects SET status = 'approved', url = ? WHERE id = ?`).run(normalizedUrl, pending.id);
        this.logger.log(`Approved: ${pending.id}`);
      } else {
        // Invalid post → delete (not shown in UI)
        this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(pending.id);
        this.logger.warn(`Deleted invalid post ${pending.id}: ${error}`);
      }
    } catch (e) {
      // API error → increment retry count
      const pending = this.db.prepare(`
        SELECT id FROM projects 
        WHERE status = 'pending' 
        ORDER BY created_at 
        LIMIT 1
      `).get();

      if (pending) {
        this.db.prepare(`UPDATE projects SET retry_count = retry_count + 1 WHERE id = ?`).run(pending.id);
        this.logger.error(`Retry ${pending.id}: ${e.message}`);
      }
    }
  }
}
