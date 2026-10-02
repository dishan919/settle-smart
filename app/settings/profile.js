import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import {
  Button,
  Choices,
  ErrorMessage,
  Input,
  Screen,
  T,
  useAction,
} from '../../src/components/UI';
import { CURRENCIES } from '../../src/utils/money';
export default function Profile() {
  const { service, profile } = useApp(),
    [name, setName] = useState(profile.name),
    [email, setEmail] = useState(profile.email),
    [currency, setCurrency] = useState(profile.currency),
    action = useAction();
  return (
    <Screen title="Local profile">
      <Input label="Name" value={name} onChangeText={setName} />
      <Input
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Choices
        label="Preferred currency"
        options={CURRENCIES}
        value={currency}
        onChange={setCurrency}
      />
      <T muted size={13}>
        Currency applies to new groups. Existing groups keep their original
        currency. Profile edits do not rename group members.
      </T>
      <ErrorMessage message={action.error} />
      <Button
        title="Save Profile"
        disabled={action.busy}
        onPress={() =>
          action.run(async () => {
            await service.saveProfile({ name, email, currency });
            router.back();
          })
        }
      />
    </Screen>
  );
}
