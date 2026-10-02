export class GroupRepository {
  constructor(db) {
    this.db = db;
  }
  all() {
    return this.db.getAllAsync(
      'SELECT g.*, (SELECT COUNT(*) FROM members m WHERE m.group_id=g.id) member_count,(SELECT COUNT(*) FROM expenses e WHERE e.group_id=g.id) expense_count,COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.group_id=g.id),0) total FROM groups g ORDER BY g.created_at DESC',
    );
  }
  get(id) {
    return this.db.getFirstAsync('SELECT * FROM groups WHERE id=?', id);
  }
}
export class MemberRepository {
  constructor(db) {
    this.db = db;
  }
  all(groupId) {
    return this.db.getAllAsync(
      'SELECT * FROM members WHERE group_id=? ORDER BY id',
      groupId,
    );
  }
}
export class ExpenseRepository {
  constructor(db) {
    this.db = db;
  }
  list({
    groupId = 0,
    search = '',
    category = 'All',
    payer = 0,
    from = '',
    to = '',
    limit = 100,
  } = {}) {
    const where = [],
      args = [];
    if (groupId) {
      where.push('e.group_id=?');
      args.push(groupId);
    }
    if (category !== 'All') {
      where.push('e.category=?');
      args.push(category);
    }
    if (payer) {
      where.push('e.payer_id=?');
      args.push(payer);
    }
    if (from) {
      where.push('e.date>=?');
      args.push(from);
    }
    if (to) {
      where.push('e.date<=?');
      args.push(to);
    }
    if (search) {
      where.push(
        "instr(lower(e.description || ' ' || e.notes || ' ' || g.name),lower(?))>0",
      );
      args.push(search);
    }
    return this.db.getAllAsync(
      `SELECT e.*,g.name group_name,g.currency,m.name payer_name FROM expenses e JOIN groups g ON g.id=e.group_id JOIN members m ON m.id=e.payer_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY e.date DESC,e.id DESC LIMIT ?`,
      ...args,
      limit,
    );
  }
  payers(groupId = 0) {
    return this.db.getAllAsync(
      `SELECT DISTINCT m.id value,m.name || ' · ' || g.name label FROM expenses e JOIN members m ON m.id=e.payer_id JOIN groups g ON g.id=e.group_id ${groupId ? 'WHERE e.group_id=?' : ''} ORDER BY m.name`,
      ...(groupId ? [groupId] : []),
    );
  }
  async all(groupId = null) {
    const rows = await this.db.getAllAsync(
      `SELECT e.*,g.name group_name,g.currency,m.name payer_name FROM expenses e JOIN groups g ON g.id=e.group_id JOIN members m ON m.id=e.payer_id ${groupId == null ? '' : 'WHERE e.group_id=?'} ORDER BY e.date DESC,e.id DESC`,
      ...(groupId == null ? [] : [groupId]),
    );
    if (!rows.length) return [];
    const shares = await this.db.getAllAsync(
      `SELECT p.* FROM expense_participants p JOIN expenses e ON e.id=p.expense_id ${groupId == null ? '' : 'WHERE e.group_id=?'}`,
      ...(groupId == null ? [] : [groupId]),
    );
    const byId = new Map();
    shares.forEach((s) => {
      if (!byId.has(s.expense_id)) byId.set(s.expense_id, []);
      byId.get(s.expense_id).push({ memberId: s.member_id, share: s.share });
    });
    return rows.map((e) => ({ ...e, participants: byId.get(e.id) || [] }));
  }
  async get(id) {
    const row = await this.db.getFirstAsync(
      'SELECT * FROM expenses WHERE id=?',
      id,
    );
    if (!row) return null;
    const participants = await this.db.getAllAsync(
      'SELECT member_id memberId,share FROM expense_participants WHERE expense_id=?',
      id,
    );
    return { ...row, participants };
  }
}
export class DashboardRepository {
  constructor(db) {
    this.db = db;
  }
  selfBalances() {
    return this.db.getAllAsync(`
    SELECT m.id,g.currency,
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.payer_id=m.id),0)
    -COALESCE((SELECT SUM(p.share) FROM expense_participants p WHERE p.member_id=m.id),0)
    +COALESCE((SELECT SUM(t.amount) FROM settlement_transactions t WHERE t.from_id=m.id AND t.paid=1),0)
    -COALESCE((SELECT SUM(t.amount) FROM settlement_transactions t WHERE t.to_id=m.id AND t.paid=1),0) balance
    FROM members m JOIN groups g ON g.id=m.group_id WHERE m.is_self=1`);
  }
  pending() {
    return this.db.getAllAsync(
      `SELECT t.*,f.name from_name,c.name to_name,g.name group_name,g.id group_id,g.currency FROM settlement_transactions t JOIN settlement_runs r ON r.id=t.run_id JOIN groups g ON g.id=r.group_id JOIN members f ON f.id=t.from_id JOIN members c ON c.id=t.to_id WHERE r.valid=1 AND t.paid=0 AND (f.is_self=1 OR c.is_self=1) ORDER BY t.id DESC LIMIT 5`,
    );
  }
}
export class SettlementRepository {
  constructor(db) {
    this.db = db;
  }
  paid(groupId) {
    return this.db.getAllAsync(
      'SELECT t.*,f.name from_name,c.name to_name FROM settlement_transactions t JOIN settlement_runs r ON r.id=t.run_id JOIN members f ON f.id=t.from_id JOIN members c ON c.id=t.to_id WHERE r.group_id=? AND t.paid=1 ORDER BY t.paid_at DESC',
      groupId,
    );
  }
  async latest(groupId) {
    const run = await this.db.getFirstAsync(
      'SELECT * FROM settlement_runs WHERE group_id=? AND valid=1 ORDER BY id DESC LIMIT 1',
      groupId,
    );
    if (!run) return null;
    return {
      ...run,
      transactions: await this.db.getAllAsync(
        'SELECT t.*,f.name from_name,c.name to_name FROM settlement_transactions t JOIN members f ON f.id=t.from_id JOIN members c ON c.id=t.to_id WHERE t.run_id=? ORDER BY t.id',
        run.id,
      ),
    };
  }
}
export class ActivityRepository {
  constructor(db) {
    this.db = db;
  }
  all(limit = 100) {
    return this.db.getAllAsync(
      'SELECT a.*,g.name group_name FROM activities a LEFT JOIN groups g ON g.id=a.group_id ORDER BY a.id DESC LIMIT ?',
      limit,
    );
  }
}
export class SettingsRepository {
  constructor(db) {
    this.db = db;
  }
  profile() {
    return this.db.getFirstAsync('SELECT * FROM profiles WHERE id=1');
  }
  async settings() {
    return Object.fromEntries(
      (await this.db.getAllAsync('SELECT * FROM app_settings')).map((s) => [
        s.key,
        s.value,
      ]),
    );
  }
}
