export const schema = `
CREATE TABLE profiles(id INTEGER PRIMARY KEY CHECK(id=1),name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL DEFAULT 'LKR');
CREATE TABLE app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE groups(id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE members(id INTEGER PRIMARY KEY,group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',is_self INTEGER NOT NULL DEFAULT 0,UNIQUE(group_id,name COLLATE NOCASE));
CREATE UNIQUE INDEX one_self_per_group ON members(group_id) WHERE is_self=1;
CREATE TABLE expenses(id INTEGER PRIMARY KEY,group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,description TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),category TEXT NOT NULL,payer_id INTEGER NOT NULL REFERENCES members(id),date TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
CREATE TABLE expense_participants(expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,member_id INTEGER NOT NULL REFERENCES members(id),share INTEGER NOT NULL CHECK(share>=0),PRIMARY KEY(expense_id,member_id));
CREATE TABLE settlement_runs(id INTEGER PRIMARY KEY,group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,method TEXT NOT NULL,revision INTEGER NOT NULL,elapsed REAL NOT NULL,valid INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE settlement_transactions(id INTEGER PRIMARY KEY,run_id INTEGER NOT NULL REFERENCES settlement_runs(id) ON DELETE CASCADE,from_id INTEGER NOT NULL REFERENCES members(id),to_id INTEGER NOT NULL REFERENCES members(id),amount INTEGER NOT NULL CHECK(amount>0),paid INTEGER NOT NULL DEFAULT 0,paid_at TEXT);
CREATE TABLE activities(id INTEGER PRIMARY KEY,group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,message TEXT NOT NULL,amount INTEGER,currency TEXT,created_at TEXT NOT NULL);
CREATE INDEX expenses_group ON expenses(group_id,date);
CREATE INDEX participants_member ON expense_participants(member_id);
CREATE INDEX runs_group ON settlement_runs(group_id,valid);
CREATE INDEX transactions_run ON settlement_transactions(run_id);
CREATE INDEX activities_date ON activities(created_at);
`;
export async function initializeDatabase(db) {
  await db.execAsync('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
  const version = await db.getFirstAsync('PRAGMA user_version');
  if (version.user_version > 1)
    throw new Error('This database requires a newer SettleSmart version.');
  if (version.user_version === 0)
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(schema);
      await tx.execAsync('PRAGMA user_version=1;');
    });
}
