import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Card,
  ErrorMessage,
  Loading,
  Row,
  Screen,
  Section,
  T,
  confirm,
  useAction,
} from '../../src/components/UI';
import { formatMoney } from '../../src/utils/money';
import { DeleteExpenseCommand } from '../../src/commands/ExpenseCommands';
export default function Expense() {
  const { id } = useLocalSearchParams(),
    { service } = useApp(),
    action = useAction(),
    { data, error, loading } = useData(async () => {
      const e = await service.expenses.get(Number(id));
      if (!e) throw new Error('Expense no longer exists.');
      return {
        expense: e,
        group: await service.groups.get(e.group_id),
        members: await service.members.all(e.group_id),
      };
    }, [id, service]);
  if (!data)
    return (
      <Screen title="Expense">
        <ErrorMessage message={error} />
        {loading && <Loading />}
      </Screen>
    );
  const { expense: e, group, members } = data;
  return (
    <Screen title={e.description} subtitle={group.name}>
      <Card>
        <T size={36} weight="700">
          {formatMoney(e.amount, group.currency)}
        </T>
        <T muted style={{ marginTop: 10 }}>
          {e.category} · {e.date}
        </T>
        <T style={{ marginTop: 10 }}>
          Paid by {members.find((m) => m.id === e.payer_id)?.name}
        </T>
      </Card>
      {!!e.notes && <T muted>{e.notes}</T>}
      <Section title="Equal split" />
      {e.participants.map((p) => (
        <Row
          key={p.memberId}
          icon="person-outline"
          title={members.find((m) => m.id === p.memberId)?.name || 'Member'}
          right={formatMoney(p.share, group.currency)}
        />
      ))}
      <ErrorMessage message={action.error} />
      <Button
        title="Edit Expense"
        onPress={() =>
          router.push({ pathname: '/expenses/edit', params: { id } })
        }
      />
      <Button
        secondary
        title="Delete Expense"
        disabled={action.busy}
        onPress={() =>
          confirm(
            'Delete expense?',
            'Balances will update. Pending settlement recommendations will be invalidated. Recorded payments are preserved.',
            () =>
              action.run(async () => {
                await service.execute(
                  new DeleteExpenseCommand(service, Number(id)),
                );
                router.back();
              }),
          )
        }
      />
    </Screen>
  );
}
