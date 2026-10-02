import { LedgerRepository } from '../repositories/LedgerRepository';
import {
  GroupRepository,
  MemberRepository,
  ExpenseRepository,
  SettlementRepository,
  ActivityRepository,
  SettingsRepository,
  DashboardRepository,
} from '../repositories/Repositories';
import { calculateBalances } from './BalanceService';
import { settle } from './SettlementService';
import EqualSplitStrategy from '../strategies/EqualSplitStrategy';
import { eventBus } from '../events/EventBus';
import { integer, add, CURRENCIES } from '../utils/money';
const now = () => new Date().toISOString();
export const CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Shopping',
  'Entertainment',
  'Bills',
  'Other',
];
function required(value, label) {
  const s = String(value || '').trim();
  if (!s) throw new Error(`${label} is required.`);
  if (s.length > 200)
    throw new Error(`${label} must be 200 characters or fewer.`);
  return s;
}
function email(value) {
  const s = String(value || '').trim();
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    throw new Error('Enter a valid email or leave it blank.');
  return s;
}
export class AppService {
  constructor(db) {
    this.ledger = new LedgerRepository(db);
    this.groups = new GroupRepository(db);
    this.members = new MemberRepository(db);
    this.expenses = new ExpenseRepository(db);
    this.settlements = new SettlementRepository(db);
    this.activities = new ActivityRepository(db);
    this.settings = new SettingsRepository(db);
    this.dashboardRepository = new DashboardRepository(db);
    this.undoCommand = null;
  }
  async mutate(action) {
    let result;
    await this.ledger.transaction(async (tx) => {
      result = await action(tx);
    });
    eventBus.emit({ type: 'dataChanged' });
    return result;
  }
  async dashboard() {
    const [groups, selves, pending, expenses] = await Promise.all([
      this.groups.all(),
      this.dashboardRepository.selfBalances(),
      this.dashboardRepository.pending(),
      this.expenses.list({ limit: 5 }),
    ]);
    const buckets = {};
    for (const self of selves) {
      integer(self.balance);
      const bucket =
        buckets[self.currency] ||
        (buckets[self.currency] = { owe: 0, owed: 0 });
      if (self.balance < 0) bucket.owe = add(bucket.owe, -self.balance);
      else bucket.owed = add(bucket.owed, self.balance);
    }
    return {
      groups,
      buckets,
      pending: pending.map((p) => ({
        ...p,
        group: { name: p.group_name, id: p.group_id, currency: p.currency },
      })),
      expenses,
      linked: selves.length > 0,
    };
  }
  async log(tx, groupId, message, amount = null, currency = null) {
    await tx.insertActivity(groupId, message, amount, currency, now());
  }
  async invalidate(tx, groupId) {
    await tx.bumpGroupRevision(groupId);
    await tx.invalidateRuns(groupId);
  }
  async saveProfile(data) {
    const name = required(data.name, 'Name'),
      mail = email(data.email);
    if (!CURRENCIES.includes(data.currency))
      throw new Error('Choose a supported currency.');
    await this.mutate(async (tx) => {
      await tx.upsertProfile(name, mail, data.currency);
      await tx.completeOnboarding();
    });
  }
  setSetting(key, value) {
    return this.mutate((tx) => tx.upsertSetting(key, value));
  }
  async saveGroup(data, id = null) {
    const name = required(data.name, 'Group name');
    return this.mutate(async (tx) => {
      if (id) {
        const exists = await tx.findGroup(id);
        if (!exists) throw new Error('Group no longer exists.');
        await tx.updateGroup(name, data.description || '', id);
        await this.log(tx, id, `Updated group ${name}`);
        return id;
      }
      const profile = await tx.getProfile();
      if (!profile) throw new Error('Create your local profile first.');
      const row = await tx.insertGroup(
        name,
        data.description || '',
        profile.currency,
        now(),
      );
      await this.log(tx, row.lastInsertRowId, `Created group ${name}`);
      return row.lastInsertRowId;
    });
  }
  deleteGroup(id) {
    this.undoCommand = null;
    return this.mutate((tx) => tx.deleteGroup(id));
  }
  async saveMember(groupId, data, id = null) {
    const name = required(data.name, 'Member name'),
      mail = email(data.email);
    return this.mutate(async (tx) => {
      if (!(await tx.findGroup(groupId)))
        throw new Error('Group no longer exists.');
      const duplicate = await tx.findDuplicateMember(groupId, name, id || -1);
      if (duplicate) throw new Error('A member with this name already exists.');
      if (data.is_self) await tx.unlinkSelf(groupId);
      if (id) {
        const found = await tx.findGroupMember(id, groupId);
        if (!found) throw new Error('Member no longer exists.');
        await tx.updateMember(name, mail, data.is_self ? 1 : 0, id);
      } else await tx.insertMember(groupId, name, mail, data.is_self ? 1 : 0);
      await this.log(tx, groupId, `${id ? 'Updated' : 'Added'} member ${name}`);
    });
  }
  removeMember(id) {
    return this.mutate(async (tx) => {
      const m = await tx.getMember(id);
      if (!m) throw new Error('Member no longer exists.');
      const used = await tx.countMemberHistory(id, id, id, id);
      if (used.count)
        throw new Error(
          'This member is part of expense or payment history and cannot be removed.',
        );
      await tx.deleteMember(id);
      await this.log(tx, m.group_id, `Removed member ${m.name}`);
    });
  }
  async writeExpense(data, id = null) {
    const description = required(data.description, 'Description');
    integer(data.amount);
    if (data.amount <= 0)
      throw new Error('Expense amount must be greater than zero.');
    if (!CATEGORIES.includes(data.category))
      throw new Error('Choose a category.');
    const expenseDate = new Date(`${data.date}T12:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      !Number.isFinite(expenseDate.getTime()) ||
      expenseDate.toISOString().slice(0, 10) !== data.date
    )
      throw new Error('Enter a valid date as YYYY-MM-DD.');
    return this.mutate(async (tx) => {
      const group = await tx.getGroup(data.group_id);
      if (!group) throw new Error('Group no longer exists.');
      const members = await tx.getGroupMembers(group.id),
        ids = new Set(members.map((m) => m.id));
      if (!ids.has(data.payer_id))
        throw new Error('Choose a payer from this group.');
      if (!data.participantIds?.length)
        throw new Error('Choose at least one participant.');
      if (data.participantIds.some((p) => !ids.has(p)))
        throw new Error('Participants must belong to this group.');
      const total = await tx.sumOtherExpenses(group.id, id || -1);
      add(total.total, data.amount);
      const shares = new EqualSplitStrategy().split(
        data.amount,
        data.participantIds,
      );
      if (id) {
        const previous = await tx.getExpenseGroup(id);
        if (!previous) throw new Error('Expense no longer exists.');
        if (previous.group_id !== group.id)
          throw new Error('An existing expense cannot move to another group.');
        await tx.updateExpense(
          description,
          data.amount,
          data.category,
          data.payer_id,
          data.date,
          data.notes || '',
          id,
        );
        await tx.deleteShares(id);
      } else {
        const row = await tx.insertExpense(
          group.id,
          description,
          data.amount,
          data.category,
          data.payer_id,
          data.date,
          data.notes || '',
          now(),
        );
        id = row.lastInsertRowId;
      }
      for (const s of shares) await tx.insertShare(id, s.memberId, s.share);
      await this.invalidate(tx, group.id);
      await this.log(
        tx,
        group.id,
        `${members.find((m) => m.id === data.payer_id).name} saved “${description}”`,
        data.amount,
        group.currency,
      );
      return id;
    });
  }
  async removeExpense(id) {
    return this.mutate(async (tx) => {
      const e = await tx.getExpenseWithCurrency(id);
      if (!e) throw new Error('Expense no longer exists.');
      await tx.deleteExpense(id);
      await this.invalidate(tx, e.group_id);
      await this.log(
        tx,
        e.group_id,
        `Deleted “${e.description}”`,
        e.amount,
        e.currency,
      );
    });
  }
  async execute(command) {
    const result = await command.execute();
    this.undoCommand = command;
    return result;
  }
  async undo() {
    if (!this.undoCommand) throw new Error('Nothing to undo.');
    const command = this.undoCommand;
    await command.undo();
    this.undoCommand = null;
  }
  async groupData(id) {
    const group = await this.groups.get(id);
    if (!group) throw new Error('Group no longer exists.');
    const [members, expenses, paid, run] = await Promise.all([
      this.members.all(id),
      this.expenses.all(id),
      this.settlements.paid(id),
      this.settlements.latest(id),
    ]);
    return {
      group,
      members,
      expenses,
      paid,
      run,
      balances: calculateBalances(members, expenses, paid),
    };
  }
  async generate(id, method) {
    const data = await this.groupData(id);
    const result = settle(data.balances, method);
    return this.mutate(async (tx) => {
      const g = await tx.getRevision(id);
      if (!g || g.revision !== data.group.revision)
        throw new Error('Balances changed. Please calculate again.');
      await tx.invalidateRuns(id);
      const row = await tx.insertRun(
        id,
        method,
        g.revision,
        result.elapsed,
        now(),
      );
      for (const p of result.payments)
        await tx.insertPayment(row.lastInsertRowId, p.from, p.to, p.amount);
      await this.log(
        tx,
        id,
        `Calculated ${method === 'greedy' ? 'Fast' : 'Optimal'} Settlement`,
      );
      return row.lastInsertRowId;
    });
  }
  markPaid(id) {
    this.undoCommand = null;
    return this.mutate(async (tx) => {
      const p = await tx.getPaymentPlan(id);
      if (!p || !p.valid)
        throw new Error(
          'This recommendation is outdated. Calculate a new plan.',
        );
      if (p.paid) throw new Error('This payment is already recorded.');
      const group = await tx.getGroup(p.group_id);
      if (group.revision !== p.revision)
        throw new Error('Balances changed. Calculate again.');
      await tx.markPaid(now(), id);
      // Reject plans calculated from a snapshot taken before this payment.
      await tx.bumpGroupRevision(p.group_id);
      await tx.bumpRunRevision(p.run_id);
      const from = await tx.getMemberName(p.from_id),
        to = await tx.getMemberName(p.to_id);
      await this.log(
        tx,
        p.group_id,
        `${from.name} marked payment to ${to.name} as paid`,
        p.amount,
        group.currency,
      );
    });
  }
  async loadDemo() {
    return this.mutate(async (tx) => {
      if (await tx.getDemoFlag())
        throw new Error('Demo data has already been loaded.');
      const profile = await tx.getProfile();
      if (!profile) throw new Error('Create your local profile first.');
      const group = await tx.insertGroup(
          'Kandy Trip',
          'A weekend away · demo group',
          profile.currency,
          now(),
        ),
        groupId = group.lastInsertRowId;
      for (const name of ['Abi', 'Nimal', 'Kamal', 'Ravi'])
        await tx.insertMember(groupId, name, '', name === profile.name ? 1 : 0);
      const members = await tx.getGroupMembers(groupId);
      const d = new Date(),
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      for (const [description, amount, category, payer] of [
        ['Hotel', 1200000, 'Accommodation', 0],
        ['Food', 450000, 'Food', 1],
        ['Fuel', 320000, 'Transport', 2],
        ['Tickets', 200000, 'Entertainment', 3],
      ]) {
        const row = await tx.insertExpense(
          groupId,
          description,
          amount,
          category,
          members[payer].id,
          date,
          'Demo expense',
          now(),
        );
        for (const share of new EqualSplitStrategy().split(
          amount,
          members.map((m) => m.id),
        ))
          await tx.insertShare(
            row.lastInsertRowId,
            share.memberId,
            share.share,
          );
        await this.log(
          tx,
          groupId,
          `${members[payer].name} added “${description}”`,
          amount,
          profile.currency,
        );
      }
      await tx.upsertSetting('demoLoaded', '1');
      await this.log(tx, groupId, 'Loaded Kandy Trip demo data');
      return groupId;
    });
  }
  markPending(id) {
    this.undoCommand = null;
    return this.mutate(async (tx) => {
      const p = await tx.getPaidPayment(id);
      if (!p) throw new Error('This payment is not recorded as paid.');
      await tx.markPending(id);
      await this.invalidate(tx, p.group_id);
      await this.log(
        tx,
        p.group_id,
        'Corrected a recorded payment: changed back to pending',
      );
    });
  }
  async reset() {
    this.undoCommand = null;
    return this.mutate(async (tx) => {
      await tx.resetAll();
    });
  }
}
