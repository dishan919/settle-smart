import { openTestDatabase } from './sqliteAdapter';
import { initializeDatabase } from '../src/database/schema';
import { AppService } from '../src/services/AppService';
import {
  AddExpenseCommand,
  UpdateExpenseCommand,
  DeleteExpenseCommand,
} from '../src/commands/ExpenseCommands';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let db, service, groupId, members;
beforeEach(async () => {
  db = openTestDatabase();
  await initializeDatabase(db);
  service = new AppService(db);
  await service.saveProfile({ name: 'Abi', email: '', currency: 'LKR' });
  groupId = await service.saveGroup({ name: 'Kandy Trip' });
  for (const name of ['Abi', 'Nimal', 'Kamal', 'Ravi'])
    await service.saveMember(groupId, { name, is_self: name === 'Abi' });
  members = await service.members.all(groupId);
});
afterEach(() => db.close());
function expense(amount = 1200000) {
  return {
    group_id: groupId,
    description: 'Hotel',
    amount,
    category: 'Accommodation',
    payer_id: members[0].id,
    participantIds: members.map((m) => m.id),
    date: '2026-10-02',
    notes: '',
  };
}
test('full persisted flow and migration reopen', async () => {
  await service.writeExpense(expense());
  const data = await service.groupData(groupId);
  expect(data.balances.map((b) => b.balance)).toEqual([
    900000, -300000, -300000, -300000,
  ]);
  await service.generate(groupId, 'greedy');
  let run = await service.settlements.latest(groupId);
  expect(run.transactions).toHaveLength(3);
  await service.markPaid(run.transactions[0].id);
  run = await service.settlements.latest(groupId);
  expect(run.transactions.filter((t) => t.paid)).toHaveLength(1);
  for (const p of run.transactions.filter((t) => !t.paid))
    await service.markPaid(p.id);
  expect(
    (await service.groupData(groupId)).balances.every((b) => b.balance === 0),
  ).toBe(true);
  await initializeDatabase(db);
  expect((await service.settings.profile()).name).toBe('Abi');
  expect((await service.activities.all()).length).toBeGreaterThan(5);
});
test('paid records survive edited expense; pending plans invalidated', async () => {
  const id = await service.writeExpense(expense());
  await service.generate(groupId, 'greedy');
  const run = await service.settlements.latest(groupId);
  await service.markPaid(run.transactions[0].id);
  await service.writeExpense(expense(1600000), id);
  expect(await service.settlements.latest(groupId)).toBeNull();
  expect(await service.settlements.paid(groupId)).toHaveLength(1);
  await expect(service.markPaid(run.transactions[1].id)).rejects.toThrow(
    'outdated',
  );
  await service.generate(groupId, 'optimal');
  const updated = await service.settlements.latest(groupId);
  for (const p of updated.transactions) await service.markPaid(p.id);
  expect(
    (await service.groupData(groupId)).balances.every((b) => b.balance === 0),
  ).toBe(true);
});
test('history protects members, validates membership, rollback', async () => {
  await service.writeExpense(expense());
  await expect(service.removeMember(members[0].id)).rejects.toThrow('history');
  await expect(service.saveMember(groupId, { name: 'abi' })).rejects.toThrow(
    'already',
  );
  await expect(
    service.writeExpense({ ...expense(), payer_id: 999 }),
  ).rejects.toThrow('payer');
  await expect(
    service.writeExpense({ ...expense(), participantIds: [999] }),
  ).rejects.toThrow('Participants');
  expect(await service.expenses.all(groupId)).toHaveLength(1);
});
test('command add, update, delete and undo', async () => {
  const id = await service.execute(new AddExpenseCommand(service, expense()));
  await service.undo();
  expect(await service.expenses.all(groupId)).toHaveLength(0);
  const next = await service.writeExpense(expense());
  await service.execute(new UpdateExpenseCommand(service, next, expense(400)));
  await service.undo();
  expect((await service.expenses.get(next)).amount).toBe(1200000);
  await service.execute(new DeleteExpenseCommand(service, next));
  expect(await service.expenses.all(groupId)).toHaveLength(0);
  await service.undo();
  expect(await service.expenses.all(groupId)).toHaveLength(1);
});
test('real file persists across close and reopen', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'settlesmart-'));
  const path = join(dir, 'data.db');
  const disk = openTestDatabase(path);
  await initializeDatabase(disk);
  const s = new AppService(disk);
  await s.saveProfile({ name: 'Persistent', currency: 'LKR' });
  const persistedGroup = await s.loadDemo();
  await s.generate(persistedGroup, 'greedy');
  const persistedRun = await s.settlements.latest(persistedGroup);
  await s.markPaid(persistedRun.transactions[0].id);
  disk.close();
  const reopened = openTestDatabase(path);
  try {
    await initializeDatabase(reopened);
    expect((await new AppService(reopened).settings.profile()).name).toBe(
      'Persistent',
    );
    const restored = await new AppService(reopened).groupData(persistedGroup);
    expect(restored.members).toHaveLength(4);
    expect(restored.expenses).toHaveLength(4);
    expect(restored.paid).toHaveLength(1);
    expect(restored.run.transactions.filter((t) => t.paid)).toHaveLength(1);
  } finally {
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('demo and reset', async () => {
  await service.loadDemo();
  expect(await service.groups.all()).toHaveLength(2);
  await expect(service.loadDemo()).rejects.toThrow('already');
  await service.reset();
  expect(await service.groups.all()).toHaveLength(0);
  expect(await service.settings.profile()).toBeNull();
});
test('payment correction invalidates plan and restores balance', async () => {
  await service.writeExpense(expense());
  await service.generate(groupId, 'greedy');
  const run = await service.settlements.latest(groupId),
    payment = run.transactions[0];
  await service.markPaid(payment.id);
  await expect(service.markPaid(payment.id)).rejects.toThrow('already');
  await service.markPending(payment.id);
  expect(await service.settlements.latest(groupId)).toBeNull();
  expect(await service.settlements.paid(groupId)).toHaveLength(0);
  expect(
    (await service.groupData(groupId)).balances.map((b) => b.balance),
  ).toEqual([900000, -300000, -300000, -300000]);
});
test('group cascade deletes all dependent data', async () => {
  await service.writeExpense(expense());
  await service.generate(groupId, 'greedy');
  await service.deleteGroup(groupId);
  expect(await service.expenses.all()).toHaveLength(0);
  expect(await service.members.all(groupId)).toHaveLength(0);
  expect(await service.settlements.latest(groupId)).toBeNull();
});
test('dashboard aggregates and database filters', async () => {
  await service.writeExpense(expense());
  await service.writeExpense({
    ...expense(800),
    description: 'Food',
    category: 'Food',
    participantIds: [members[0].id, members[1].id],
  });
  const dashboard = await service.dashboard();
  expect(dashboard.buckets.LKR.owed).toBe(900400);
  expect(dashboard.linked).toBe(true);
  expect(
    await service.expenses.list({ category: 'Food', search: 'foo', groupId }),
  ).toHaveLength(1);
  expect(await service.expenses.list({ from: '2027-01-01' })).toHaveLength(0);
  expect(await service.expenses.list({ limit: 1 })).toHaveLength(1);
  expect(await service.expenses.payers(groupId)).toHaveLength(1);
});
test.each(['2026-99-99', '2026-02-30', 'bad'])(
  'date validation %s',
  async (date) => {
    await expect(service.writeExpense({ ...expense(), date })).rejects.toThrow(
      'valid date',
    );
  },
);
