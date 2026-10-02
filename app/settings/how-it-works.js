import React from 'react';
import { Card, Screen, T } from '../../src/components/UI';
const topics = [
  [
    'Group balance',
    'Amount paid minus your fair share. Recorded payments then adjust this balance. Positive means you receive money; negative means you owe it.',
  ],
  [
    'Creditor and debtor',
    'A creditor should receive money. A debtor owes money. A zero balance means settled.',
  ],
  [
    'Equal split',
    'Amounts are integer minor units, such as cents. Division leftovers are assigned in member order so shares always add up exactly.',
  ],
  [
    'Fast Settlement',
    'A greedy heuristic repeatedly matches the largest debtor with the largest creditor. It is fast, but does not always give the fewest payments.',
  ],
  [
    'Heap / priority queue',
    'A max heap retrieves the largest remaining amount efficiently. Insert and extract take O(log n); peek takes O(1).',
  ],
  [
    'Optimal Settlement',
    'For up to ten non-zero balances, an exact search divides members into as many zero-sum groups as possible. This minimizes payment count, with more computation.',
  ],
  [
    'Strategy Pattern',
    'A common settlement interface lets the service switch between Fast and Optimal without changing the screens. A factory creates the selected strategy.',
  ],
  [
    'Payment history',
    'Marking a recommendation paid records a real-world payment in your local ledger. No money is transferred by SettleSmart. Expense edits preserve paid records and discard pending plans.',
  ],
];
export default function How() {
  return (
    <Screen
      title="How it works"
      subtitle="A little understanding goes a long way"
    >
      {topics.map(([title, text]) => (
        <Card key={title}>
          <T size={20} weight="600">
            {title}
          </T>
          <T muted size={14} style={{ marginTop: 10 }}>
            {text}
          </T>
        </Card>
      ))}
    </Screen>
  );
}
