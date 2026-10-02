import MaxHeap from '../algorithms/MaxHeap';
import SettlementStrategy, { validateBalances } from './SettlementStrategy';
export default class GreedySettlementStrategy extends SettlementStrategy {
  calculate(balances) {
    validateBalances(balances);
    const compare = (a, b) =>
      a.amount - b.amount || String(b.id).localeCompare(String(a.id));
    const creditors = new MaxHeap(compare),
      debtors = new MaxHeap(compare),
      payments = [];
    balances.forEach((b) => {
      if (b.balance)
        (b.balance > 0 ? creditors : debtors).insert({
          id: b.id,
          amount: Math.abs(b.balance),
        });
    });
    while (!creditors.isEmpty() && !debtors.isEmpty()) {
      const c = creditors.extractMax(),
        d = debtors.extractMax(),
        amount = Math.min(c.amount, d.amount);
      payments.push({ from: d.id, to: c.id, amount });
      c.amount -= amount;
      d.amount -= amount;
      if (c.amount) creditors.insert(c);
      if (d.amount) debtors.insert(d);
    }
    return payments;
  }
}
