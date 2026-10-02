import React, { useState } from 'react';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Empty,
  ErrorMessage,
  Loading,
  Row,
  Screen,
} from '../../src/components/UI';
import { formatMoney } from '../../src/utils/money';
export default function Activity() {
  const { service } = useApp(),
    [limit, setLimit] = useState(100),
    { data, error, loading } = useData(
      () => service.activities.all(limit),
      [service, limit],
    );
  return (
    <Screen title="Activity" subtitle="Your shared story">
      <ErrorMessage message={error} />
      {loading && !data ? (
        <Loading />
      ) : data?.length ? (
        data.map((a) => (
          <Row
            key={a.id}
            title={a.message}
            subtitle={`${a.group_name || 'SettleSmart'} · ${new Date(a.created_at).toLocaleString()}`}
            right={a.amount == null ? null : formatMoney(a.amount, a.currency)}
            icon="time-outline"
          />
        ))
      ) : (
        <Empty
          title="A fresh start"
          text="Group changes, expenses, and recorded payments appear here."
          icon="time-outline"
        />
      )}
      {data?.length === limit && (
        <Button
          secondary
          title="Load more activity"
          onPress={() => setLimit(limit + 100)}
        />
      )}
    </Screen>
  );
}
