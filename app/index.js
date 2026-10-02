import React from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '../src/context/AppContext';
export default function Index() {
  const { profile, settings } = useApp();
  return (
    <Redirect
      href={!profile || settings.onboarded !== '1' ? '/onboarding' : '/(tabs)'}
    />
  );
}
