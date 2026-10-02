import { add, integer } from '../utils/money';
export function validateBalances(balances) {
  const seen = new Set();
  let sum = 0;
  for (const b of balances) {
    integer(b.balance);
    if (seen.has(b.id)) throw new Error('Duplicate member.');
    seen.add(b.id);
    sum = add(sum, b.balance);
  }
  if (sum !== 0) throw new Error('Balances must sum to zero.');
}
export default class SettlementStrategy {
  calculate() {
    throw new Error('Settlement strategy must implement calculate.');
  }
}
