import React from 'react';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import {
  Button,
  Card,
  Choices,
  ErrorMessage,
  Row,
  Screen,
  Section,
  T,
  confirm,
  useAction,
} from '../../src/components/UI';
export default function Settings() {
  const { service, profile, settings } = useApp(),
    action = useAction();
  return (
    <Screen title="Settings" subtitle="Make it yours">
      <Row
        title={profile.name}
        subtitle={`${profile.email || 'Local profile'} · ${profile.currency}`}
        icon="person-circle-outline"
        onPress={() => router.push('/settings/profile')}
      />
      <Section title="Appearance" />
      <Choices
        label="Theme"
        options={[
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'System', value: 'system' },
        ]}
        value={settings.theme || 'system'}
        onChange={(v) => action.run(() => service.setSetting('theme', v))}
      />
      <Section title="Explore" />
      <Row
        title="How it works"
        subtitle="Balances, heaps, and settlement strategies"
        icon="bulb-outline"
        onPress={() => router.push('/settings/how-it-works')}
      />
      <Button
        secondary
        title="Load Demo Data"
        disabled={action.busy}
        onPress={() => action.run(() => service.loadDemo())}
      />
      <T muted size={12}>
        Adds Kandy Trip with Abi, Nimal, Kamal, Ravi, and four shared expenses.
        Set “This is me” on the member representing you.
      </T>
      <Section title="Expense operations" />
      <Button
        secondary
        title="Undo most recent expense operation"
        disabled={action.busy || !service.undoCommand}
        onPress={() => action.run(() => service.undo())}
      />
      <T muted size={12}>
        Undo is available during this app session, until another expense
        operation or payment is recorded.
      </T>
      <Section title="Your data" />
      <Card>
        <T weight="600">Offline by design</T>
        <T muted size={13} style={{ marginTop: 8 }}>
          Your profile, groups, and expenses are stored in SQLite on this phone.
          Uninstalling the app can remove this data.
        </T>
      </Card>
      <ErrorMessage message={action.error} />
      <Button
        secondary
        title="Reset All Data"
        disabled={action.busy}
        onPress={() =>
          confirm(
            'Reset all local data?',
            'This permanently erases your profile, groups, expenses, payments, settings, and activity. There is no recovery.',
            () =>
              confirm(
                'Permanently erase everything?',
                'Confirm once more to return to onboarding.',
                () =>
                  action.run(async () => {
                    await service.reset();
                    router.replace('/onboarding');
                  }),
              ),
          )
        }
      />
      <T muted size={12} style={{ textAlign: 'center', marginTop: 25 }}>
        SettleSmart 1.0.0{'\n'}Split expenses. Settle smarter.
      </T>
    </Screen>
  );
}
