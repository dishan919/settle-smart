import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Card,
  ErrorMessage,
  Loading,
  Row,
  Screen,
  T,
  useAction,
} from '../../src/components/UI';
import { settle } from '../../src/services/SettlementService';
import { formatMoney } from '../../src/utils/money';
export default function Comparison() {
  const { groupId } = useLocalSearchParams(),
    { service } = useApp(),
    [results, setResults] = useState(null),
    action = useAction(),
    { data, error, loading } = useData(
      () => service.groupData(Number(groupId)),
      [groupId, service],
    );
  return (
    <Screen
      title="Algorithm comparison"
      subtitle="Same balances. Two approaches."
    >
      <T muted size={13}>
        Execution time depends on the device and input size. Results are
        measured on this device and do not create a payment plan.
      </T>
      <ErrorMessage message={error || action.error} />
      {loading && !data && <Loading />}
      <Button
        title={action.busy ? 'Running…' : 'Run comparison'}
        disabled={!data || action.busy}
        onPress={() =>
          action.run(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30));
            const current = await service.groupData(Number(groupId));
            const fast = settle(current.balances, 'greedy');
            let optimal = null,
              restriction = null;
            try {
              optimal = settle(current.balances, 'optimal');
            } catch (e) {
              restriction = e.message;
            }
            setResults({
              fast,
              optimal,
              restriction,
              group: current.group,
              members: current.members,
            });
          })
        }
      />
      {results && (
        <>
          {[results.fast, results.optimal].filter(Boolean).map((r) => (
            <Card key={r.method}>
              <T size={22} weight="600">
                {r.method === 'greedy'
                  ? 'Fast Settlement'
                  : 'Optimal Settlement'}
              </T>
              <T style={{ marginTop: 10 }}>Transactions: {r.payments.length}</T>
              <T muted size={13}>
                Execution time: {r.elapsed.toFixed(3)} ms
              </T>
              {r.payments.map((p, i) => (
                <Row
                  key={i}
                  title={`${results.members.find((m) => m.id === p.from)?.name} → ${results.members.find((m) => m.id === p.to)?.name}`}
                  right={formatMoney(p.amount, results.group.currency)}
                />
              ))}
              {!r.payments.length && (
                <T style={{ marginTop: 12 }}>All settled</T>
              )}
            </Card>
          ))}
          <ErrorMessage message={results.restriction} />
          <T muted size={12}>
            This snapshot reflects balances when you pressed Run comparison. Run
            again after making changes.
          </T>
        </>
      )}
    </Screen>
  );
}
