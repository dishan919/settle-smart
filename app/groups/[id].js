import React, { useState } from 'react';
import { View } from 'react-native';
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
  Row,
  Screen,
  Section,
  T,
  confirm,
  useAction,
} from '../../src/components/UI';
import ExpenseRow from '../../src/components/ExpenseRow';
import { formatMoney, add } from '../../src/utils/money';
export default function Group() {
  const { id } = useLocalSearchParams(),
    { service } = useApp(),
    [section, setSection] = useState('Expenses'),
    { data, error, loading } = useData(
      () => service.groupData(Number(id)),
      [id, service],
    ),
    action = useAction();
  if (!data)
    return (
      <Screen title="Group">
        <ErrorMessage message={error} />
        {loading && <Loading />}
      </Screen>
    );
  const total = data.expenses.reduce((n, e) => add(n, e.amount), 0),
    settled = data.balances.every((b) => b.balance === 0);
  return (
    <Screen title={data.group.name} subtitle="Group overview">
      <T muted>{data.group.description}</T>
      <Card style={{ marginTop: 20 }}>
        <T muted size={12}>
          TOTAL SPENDING
        </T>
        <T size={32} weight="700" style={{ marginTop: 8 }}>
          {formatMoney(total, data.group.currency)}
        </T>
        <T muted size={13} style={{ marginTop: 12 }}>
          {data.members.length} members · {data.expenses.length} expenses ·{' '}
          {settled ? 'All settled' : 'Unsettled balances'}
        </T>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Add Expense"
            icon="add-outline"
            onPress={() =>
              router.push({
                pathname: '/expenses/edit',
                params: { groupId: id },
              })
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            secondary
            title="Add Member"
            onPress={() =>
              router.push({
                pathname: '/groups/member',
                params: { groupId: id },
              })
            }
          />
        </View>
      </View>
      <Choices
        options={['Expenses', 'Balances', 'Settle']}
        value={section}
        onChange={setSection}
      />
      {section === 'Expenses' &&
        (data.expenses.length ? (
          data.expenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
        ) : (
          <Empty />
        ))}
      {section === 'Balances' && (
        <>
          <T muted size={13}>
            Paid minus fair share, adjusted for payments recorded as paid.
          </T>
          {data.balances.map((b) => (
            <Row
              key={b.id}
              title={`${b.name}${b.is_self ? ' (you)' : ''}`}
              subtitle={`${b.balance > 0 ? 'Should receive' : b.balance < 0 ? 'Owes' : 'Settled'} · Paid ${formatMoney(b.paid, data.group.currency)} · Share ${formatMoney(b.share, data.group.currency)}`}
              right={`${b.balance > 0 ? '+' : b.balance < 0 ? '−' : ''}${formatMoney(Math.abs(b.balance), data.group.currency)}`}
              icon={
                b.balance === 0
                  ? 'checkmark-outline'
                  : 'swap-horizontal-outline'
              }
            />
          ))}
        </>
      )}
      {section === 'Settle' && (
        <Card>
          <T size={22} weight="600">
            {settled ? 'All settled' : 'Ready to settle?'}
          </T>
          <T muted size={13} style={{ marginVertical: 12 }}>
            Generate a clear payment plan and record your progress.
          </T>
          <Button
            title="Calculate Settlement"
            onPress={() =>
              router.push({ pathname: '/settlement/[id]', params: { id } })
            }
          />
        </Card>
      )}
      <Section title="Members" />
      {data.members.map((m) => (
        <Row
          key={m.id}
          title={`${m.name}${m.is_self ? ' (you)' : ''}`}
          subtitle={m.email || 'Group member'}
          icon="person-outline"
          onPress={() =>
            router.push({
              pathname: '/groups/member',
              params: { groupId: id, id: m.id },
            })
          }
        />
      ))}
      {!data.members.length && (
        <Empty
          title="Invite your first member"
          text="Add yourself and your friends before recording an expense."
        />
      )}
      <Section title="Group settings" />
      <T muted size={12}>
        Created {data.group.created_at.slice(0, 10)} · {data.group.currency}{' '}
        (fixed for this group)
      </T>
      <ErrorMessage message={action.error} />
      <Button
        secondary
        title="Edit Group"
        onPress={() =>
          router.push({ pathname: '/groups/edit', params: { id } })
        }
      />
      <Button
        secondary
        title="Delete Group"
        disabled={action.busy}
        onPress={() =>
          confirm(
            'Delete this group?',
            'All its expenses, members, payment history, and activity will be permanently removed.',
            () =>
              action.run(async () => {
                await service.deleteGroup(Number(id));
                router.replace('/(tabs)/groups');
              }),
          )
        }
      />
    </Screen>
  );
}
