import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Empty,
  ErrorMessage,
  Input,
  Loading,
  Row,
  Screen,
  T,
} from '../../src/components/UI';
import { formatMoney } from '../../src/utils/money';
export default function Groups() {
  const { service } = useApp(),
    [search, setSearch] = useState(''),
    { data, error, loading } = useData(() => service.groups.all(), [service]);
  const rows = data?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Screen
      title="Your groups"
      subtitle="Together, in balance"
      action={<T muted>{data?.length || 0} groups</T>}
    >
      <Button
        title="Create Group"
        icon="add-outline"
        onPress={() => router.push('/groups/edit')}
      />
      <Input
        label="Search groups"
        value={search}
        onChangeText={setSearch}
        placeholder="Find a group"
      />
      <ErrorMessage message={error} />
      {loading && !data ? (
        <Loading />
      ) : rows?.length ? (
        rows.map((g) => (
          <Row
            key={g.id}
            title={g.name}
            subtitle={`${g.member_count} members · ${g.expense_count} expenses`}
            right={formatMoney(g.total, g.currency)}
            icon="people-outline"
            onPress={() =>
              router.push({ pathname: '/groups/[id]', params: { id: g.id } })
            }
          />
        ))
      ) : (
        <Empty
          title="A place for your people"
          text="Create a group for a trip, a home, or the everyday."
          icon="people-outline"
        />
      )}
    </Screen>
  );
}
