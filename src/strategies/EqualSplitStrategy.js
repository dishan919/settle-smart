import { integer } from '../utils/money';
export default class EqualSplitStrategy {
  split(amount, participants) {
    integer(amount);
    if (amount <= 0)
      throw new Error('Expense amount must be greater than zero.');
    const ids = [...new Set(participants)].sort((a, b) => a - b);
    if (!ids.length) throw new Error('Choose at least one participant.');
    const base = Math.floor(amount / ids.length),
      remainder = amount % ids.length;
    return ids.map((memberId, i) => ({
      memberId,
      share: base + (i < remainder ? 1 : 0),
    }));
  }
}
