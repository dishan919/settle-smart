import MaxHeap from '../src/algorithms/MaxHeap';
import { parseMoney, toDecimal, formatMoney, add } from '../src/utils/money';
import EqualSplitStrategy from '../src/strategies/EqualSplitStrategy';
import { calculateBalances } from '../src/services/BalanceService';
import { settle } from '../src/services/SettlementService';
const balances = (values) => values.map((balance, id) => ({ id, balance }));
function verify(input, method) {
  const result = settle(input, method),
    remaining = new Map(input.map((b) => [b.id, b.balance]));
  result.payments.forEach((p) => {
    expect(Number.isSafeInteger(p.amount)).toBe(true);
    expect(p.amount).toBeGreaterThan(0);
    remaining.set(p.from, remaining.get(p.from) + p.amount);
    remaining.set(p.to, remaining.get(p.to) - p.amount);
  });
  expect([...remaining.values()].every((x) => x === 0)).toBe(true);
  return result;
}
describe('money', () => {
  test('exact decimal parsing and formatting', () => {
    expect(parseMoney('1250.50')).toBe(125050);
    expect(parseMoney('0.01')).toBe(1);
    expect(toDecimal(-125050)).toBe('-1250.50');
    expect(formatMoney(125050)).toBe('Rs. 1,250.50');
    expect(parseMoney('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  });
  test.each(['-1', '1.001', '1e3', 'NaN', '', '1,200', '90071992547409.92'])(
    'rejects %s',
    (v) => expect(() => parseMoney(v)).toThrow(),
  );
  test('safe addition', () =>
    expect(() => add(Number.MAX_SAFE_INTEGER, 1)).toThrow());
});
describe('heap', () => {
  test('ordered extraction, duplicates, negatives, empty', () => {
    const heap = new MaxHeap();
    [3, -1, 8, 8, 2, 20, 0].forEach((v) => heap.insert(v));
    expect(heap.size()).toBe(7);
    expect(heap.peek()).toBe(20);
    expect(Array.from({ length: 7 }, () => heap.extractMax())).toEqual([
      20, 8, 8, 3, 2, 0, -1,
    ]);
    expect(heap.isEmpty()).toBe(true);
    expect(heap.extractMax()).toBeUndefined();
  });
  test('interleaved custom priorities', () => {
    const h = new MaxHeap((a, b) => a.priority - b.priority);
    h.insert({ priority: 5 });
    h.insert({ priority: 1 });
    expect(h.extractMax().priority).toBe(5);
    h.insert({ priority: 9 });
    expect(h.peek().priority).toBe(9);
  });
});
describe.each(['greedy', 'optimal'])('%s settlement', (method) => {
  test.each([
    [100, -100],
    [100, 200, -300],
    [600000, 200000, -300000, -500000],
    [0, 0],
    [0],
    [300, -100, -100, -100],
    [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER],
    [1, 1, -2, 0],
  ])('clears %j exactly', (...values) => {
    verify(balances(values), method);
  });
  test('rejects non-zero sum and decimals', () => {
    expect(() => settle(balances([1, 2]), method)).toThrow();
    expect(() => settle(balances([0.1, -0.1]), method)).toThrow();
  });
  test('seeded generated balanced inputs', () => {
    let seed = 1234;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed % 20001) - 10000;
    };
    for (let k = 0; k < 100; k++) {
      const values = Array.from({ length: 7 }, random);
      values.push(-values.reduce((a, b) => a + b, 0));
      verify(balances(values), method);
    }
  });
});
test('optimal improves a greedy counterexample', () => {
  const input = balances([8, 7, 5, -10, -8, -2]);
  expect(verify(input, 'greedy').payments.length).toBe(5);
  expect(verify(input, 'optimal').payments.length).toBe(4);
});
test('optimal rejects oversized groups', () =>
  expect(() =>
    settle(balances([10, ...Array(10).fill(-1)]), 'optimal'),
  ).toThrow('small groups'));
test('optimal count matches an independent backtracking oracle', () => {
  function minimum(values) {
    const b = values.filter((v) => v !== 0);
    function search(i) {
      while (i < b.length && b[i] === 0) i++;
      if (i === b.length) return 0;
      let best = Infinity;
      const used = new Set();
      for (let j = i + 1; j < b.length; j++) {
        if (b[i] * b[j] >= 0 || used.has(b[j])) continue;
        used.add(b[j]);
        const old = b[j];
        b[j] += b[i];
        best = Math.min(best, 1 + search(i + 1));
        b[j] = old;
      }
      return best;
    }
    return search(0);
  }
  let seed = 823;
  for (let k = 0; k < 80; k++) {
    const values = Array.from({ length: 5 }, () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed % 19) - 9;
    });
    values.push(-values.reduce((a, b) => a + b, 0));
    expect(verify(balances(values), 'optimal').payments.length).toBe(
      minimum(values),
    );
  }
});
test('invalid strategy', () => expect(() => settle([], 'unknown')).toThrow());
describe('splits and balances', () => {
  test('deterministic remainder and selected participants', () => {
    const split = new EqualSplitStrategy().split(100, [3, 1, 2]);
    expect(split).toEqual([
      { memberId: 1, share: 34 },
      { memberId: 2, share: 33 },
      { memberId: 3, share: 33 },
    ]);
    expect(() => new EqualSplitStrategy().split(1, [])).toThrow();
    expect(() => new EqualSplitStrategy().split(0, [1])).toThrow();
  });
  test('multiple expenses and recorded payment', () => {
    const members = [{ id: 1 }, { id: 2 }, { id: 3 }],
      expenses = [
        {
          payer_id: 1,
          amount: 100,
          participants: new EqualSplitStrategy().split(100, [1, 2, 3]),
        },
        {
          payer_id: 2,
          amount: 50,
          participants: new EqualSplitStrategy().split(50, [2, 3]),
        },
      ];
    expect(calculateBalances(members, expenses).map((b) => b.balance)).toEqual([
      66, -8, -58,
    ]);
    expect(
      calculateBalances(members, expenses, [
        { from_id: 3, to_id: 1, amount: 58 },
      ]).map((b) => b.balance),
    ).toEqual([8, -8, 0]);
    verify(calculateBalances(members, expenses), 'greedy');
  });
  test('one participant', () =>
    expect(
      calculateBalances(
        [{ id: 1 }],
        [{ payer_id: 1, amount: 1, participants: [{ memberId: 1, share: 1 }] }],
      )[0].balance,
    ).toBe(0));
});
