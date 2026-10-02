import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import {
  Button,
  Choices,
  ErrorMessage,
  Input,
  Screen,
  T,
  confirm,
  useAction,
} from '../../src/components/UI';
export default function Member() {
  const { groupId, id } = useLocalSearchParams(),
    { service, profile } = useApp(),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [self, setSelf] = useState(false),
    [loadError, setLoadError] = useState(null),
    [loaded, setLoaded] = useState(!id),
    { busy, error, run } = useAction();
  useEffect(() => {
    if (id)
      service.members
        .all(Number(groupId))
        .then((rows) => {
          const m = rows.find((x) => x.id === Number(id));
          if (!m) throw new Error('Member no longer exists.');
          setName(m.name);
          setEmail(m.email);
          setSelf(!!m.is_self);
          setLoaded(true);
        })
        .catch((e) => setLoadError(e.message));
  }, [id, groupId, service]);
  return (
    <Screen title={id ? 'Edit member' : 'Add a member'}>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Friend's name"
      />
      <Input
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Choices
        label="Profile link"
        options={[
          { label: 'A friend', value: false },
          { label: 'This is me', value: true },
        ]}
        value={self}
        onChange={(v) => {
          setSelf(v);
          if (v && !name) {
            setName(profile.name);
            setEmail(profile.email);
          }
        }}
      />
      <T muted size={13}>
        “This is me” links this group member to your dashboard. Each group can
        have one linked member.
      </T>
      <ErrorMessage message={error || loadError} />
      <Button
        title="Save Member"
        disabled={busy || !loaded}
        onPress={() =>
          run(async () => {
            await service.saveMember(
              Number(groupId),
              { name, email, is_self: self },
              id ? Number(id) : null,
            );
            router.back();
          })
        }
      />
      {id && (
        <Button
          secondary
          title="Remove Member"
          disabled={busy || !loaded}
          onPress={() =>
            confirm(
              'Remove member?',
              'Members with expense or payment history cannot be removed.',
              () =>
                run(async () => {
                  await service.removeMember(Number(id));
                  router.back();
                }),
            )
          }
        />
      )}
    </Screen>
  );
}
