# Algorithms

## Integer money and equal splitting

`src/utils/money.js` parses a validated decimal string using `BigInt`, verifies the supported range, and returns integer minor units. It never multiplies a floating-point currency value by 100. Display formatting divides integer units into the whole part and integer remainder. Every addition checks `Number.isSafeInteger`.

`src/strategies/EqualSplitStrategy.js` divides the amount by participant count. Participants are ordered by stable member ID; the first `amount % count` members get one additional minor unit. An expense of Rs. 1.00 among three members has shares Rs. 0.34, Rs. 0.33, Rs. 0.33. The exact total remains Rs. 1.00. Payers need not be participants. The interface can later accept percentage/exact/share strategies without changing balances.

## Balances

`src/services/BalanceService.js` accumulates paid amounts and stored fair shares. Balance is paid minus share, plus recorded outgoing payments, minus recorded incoming payments. A negative balance owes money; a positive balance receives it. Inputs and records stay integer. Unknown members and overflow are errors, never silently ignored.

For a recommendation from debtor D to creditor C of amount A, applying it means `balance[D] += A` and `balance[C] -= A`. `src/services/SettlementService.js` applies all recommendations to a copy and requires every balance to become exactly zero before returning a result.

## Greedy Settlement

`src/strategies/GreedySettlementStrategy.js` validates unique member IDs, safe integer balances, and a zero total. It creates a creditor max heap and debtor max heap. Each loop extracts the largest remaining amounts and transfers their minimum. Non-zero remainders go back into the corresponding heap. Ties break deterministically by member ID.

At least one balance is cleared each iteration; a nonempty balanced set needs at most n−1 payments. Insertion/extraction costs O(log n), making the algorithm O(n log n) with O(n) memory. It does not sort all members on each iteration.

This is a fast heuristic, not a proof of the fewest possible transactions. For example balances `[8,7,5,-10,-8,-2]` produce five payments with this greedy ordering but can settle in four. That counterexample is in the tests.

## Max Heap

`src/algorithms/MaxHeap.js` stores an array and takes a priority comparator. Insertion appends and moves the new item up. Extraction replaces the root with the last item and moves it down toward the larger child. Parent priorities stay at least as high as child priorities.

- `insert`: O(log n)
- `extractMax`: O(log n)
- `peek`, `size`, `isEmpty`: O(1)
- Storage: O(n)

## Optimal Settlement

`src/strategies/OptimalSettlementStrategy.js` implements exact subset dynamic programming for up to **10 non-zero balances**.

1. Remove zero balances and compute each subset's sum.
2. For every zero-sum subset, enumerate zero-sum submasks containing its first member.
3. Maximize the number of disjoint zero-sum components. Store the chosen component for reconstruction.
4. Settle each component using the heap strategy.

For n non-zero balances split into k independent zero-sum components, the minimum number of payments is n−k. A connected component of s members needs at least s−1 edges. Every component of a valid payment graph sums to zero. Maximizing k thus minimizes the number of payments. In a maximal zero-sum partition, a component has no smaller zero-sum partition; greedy within that component takes s−1 payments, achieving the bound. This guarantees minimum count under unrestricted member-to-member payments, with no constraints about preferred counterparties.

Subset sums use integer-safe addition. Runtime is O(3^n) in the worst case and memory O(2^n), with at most 1,024 subset states at the cap. Larger inputs produce a clear error. Zero-balance members do not count against the cap. Screens yield once to show a busy state before computation; this is bounded synchronous work, not a background worker. Raising the cap requires a worker/native compute design and device benchmarks.

## Runtime comparison

`src/services/SettlementService.js` measures the selected strategy with `performance.now()` (falling back to `Date.now()`). The comparison screen runs both against the same fresh balance snapshot, shows real transaction counts and timings, and displays each payment. It does not save plans or modify the ledger. Reported times include validation and plan calculation, exclude SQL reads/persistence and post-calculation correctness verification, and depend on device load and input.

Fast can be preferable for larger inputs even when Optimal saves a transaction. Execution timings are observations, not portable performance guarantees.
