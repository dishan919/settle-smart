import React, { useState } from 'react';
import { View } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import {
  Button,
  Card,
  Choices,
  ErrorMessage,
  Icon,
  Input,
  Screen,
  T,
  useAction,
} from '../src/components/UI';
import { CURRENCIES } from '../src/utils/money';
const slides = [
  [
    'Split together',
    'Track expenses shared between friends.',
    'people-outline',
  ],
  [
    'Know your balance',
    'See who owes and who should receive money.',
    'swap-horizontal-outline',
  ],
  [
    'Settle smarter',
    'Generate efficient settlement recommendations.',
    'checkmark-done-outline',
  ],
];
export default function Onboarding() {
  const { service, profile, settings } = useApp(),
    [step, setStep] = useState(0),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [currency, setCurrency] = useState('LKR'),
    { busy, error, run } = useAction();
  if (profile && settings.onboarded === '1') return <Redirect href="/(tabs)" />;
  return (
    <Screen title="SettleSmart" subtitle="Split expenses. Settle smarter.">
      {step < 3 ? (
        <>
          <View
            style={{ flex: 1, justifyContent: 'center', paddingVertical: 50 }}
          >
            <Card style={{ paddingVertical: 65, alignItems: 'center' }}>
              <Icon name={slides[step][2]} size={68} />
              <T size={27} weight="700" style={{ marginTop: 30 }}>
                {slides[step][0]}
              </T>
              <T muted style={{ textAlign: 'center', marginTop: 12 }}>
                {slides[step][1]}
              </T>
            </Card>
            <T muted style={{ textAlign: 'center', marginTop: 20 }}>
              {step + 1} / 3
            </T>
          </View>
          <Button
            title={step === 2 ? 'Get Started' : 'Continue'}
            onPress={() => setStep(step + 1)}
          />
        </>
      ) : (
        <>
          <T size={24} weight="600" style={{ marginBottom: 10 }}>
            Make yourself at home.
          </T>
          <T muted style={{ marginBottom: 30 }}>
            A local profile. No account or internet required.
          </T>
          <Input
            label="Your name"
            value={name}
            onChangeText={setName}
            placeholder="Abi"
            autoCapitalize="words"
          />
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
          <ErrorMessage message={error} />
          <Button
            title={busy ? 'Saving…' : 'Create local profile'}
            disabled={busy}
            onPress={() =>
              run(async () => {
                await service.saveProfile({ name, email, currency });
                router.replace('/(tabs)');
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
