import { DatabaseSync } from 'node:sqlite';
/** Real SQLite test adapter for the Expo async API, with transaction rollback. */
export function openTestDatabase(path = ':memory:') {
  const native = new DatabaseSync(path);
  const db = {
    native,
    async execAsync(sql) {
      native.exec(sql);
    },
    async runAsync(sql, ...params) {
      const result = native.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    async getFirstAsync(sql, ...params) {
      return native.prepare(sql).get(...params) || null;
    },
    async getAllAsync(sql, ...params) {
      return native.prepare(sql).all(...params);
    },
    async withExclusiveTransactionAsync(fn) {
      native.exec('BEGIN IMMEDIATE');
      try {
        await fn(db);
        native.exec('COMMIT');
      } catch (e) {
        native.exec('ROLLBACK');
        throw e;
      }
    },
    close() {
      native.close();
    },
  };
  return db;
}
