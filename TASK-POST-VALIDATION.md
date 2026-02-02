# Задача: Валидация постов Moltbook (Queue-based)

## 🎯 Архитектура

```
POST /submit {url}
    ↓
URL в БД? → ДА → return existing (если approved)
    ↓ НЕТ
INSERT status="pending" → return { id, status: "pending" }
    ↓
[BACKGROUND WORKER]
    SELECT * FROM projects WHERE status='pending' LIMIT 1
    ↓
    Moltbook API → valid? → status = "approved"
                → invalid? → DELETE (не показываем в UI)
                → error? → retry_count++ (max 3, потом delete)
```

## ⚡ Ключевые решения

| Вопрос | Решение |
|--------|---------|
| Где хранить очередь? | SQLite (status='pending') — переживает рестарт |
| Pending в UI? | НЕТ — только approved показываем |
| Что делать с rejected? | Удаляем — юзер может попробовать снова |

---

## 🔧 Изменения в БД

```sql
ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'approved';
ALTER TABLE projects ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN validation_error TEXT;
```

---

## 🔧 Код

### 1. MoltbookService (без изменений)

```typescript
// src/moltbook/moltbook.service.ts
@Injectable()
export class MoltbookService {
  private readonly API = 'https://www.moltbook.com/api/v1';

  async validate(url: string): Promise<{ ok: boolean; error?: string }> {
    const postId = url.match(/moltbook\.com\/post\/([a-f0-9-]{36})/i)?.[1];
    if (!postId) return { ok: false, error: 'Invalid URL' };

    const res = await fetch(`${this.API}/posts/${postId}`);
    if (res.status === 404) return { ok: false, error: 'Post not found' };
    if (!res.ok) throw new Error('API error');

    const post = (await res.json()).post;
    const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
    
    if (hoursAgo > 2) return { ok: false, error: `Post is ${hoursAgo.toFixed(1)}h old` };
    return { ok: true };
  }
}
```

### 2. ValidationWorker

```typescript
// src/moltbook/validation.worker.ts
@Injectable()
export class ValidationWorker implements OnModuleInit {
  private readonly MAX_RETRIES = 3;
  
  constructor(
    private db: DatabaseService,
    private moltbook: MoltbookService,
  ) {}

  onModuleInit() {
    setInterval(() => this.processOne(), 2000);  // каждые 2 сек
  }

  private async processOne() {
    const pending = this.db.prepare(`
      SELECT * FROM projects 
      WHERE status = 'pending' AND retry_count < ?
      ORDER BY created_at LIMIT 1
    `).get(this.MAX_RETRIES);

    if (!pending) return;

    try {
      const { ok, error } = await this.moltbook.validate(pending.url);
      
      if (ok) {
        this.db.prepare(`UPDATE projects SET status = 'approved' WHERE id = ?`).run(pending.id);
      } else {
        // Invalid post → удаляем
        this.db.prepare(`DELETE FROM projects WHERE id = ?`).run(pending.id);
      }
    } catch (e) {
      // API error → retry
      this.db.prepare(`UPDATE projects SET retry_count = retry_count + 1 WHERE id = ?`).run(pending.id);
    }
  }
}
```

### 3. PostsService — изменённые методы

```typescript
// create() — insert с pending
async create(url: string, description: string, submittedBy: string) {
  const existing = this.db.prepare(`SELECT * FROM projects WHERE url = ? AND status = 'approved'`).get(url);
  if (existing) return existing;

  // Insert как pending
  const id = `proj_${Date.now()}`;
  this.db.prepare(`
    INSERT INTO projects (id, url, description, submitted_by, status, votes, created_at)
    VALUES (?, ?, ?, ?, 'pending', 0, ?)
  `).run(id, url, description, submittedBy, new Date().toISOString());

  return { id, status: 'pending' };
}

// getAll() — только approved
async getAll(limit = 50) {
  return this.db.prepare(`SELECT * FROM projects WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?`).all(limit);
}

// getTop() — только approved  
async getTop(limit = 10) {
  return this.db.prepare(`SELECT * FROM projects WHERE status = 'approved' ORDER BY votes DESC LIMIT ?`).all(limit);
}
```

---

## ✅ Чеклист

- [ ] Миграция: добавить `status`, `retry_count` колонки
- [ ] Создать `src/moltbook/moltbook.service.ts`
- [ ] Создать `src/moltbook/validation.worker.ts`
- [ ] Обновить `PostsService.create()` — insert pending
- [ ] Обновить все SELECT запросы — `WHERE status = 'approved'`
- [ ] Тест: submit → pending → worker → approved
- [ ] Тест: restart → pending всё ещё обрабатываются
