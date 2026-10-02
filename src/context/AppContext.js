import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useColorScheme } from 'react-native';
import { AppService } from '../services/AppService';
import { eventBus } from '../events/EventBus';
const Context = createContext(null);
export function AppProvider({ children }) {
  const db = useSQLiteContext(),
    service = useMemo(() => new AppService(db), [db]);
  const [revision, setRevision] = useState(0),
    [profile, setProfile] = useState(null),
    [settings, setSettings] = useState({}),
    [ready, setReady] = useState(false),
    [error, setError] = useState(null);
  const system = useColorScheme();
  useEffect(() => eventBus.subscribe(() => setRevision((v) => v + 1)), []);
  useEffect(() => {
    let active = true;
    Promise.all([service.settings.profile(), service.settings.settings()])
      .then(([p, s]) => {
        if (active) {
          setProfile(p);
          setSettings(s);
          setReady(true);
          setError(null);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [service, revision]);
  const dark =
    settings.theme === 'dark' ||
    (settings.theme !== 'light' && system === 'dark');
  const theme = useMemo(
    () =>
      dark
        ? {
            bg: '#080808',
            card: '#171717',
            text: '#f5f5f5',
            muted: '#a6a6a6',
            border: '#363636',
            primary: '#ffffff',
            onPrimary: '#080808',
          }
        : {
            bg: '#ffffff',
            card: '#f4f4f3',
            text: '#111111',
            muted: '#6b6b6b',
            border: '#dededd',
            primary: '#111111',
            onPrimary: '#ffffff',
          },
    [dark],
  );
  return (
    <Context.Provider
      value={{
        service,
        revision,
        profile,
        settings,
        ready,
        error,
        theme,
        dark,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context);
}
