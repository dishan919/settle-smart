import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import {
  Button,
  Choices,
  Empty,
  ErrorMessage,
  Input,
  Loading,
  Screen,
  T,
  useAction,
} from '../../src/components/UI';
import { CATEGORIES } from '../../src/services/AppService';
import { parseMoney, toDecimal } from '../../src/utils/money';
import {
  AddExpenseCommand,
  UpdateExpenseCommand,
} from '../../src/commands/ExpenseCommands';
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export default function ExpenseEdit() {
  const { id, groupId } = useLocalSearchParams(),
    { service } = useApp(),
    [groups, setGroups] = useState(null),
    [group, setGroup] = useState(Number(groupId) || 0),
    [members, setMembers] = useState([]),
    [description, setDescription] = useState(''),
    [amount, setAmount] = useState(''),
    [category, setCategory] = useState('Other'),
    [payer, setPayer] = useState(0),
    [participants, setParticipants] = useState([]),
    [date, setDate] = useState(today()),
    [notes, setNotes] = useState(''),
    [loadError, setLoadError] = useState(null),
    [hydrated, setHydrated] = useState(false),
    [memberGroup, setMemberGroup] = useState(0),
    action = useAction();
  useEffect(() => {
    let active = true;
    (async () => {
      const list = await service.groups.all();
      if (!active) return;
      setGroups(list);
      if (id) {
        const e = await service.expenses.get(Number(id));
        if (!e) throw new Error('Expense no longer exists.');
        if (!active) return;
        setGroup(e.group_id);
        setDescription(e.description);
        setAmount(toDecimal(e.amount));
        setCategory(e.category);
        setPayer(e.payer_id);
        setParticipants(e.participants.map((p) => p.memberId));
        setDate(e.date);
        setNotes(e.notes);
      } else if (!groupId && list.length) setGroup(list[0].id);
      setHydrated(true);
    })().catch((e) => {
      if (active) setLoadError(e.message);
    });
    return () => {
      active = false;
    };
  }, [id, groupId, service]);
  useEffect(() => {
    if (!group || !hydrated) return;
    let active = true;
    setMemberGroup(0);
    service.members
      .all(group)
      .then((list) => {
        if (!active) return;
        setMembers(list);
        setMemberGroup(group);
        if (!id) {
          setPayer(list[0]?.id || 0);
          setParticipants(list.map((m) => m.id));
        }
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });
    return () => {
      active = false;
    };
  }, [group, hydrated, id, service]);
  const currency = groups?.find((g) => g.id === group)?.currency || 'LKR';
  return (
    <Screen
      title={id ? 'Edit expense' : 'Add an expense'}
      subtitle="Share fairly"
    >
      <ErrorMessage message={loadError} />
      {!groups ? (
        <Loading />
      ) : !groups.length ? (
        <>
          <Empty
            title="Create a group first"
            text="Expenses belong to a group of friends."
          />
          <Button
            title="Create Group"
            onPress={() => router.replace('/groups/edit')}
          />
        </>
      ) : (
        <>
          {!id && (
            <Choices
              label="Group"
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
              value={group}
              onChange={setGroup}
            />
          )}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What was it for?"
          />
          <Input
            label={`Amount (${currency})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Choices
            label="Category"
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
          />
          <Choices
            label="Paid by"
            options={members.map((m) => ({ label: m.name, value: m.id }))}
            value={payer}
            onChange={setPayer}
          />
          <Button
            secondary
            title="Select Everyone"
            onPress={() => setParticipants(members.map((m) => m.id))}
          />
          <Choices
            label="Participants · equal split"
            options={members.map((m) => ({ label: m.name, value: m.id }))}
            value={participants}
            onChange={setParticipants}
            multiple
          />
          {!members.length && (
            <T muted>Add members to this group before saving an expense.</T>
          )}
          <Input
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-02"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <T muted size={12}>
            Any leftover minor units go to participants in member order. Every
            cent is accounted for.
          </T>
          <ErrorMessage message={action.error} />
          <Button
            title={action.busy ? 'Saving…' : 'Save Expense'}
            disabled={
              action.busy || !hydrated || memberGroup !== group || !!loadError
            }
            onPress={() =>
              action.run(async () => {
                const data = {
                  group_id: group,
                  description,
                  amount: parseMoney(amount),
                  category,
                  payer_id: payer,
                  participantIds: participants,
                  date,
                  notes,
                };
                await service.execute(
                  id
                    ? new UpdateExpenseCommand(service, Number(id), data)
                    : new AddExpenseCommand(service, data),
                );
                router.back();
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
