import { add } from '../utils/money';
export function calculateBalances(members, expenses, payments = []) {
  const map = new Map(
    members.map((m) => [m.id, { ...m, paid: 0, share: 0, balance: 0 }]),
  );
  const get = (id) => {
    if (!map.has(id)) throw new Error('Expense references a missing member.');
    return map.get(id);
  };
  expenses.forEach((e) => {
    const p = get(e.payer_id);
    p.paid = add(p.paid, e.amount);
    p.balance = add(p.balance, e.amount);
    e.participants.forEach((s) => {
      const m = get(s.memberId);
      m.share = add(m.share, s.share);
      m.balance = add(m.balance, -s.share);
    });
  });
  payments.forEach((p) => {
    const f = get(p.from_id),
      t = get(p.to_id);
    f.balance = add(f.balance, p.amount);
    t.balance = add(t.balance, -p.amount);
  });
  return [...map.values()];
}
