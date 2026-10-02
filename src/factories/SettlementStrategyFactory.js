import GreedySettlementStrategy from '../strategies/GreedySettlementStrategy';
import OptimalSettlementStrategy from '../strategies/OptimalSettlementStrategy';
export function createSettlementStrategy(method) {
  if (method === 'greedy') return new GreedySettlementStrategy();
  if (method === 'optimal') return new OptimalSettlementStrategy();
  throw new Error('Unknown settlement method.');
}
