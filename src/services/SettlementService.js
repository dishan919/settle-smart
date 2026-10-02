import { createSettlementStrategy } from '../factories/SettlementStrategyFactory';
import { add } from '../utils/money';
export function settle(balances, method) {
  const start = globalThis.performance?.now() ?? Date.now();
  const payments = createSettlementStrategy(method).calculate(balances);
  const elapsed = (globalThis.performance?.now() ?? Date.now()) - start;
  const remaining = new Map(balances.map((b) => [b.id, b.balance]));
  payments.forEach((p) => {
    remaining.set(p.from, add(remaining.get(p.from), p.amount));
    remaining.set(p.to, add(remaining.get(p.to), -p.amount));
  });
  if ([...remaining.values()].some((v) => v !== 0))
    throw new Error('Settlement verification failed.');
  return { payments, elapsed, method };
}
