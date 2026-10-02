import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useData } from '../../src/hooks/useData';
import {
  Button,
  Choices,
  Empty,
  ErrorMessage,
  Input,
  Loading,
  Screen,
} from '../../src/components/UI';
import ExpenseRow from '../../src/components/ExpenseRow';
import { CATEGORIES } from '../../src/services/AppService';
export default function Expenses() {
  const { service } = useApp(),
    [search, setSearch] = useState(''),
    [group, setGroup] = useState(0),
    [category, setCategory] = useState('All'),
    [payer, setPayer] = useState(0),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [filters, setFilters] = useState(false),
    [limit, setLimit] = useState(100),
    { data, error, loading } = useData(
      async () => ({
        expenses: await service.expenses.list({
          groupId: group,
          search,
          category,
          payer,
          from,
          to,
          limit,
        }),
        groups: await service.groups.all(),
        payers: await service.expenses.payers(group),
      }),
      [service, group, search, category, payer, from, to, limit],
    );
  useEffect(() => setLimit(100), [group, search, category, payer, from, to]);
  const payers = data?.payers || [],
    rows = data?.expenses;
  return (
    <Screen title="Expenses" subtitle="Every shared moment">
      <Button
        title="Add Expense"
        icon="add-outline"
        onPress={() => router.push('/expenses/edit')}
      />
      <Input
        label="Search expenses"
        value={search}
        onChangeText={setSearch}
        placeholder="Description, notes, or group"
      />
      <Button
        secondary
        title={filters ? 'Hide filters' : 'Filter expenses'}
        icon="options-outline"
        onPress={() => setFilters(!filters)}
      />
      {filters && (
        <>
          <Choices
            label="Group"
            options={[
              { label: 'All groups', value: 0 },
              ...(data?.groups || []).map((g) => ({
                label: g.name,
                value: g.id,
              })),
            ]}
            value={group}
            onChange={(v) => {
              setGroup(v);
              setPayer(0);
            }}
          />
          <Choices
            label="Category"
            options={['All', ...CATEGORIES]}
            value={category}
            onChange={setCategory}
          />
          <Choices
            label="Paid by"
            options={[{ label: 'All payers', value: 0 }, ...payers]}
            value={payer}
            onChange={setPayer}
          />
          <Input
            label="From date (YYYY-MM-DD)"
            value={from}
            onChangeText={setFrom}
            placeholder="2026-01-01"
          />
          <Input
            label="To date (YYYY-MM-DD)"
            value={to}
            onChangeText={setTo}
            placeholder="2026-12-31"
          />
          <Button
            secondary
            title="Clear filters"
            onPress={() => {
              setGroup(0);
              setPayer(0);
              setCategory('All');
              setFrom('');
              setTo('');
              setSearch('');
            }}
          />
        </>
      )}
      <ErrorMessage message={error} />
      {loading && !data ? (
        <Loading />
      ) : rows?.length ? (
        rows.map((e) => <ExpenseRow key={e.id} expense={e} />)
      ) : (
        <Empty
          title="No expenses found"
          text="Add an expense or adjust your filters."
        />
      )}
      {rows?.length === limit && (
        <Button
          secondary
          title="Load more expenses"
          onPress={() => setLimit(limit + 100)}
        />
      )}
    </Screen>
  );
}
