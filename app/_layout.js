import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '../src/context/AppContext';
import { initializeDatabase } from '../src/database/schema';
import { ErrorMessage, Loading, Screen, T } from '../src/components/UI';
SplashScreen.preventAutoHideAsync().catch(() => {});
class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch() {
    SplashScreen.hideAsync().catch(() => {});
  }
  render() {
    if (this.state.error)
      return (
        <View
          style={{
            flex: 1,
            padding: 30,
            paddingTop: 70,
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700' }}>
            Unable to open local data
          </Text>
          <Text style={{ marginTop: 20 }}>{this.state.error.message}</Text>
          <Text style={{ marginTop: 20 }}>
            Close and reopen SettleSmart. Your stored data has not been reset.
          </Text>
        </View>
      );
    return this.props.children;
  }
}
function Navigation() {
  const { ready, error, theme, dark } = useApp(),
    [welcome, setWelcome] = useState(true);
  useEffect(() => {
    if (ready || error) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => setWelcome(false), 700);
      return () => clearTimeout(timer);
    }
  }, [ready, error]);
  if (error)
    return (
      <Screen title="Unable to load">
        <ErrorMessage message={error} />
      </Screen>
    );
  if (!ready || welcome)
    return (
      <Screen title="SettleSmart" subtitle="Welcome">
        <T size={20}>Split expenses. Settle smarter.</T>
        <Loading />
      </Screen>
    );
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bg },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="groups/edit" options={{ title: 'Group' }} />
        <Stack.Screen
          name="groups/[id]"
          options={{ title: 'Group overview' }}
        />
        <Stack.Screen name="groups/member" options={{ title: 'Member' }} />
        <Stack.Screen name="expenses/edit" options={{ title: 'Expense' }} />
        <Stack.Screen
          name="expenses/[id]"
          options={{ title: 'Expense details' }}
        />
        <Stack.Screen
          name="settlement/[id]"
          options={{ title: 'Settlement' }}
        />
        <Stack.Screen
          name="settlement/compare"
          options={{ title: 'Algorithm comparison' }}
        />
        <Stack.Screen
          name="settings/profile"
          options={{ title: 'Local profile' }}
        />
        <Stack.Screen
          name="settings/how-it-works"
          options={{ title: 'How it works' }}
        />
      </Stack>
    </>
  );
}
export default function Layout() {
  return <AppProviderShell />;
}
function AppProviderShell() {
  return (
    <Boundary>
      <SQLiteProvider databaseName="settlesmart.db" onInit={initializeDatabase}>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </SQLiteProvider>
    </Boundary>
  );
}
