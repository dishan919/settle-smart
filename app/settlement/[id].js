import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Card,
  Choices,
  Empty,
  ErrorMessage,
  Loading,
  Screen,
  Section,
  T,
  confirm,
  useAction,
} from '../../src/components/UI';
import { formatMoney, add } from '../../src/utils/money';
export default function Settlement() {
  const { id } = useLocalSearchParams(),
    { service } = useApp(),
    [method, setMethod] = useState('greedy'),
    action = useAction(),
    { data, error, loading } = useData(
      () => service.groupData(Number(id)),
      [id, service],
    );
  if (!data)
    return (
      <Screen title="Settlement">
        <ErrorMessage message={error} />
        {loading && <Loading />}
      </Screen>
    );
  const nonzero = data.balances.filter((b) => b.balance !== 0).length,
    run = data.run,
    done = run?.transactions.filter((t) => t.paid).length || 0;
  return (
    <Screen title="Settle smarter" subtitle={data.group.name}>
      <Choices
        label="Settlement method"
        options={[
          { label: 'Fast Settlement', value: 'greedy' },
          { label: 'Optimal Settlement', value: 'optimal' },
        ]}
        value={method}
        onChange={setMethod}
      />
      <T muted size={13}>
        {method === 'greedy'
          ? 'A fast greedy heuristic using a priority queue. It may not use the fewest possible payments.'
          : 'An exact search for the fewest payments, available for up to 10 non-zero balances.'}
      </T>
      {method === 'optimal' && nonzero > 10 && (
        <ErrorMessage message="Optimal mode is available for small groups only. Use Fast Settlement for this group." />
      )}
      <ErrorMessage message={action.error || error} />
      <Button
        title={action.busy ? 'Calculating…' : 'Calculate Settlement'}
        disabled={action.busy || (method === 'optimal' && nonzero > 10)}
        onPress={() =>
          action.run(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30));
            await service.generate(Number(id), method);
          })
        }
      />
      <Button
        secondary
        title="Compare algorithms"
        onPress={() =>
          router.push({
            pathname: '/settlement/compare',
            params: { groupId: id },
          })
        }
      />
      {run ? (
        <>
          <Section title="Settlement plan" />
          <Card>
            <T size={26} weight="700">
              {run.transactions.length === done
                ? 'All settled'
                : `${run.transactions.length - done} payments remaining`}
            </T>
            <T muted style={{ marginTop: 8 }}>
              {done} / {run.transactions.length} payments completed
            </T>
            <T size={13} style={{ marginTop: 12 }}>
              Total plan:{' '}
              {formatMoney(
                run.transactions.reduce((s, t) => add(s, t.amount), 0),
                data.group.currency,
              )}
            </T>
            <T muted size={12}>
              {run.method === 'greedy' ? 'Fast' : 'Optimal'} Settlement ·{' '}
              {run.elapsed.toFixed(3)} ms
            </T>
          </Card>
          {run.transactions.map((t) => (
            <Card key={t.id}>
              <T size={18} weight="600">
                {t.from_name} → {t.to_name}
              </T>
              <T muted size={12}>
                pays · {t.paid ? 'Paid' : 'Pending'}
              </T>
              <T size={25} weight="600" style={{ marginVertical: 12 }}>
                {formatMoney(t.amount, data.group.currency)}
              </T>
              {t.paid ? (
                <>
                  <T size={13}>
                    ✓ Payment recorded
                    {t.paid_at ? ` · ${t.paid_at.slice(0, 10)}` : ''}
                  </T>
                  <Button
                    secondary
                    title="Change back to Pending"
                    disabled={action.busy}
                    onPress={() =>
                      confirm(
                        'Correct this payment?',
                        'The recorded payment will be reversed and the current plan invalidated. Calculate a new plan afterwards.',
                        () => action.run(() => service.markPending(t.id)),
                      )
                    }
                  />
                </>
              ) : (
                <Button
                  secondary
                  title="Mark as Paid"
                  disabled={action.busy}
                  onPress={() =>
                    confirm(
                      'Record this payment?',
                      `${t.from_name} paid ${t.to_name} ${formatMoney(t.amount, data.group.currency)}. This records a completed payment; it does not transfer money.`,
                      () => action.run(() => service.markPaid(t.id)),
                    )
                  }
                />
              )}
            </Card>
          ))}
        </>
      ) : (
        <Empty
          title={nonzero ? 'No current plan' : 'All settled'}
          text={
            nonzero
              ? 'Calculate a new plan for the current balances.'
              : 'Everyone’s balance is zero.'
          }
          icon="checkmark-done-outline"
        />
      )}
      {data.paid.some((p) => p.run_id !== run?.id) && (
        <>
          <Section title="Earlier recorded payments" />
          {data.paid
            .filter((p) => p.run_id !== run?.id)
            .map((p) => (
              <Card key={p.id}>
                <T weight="600">
                  {p.from_name} → {p.to_name}
                </T>
                <T>{formatMoney(p.amount, data.group.currency)} · Paid</T>
                <T muted size={12}>
                  {p.paid_at?.slice(0, 10)}
                </T>
                <Button
                  secondary
                  title="Correct to Pending"
                  disabled={action.busy}
                  onPress={() =>
                    confirm(
                      'Reverse recorded payment?',
                      'Use this only to correct a payment recorded by mistake. Current recommendations will be invalidated.',
                      () => action.run(() => service.markPending(p.id)),
                    )
                  }
                />
              </Card>
            ))}
        </>
      )}
      <T muted size={12}>
        Payments are recorded locally. Expense edits invalidate pending plans
        and keep recorded payments in your balance history.
      </T>
    </Screen>
  );
}
