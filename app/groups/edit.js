import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import {
  Button,
  ErrorMessage,
  Input,
  Screen,
  useAction,
} from '../../src/components/UI';
export default function GroupEdit() {
  const { id } = useLocalSearchParams(),
    { service } = useApp(),
    [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [loadError, setLoadError] = useState(null),
    [loaded, setLoaded] = useState(!id),
    { busy, error, run } = useAction();
  useEffect(() => {
    if (id)
      service.groups
        .get(Number(id))
        .then((g) => {
          if (!g) throw new Error('Group no longer exists.');
          setName(g.name);
          setDescription(g.description);
          setLoaded(true);
        })
        .catch((e) => setLoadError(e.message));
  }, [id, service]);
  return (
    <Screen
      title={id ? 'Edit group' : 'Create a group'}
      subtitle="Make room for everyone"
    >
      <Input
        label="Group name"
        value={name}
        onChangeText={setName}
        placeholder="Kandy Trip"
      />
      <Input
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <ErrorMessage message={error || loadError} />
      <Button
        title={busy ? 'Saving…' : 'Save Group'}
        disabled={busy || !loaded}
        onPress={() =>
          run(async () => {
            const groupId = await service.saveGroup(
              { name, description },
              id ? Number(id) : null,
            );
            if (id) router.back();
            else
              router.replace({
                pathname: '/groups/[id]',
                params: { id: groupId },
              });
          })
        }
      />
    </Screen>
  );
}
