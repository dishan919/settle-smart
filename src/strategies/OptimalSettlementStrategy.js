import SettlementStrategy, { validateBalances } from './SettlementStrategy';
import GreedySettlementStrategy from './GreedySettlementStrategy';
import { add } from '../utils/money';
export const OPTIMAL_LIMIT = 10;
/** Exact zero-sum partition DP: O(3^n) time, O(2^n) memory, capped at 10. */
export default class OptimalSettlementStrategy extends SettlementStrategy {
  calculate(balances) {
    validateBalances(balances);
    const b = balances.filter((x) => x.balance !== 0),
      n = b.length;
    if (n > OPTIMAL_LIMIT)
      throw new Error(
        'Optimal mode is available for small groups only (10 non-zero balances). Use Fast Settlement for this group.',
      );
    if (!n) return [];
    const count = 1 << n,
      sums = Array(count).fill(0),
      dp = Array(count).fill(-Infinity),
      choice = Array(count).fill(0);
    dp[0] = 0;
    for (let mask = 1; mask < count; mask++) {
      const bit = mask & -mask,
        i = 31 - Math.clz32(bit);
      sums[mask] = add(sums[mask ^ bit], b[i].balance);
    }
    for (let mask = 1; mask < count; mask++) {
      if (sums[mask] !== 0) continue;
      const first = mask & -mask;
      for (let sub = mask; sub; sub = (sub - 1) & mask)
        if (sub & first && sums[sub] === 0 && dp[mask ^ sub] + 1 > dp[mask]) {
          dp[mask] = dp[mask ^ sub] + 1;
          choice[mask] = sub;
        }
    }
    const result = [],
      greedy = new GreedySettlementStrategy();
    let mask = count - 1;
    while (mask) {
      const sub = choice[mask];
      result.push(...greedy.calculate(b.filter((_, i) => sub & (1 << i))));
      mask ^= sub;
    }
    return result;
  }
}
