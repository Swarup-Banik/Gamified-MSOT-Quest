/**
 * In-memory / Network Redis client adapter.
 * Provides sorted sets (ZADD, ZREVRANGE, ZREVRANK, ZSCORE), hash storage,
 * sliding-window rate limiting, and pub/sub for real-time WebSocket distribution.
 */

export interface SortedSetMember {
  member: string;
  score: number;
}

export class RedisService {
  private kv = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();
  private sortedSets = new Map<string, Map<string, number>>();
  private subscribers = new Map<string, Set<(message: string) => void>>();

  // Key-Value
  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.kv.set(key, value);
    if (ttlSeconds && ttlSeconds > 0) {
      setTimeout(() => {
        if (this.kv.get(key) === value) {
          this.kv.delete(key);
        }
      }, ttlSeconds * 1000);
    }
  }

  async del(key: string): Promise<boolean> {
    const deleted = this.kv.delete(key);
    this.hashes.delete(key);
    this.sortedSets.delete(key);
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const val = parseInt(this.kv.get(key) || '0', 10) + 1;
    this.kv.set(key, val.toString());
    return val;
  }

  // Hashes
  async hget(key: string, field: string): Promise<string | null> {
    const h = this.hashes.get(key);
    return h ? (h.get(field) ?? null) : null;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    let h = this.hashes.get(key);
    if (!h) {
      h = new Map();
      this.hashes.set(key, h);
    }
    h.set(field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const h = this.hashes.get(key);
    if (!h) return {};
    const obj: Record<string, string> = {};
    for (const [k, v] of h.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  // Sorted Sets
  async zadd(key: string, score: number, member: string): Promise<void> {
    let zset = this.sortedSets.get(key);
    if (!zset) {
      zset = new Map();
      this.sortedSets.set(key, zset);
    }
    zset.set(member, score);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const zset = this.sortedSets.get(key);
    if (!zset) return null;
    return zset.has(member) ? (zset.get(member) ?? null) : null;
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    const list = await this.zrevrangeWithScores(key, 0, -1);
    const index = list.findIndex(item => item.member === member);
    return index !== -1 ? index : null;
  }

  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<SortedSetMember[]> {
    const zset = this.sortedSets.get(key);
    if (!zset) return [];
    const entries = Array.from(zset.entries()).map(([member, score]) => ({ member, score }));
    // Sort descending by score
    entries.sort((a, b) => b.score - a.score);

    const actualStop = stop === -1 ? entries.length : stop + 1;
    return entries.slice(start, actualStop);
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<number> {
    const subs = this.subscribers.get(channel);
    if (!subs) return 0;
    subs.forEach(callback => {
      try {
        callback(message);
      } catch (err) {
        console.error('PubSub handler error', err);
      }
    });
    return subs.size;
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<() => void> {
    let subs = this.subscribers.get(channel);
    if (!subs) {
      subs = new Set();
      this.subscribers.set(channel, subs);
    }
    subs.add(callback);
    return () => {
      subs?.delete(callback);
    };
  }

  // Rate Limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const current = await this.incr(key);
    if (current === 1) {
      setTimeout(() => this.del(key), windowSeconds * 1000);
    }
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }

  async flushAll(): Promise<void> {
    this.kv.clear();
    this.hashes.clear();
    this.sortedSets.clear();
  }
}

export const redis = new RedisService();
