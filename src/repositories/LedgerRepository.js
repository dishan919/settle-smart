/** Transaction-scoped persistence operations; all SQL stays in repositories. */
export class LedgerRepository {
  constructor(db) {
    this.db = db;
  }
  transaction(action) {
    return this.db.withExclusiveTransactionAsync((tx) =>
      action(new LedgerRepository(tx)),
    );
  }
  insertActivity(...params) {
    return this.db.runAsync(
      'INSERT INTO activities(group_id,message,amount,currency,created_at) VALUES(?,?,?,?,?)',
      ...params,
    );
  }
  bumpGroupRevision(...params) {
    return this.db.runAsync(
      'UPDATE groups SET revision=revision+1 WHERE id=?',
      ...params,
    );
  }
  invalidateRuns(...params) {
    return this.db.runAsync(
      'UPDATE settlement_runs SET valid=0 WHERE group_id=?',
      ...params,
    );
  }
  upsertProfile(...params) {
    return this.db.runAsync(
      'INSERT INTO profiles(id,name,email,currency) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,currency=excluded.currency',
      ...params,
    );
  }
  completeOnboarding(...params) {
    return this.db.runAsync(
      "INSERT INTO app_settings(key,value) VALUES('onboarded','1') ON CONFLICT(key) DO UPDATE SET value='1'",
      ...params,
    );
  }
  upsertSetting(...params) {
    return this.db.runAsync(
      'INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      ...params,
    );
  }
  findGroup(...params) {
    return this.db.getFirstAsync('SELECT id FROM groups WHERE id=?', ...params);
  }
  updateGroup(...params) {
    return this.db.runAsync(
      'UPDATE groups SET name=?,description=? WHERE id=?',
      ...params,
    );
  }
  getProfile(...params) {
    return this.db.getFirstAsync(
      'SELECT * FROM profiles WHERE id=1',
      ...params,
    );
  }
  insertGroup(...params) {
    return this.db.runAsync(
      'INSERT INTO groups(name,description,currency,created_at) VALUES(?,?,?,?)',
      ...params,
    );
  }
  deleteGroup(...params) {
    return this.db.runAsync('DELETE FROM groups WHERE id=?', ...params);
  }
  findDuplicateMember(...params) {
    return this.db.getFirstAsync(
      'SELECT id FROM members WHERE group_id=? AND name=? COLLATE NOCASE AND id!=?',
      ...params,
    );
  }
  unlinkSelf(...params) {
    return this.db.runAsync(
      'UPDATE members SET is_self=0 WHERE group_id=?',
      ...params,
    );
  }
  findGroupMember(...params) {
    return this.db.getFirstAsync(
      'SELECT id FROM members WHERE id=? AND group_id=?',
      ...params,
    );
  }
  updateMember(...params) {
    return this.db.runAsync(
      'UPDATE members SET name=?,email=?,is_self=? WHERE id=?',
      ...params,
    );
  }
  insertMember(...params) {
    return this.db.runAsync(
      'INSERT INTO members(group_id,name,email,is_self) VALUES(?,?,?,?)',
      ...params,
    );
  }
  getMember(...params) {
    return this.db.getFirstAsync('SELECT * FROM members WHERE id=?', ...params);
  }
  countMemberHistory(...params) {
    return this.db.getFirstAsync(
      'SELECT (SELECT COUNT(*) FROM expenses WHERE payer_id=?) + (SELECT COUNT(*) FROM expense_participants WHERE member_id=?) + (SELECT COUNT(*) FROM settlement_transactions WHERE from_id=? OR to_id=?) count',
      ...params,
    );
  }
  deleteMember(...params) {
    return this.db.runAsync('DELETE FROM members WHERE id=?', ...params);
  }
  getGroup(...params) {
    return this.db.getFirstAsync('SELECT * FROM groups WHERE id=?', ...params);
  }
  getGroupMembers(...params) {
    return this.db.getAllAsync(
      'SELECT * FROM members WHERE group_id=?',
      ...params,
    );
  }
  sumOtherExpenses(...params) {
    return this.db.getFirstAsync(
      'SELECT COALESCE(SUM(amount),0) total FROM expenses WHERE group_id=? AND id!=?',
      ...params,
    );
  }
  getExpenseGroup(...params) {
    return this.db.getFirstAsync(
      'SELECT group_id FROM expenses WHERE id=?',
      ...params,
    );
  }
  updateExpense(...params) {
    return this.db.runAsync(
      'UPDATE expenses SET description=?,amount=?,category=?,payer_id=?,date=?,notes=? WHERE id=?',
      ...params,
    );
  }
  deleteShares(...params) {
    return this.db.runAsync(
      'DELETE FROM expense_participants WHERE expense_id=?',
      ...params,
    );
  }
  insertExpense(...params) {
    return this.db.runAsync(
      'INSERT INTO expenses(group_id,description,amount,category,payer_id,date,notes,created_at) VALUES(?,?,?,?,?,?,?,?)',
      ...params,
    );
  }
  insertShare(...params) {
    return this.db.runAsync(
      'INSERT INTO expense_participants(expense_id,member_id,share) VALUES(?,?,?)',
      ...params,
    );
  }
  getExpenseWithCurrency(...params) {
    return this.db.getFirstAsync(
      'SELECT e.*,g.currency FROM expenses e JOIN groups g ON g.id=e.group_id WHERE e.id=?',
      ...params,
    );
  }
  deleteExpense(...params) {
    return this.db.runAsync('DELETE FROM expenses WHERE id=?', ...params);
  }
  getRevision(...params) {
    return this.db.getFirstAsync(
      'SELECT revision FROM groups WHERE id=?',
      ...params,
    );
  }
  insertRun(...params) {
    return this.db.runAsync(
      'INSERT INTO settlement_runs(group_id,method,revision,elapsed,created_at) VALUES(?,?,?,?,?)',
      ...params,
    );
  }
  insertPayment(...params) {
    return this.db.runAsync(
      'INSERT INTO settlement_transactions(run_id,from_id,to_id,amount) VALUES(?,?,?,?)',
      ...params,
    );
  }
  getPaymentPlan(...params) {
    return this.db.getFirstAsync(
      'SELECT t.*,r.group_id,r.valid,r.revision FROM settlement_transactions t JOIN settlement_runs r ON r.id=t.run_id WHERE t.id=?',
      ...params,
    );
  }
  markPaid(...params) {
    return this.db.runAsync(
      'UPDATE settlement_transactions SET paid=1,paid_at=? WHERE id=?',
      ...params,
    );
  }
  bumpRunRevision(...params) {
    return this.db.runAsync(
      'UPDATE settlement_runs SET revision=revision+1 WHERE id=?',
      ...params,
    );
  }
  getMemberName(...params) {
    return this.db.getFirstAsync(
      'SELECT name FROM members WHERE id=?',
      ...params,
    );
  }
  getDemoFlag(...params) {
    return this.db.getFirstAsync(
      "SELECT value FROM app_settings WHERE key='demoLoaded'",
      ...params,
    );
  }
  getPaidPayment(...params) {
    return this.db.getFirstAsync(
      'SELECT t.*,r.group_id FROM settlement_transactions t JOIN settlement_runs r ON r.id=t.run_id WHERE t.id=? AND t.paid=1',
      ...params,
    );
  }
  markPending(...params) {
    return this.db.runAsync(
      'UPDATE settlement_transactions SET paid=0,paid_at=NULL WHERE id=?',
      ...params,
    );
  }
  resetAll(...params) {
    return this.db.execAsync(
      'DELETE FROM settlement_transactions;DELETE FROM settlement_runs;DELETE FROM expense_participants;DELETE FROM expenses;DELETE FROM activities;DELETE FROM members;DELETE FROM groups;DELETE FROM profiles;DELETE FROM app_settings;',
      ...params,
    );
  }
}
