import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Card,
  Empty,
  ErrorMessage,
  Loading,
  Row,
  Screen,
  Section,
  T,
} from '../../src/components/UI';
import ExpenseRow from '../../src/components/ExpenseRow';
import { formatMoney } from '../../src/utils/money';
export default function Home() {
  const { service, profile } = useApp();
  const { data, error, loading } = useData(
    () => service.dashboard(),
    [service],
  );
  return (
    <Screen
      title={`Hello, ${profile.name.split(' ')[0]}`}
      subtitle="Your shared expenses"
    >
      <Card style={{ padding: 24 }}>
        <T muted size={12} style={{ letterSpacing: 1 }}>
          A LITTLE CLARITY. LESS TO SETTLE.
        </T>
        <T size={25} weight="600" style={{ marginTop: 10 }}>
          Good times, shared fairly.
        </T>
        <T muted size={13} style={{ marginTop: 8 }}>
          Everything stays on this device.
        </T>
      </Card>
      <ErrorMessage message={error} />
      {!data ? (
        loading && <Loading />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1 }}>
              <T size={30} weight="700">
                {data.groups.length}
              </T>
              <T muted size={12}>
                Total groups
              </T>
            </Card>
            <Card style={{ flex: 1 }}>
              <T size={30} weight="700">
                {data.groups.reduce((n, g) => n + g.expense_count, 0)}
              </T>
              <T muted size={12}>
                Total expenses
              </T>
            </Card>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['owe', 'owed'].map((key) => (
              <Card key={key} style={{ flex: 1 }}>
                <T muted size={12}>
                  {key === 'owe' ? 'You owe' : 'You are owed'}
                </T>
                {Object.entries(data.buckets).length ? (
                  Object.entries(data.buckets).map(([c, b]) => (
                    <T key={c} size={19} weight="600" style={{ marginTop: 8 }}>
                      {formatMoney(b[key], c)}
                    </T>
                  ))
                ) : (
                  <T size={19} weight="600" style={{ marginTop: 8 }}>
                    {formatMoney(0, profile.currency)}
                  </T>
                )}
              </Card>
            ))}
          </View>
          <Button
            title="Add Expense"
            icon="add-outline"
            onPress={() => router.push('/expenses/edit')}
          />
          <Section title="Recent expenses" />
          {data.expenses.length ? (
            data.expenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
          ) : (
            <Empty text="Create a group, add your friends, then record an expense." />
          )}
          <Section title="Pending settlements" />
          {data.pending.length ? (
            data.pending.slice(0, 5).map((p) => (
              <Row
                key={p.id}
                title={`${p.from_name} → ${p.to_name}`}
                subtitle={p.group.name}
                right={formatMoney(p.amount, p.group.currency)}
                onPress={() =>
                  router.push({
                    pathname: '/settlement/[id]',
                    params: { id: p.group.id },
                  })
                }
              />
            ))
          ) : (
            <Empty
              title="No pending plans"
              text="Calculate a settlement from a group's balance screen."
              icon="checkmark-done-outline"
            />
          )}
          {data.groups.length > 0 && !data.linked && (
            <T muted size={12}>
              To show your personal balance, select “This is me” in your group
              member details.
            </T>
          )}
        </>
      )}
    </Screen>
  );
}
