import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
export function T({
  children,
  muted = false,
  size = 16,
  weight = '400',
  style,
  ...props
}) {
  const { theme } = useApp();
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? theme.muted : theme.text,
          fontSize: size,
          fontWeight: weight,
          lineHeight: size * 1.4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({ name, size = 22, color }) {
  const { theme } = useApp();
  return <Ionicons name={name} size={size} color={color || theme.text} />;
}
export function Screen({ children, title, subtitle, action, scroll = true }) {
  const { theme } = useApp();
  const content = (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          {subtitle && (
            <T
              size={11}
              muted
              weight="600"
              style={{ letterSpacing: 2, marginBottom: 8 }}
            >
              {subtitle.toUpperCase()}
            </T>
          )}
          {title && (
            <T size={30} weight="700">
              {title}
            </T>
          )}
        </View>
        {action}
      </View>
      {children}
      <View style={{ height: 30 }} />
    </>
  );
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={{ padding: 24, flex: 1 }}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({ children, style }) {
  const { theme } = useApp();
  return (
    <View
      style={[
        {
          padding: 20,
          backgroundColor: theme.card,
          borderRadius: 12,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  icon,
  disabled = false,
}) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginVertical: 6,
        backgroundColor: secondary ? theme.card : theme.primary,
        borderWidth: secondary ? 1 : 0,
        borderColor: theme.border,
        opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
      })}
    >
      {icon && (
        <Icon name={icon} color={secondary ? theme.text : theme.onPrimary} />
      )}
      <Text
        style={{
          color: secondary ? theme.text : theme.onPrimary,
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Input({ label, value, onChangeText, ...props }) {
  const { theme } = useApp();
  return (
    <View style={{ marginBottom: 18 }}>
      <T size={13} weight="600" style={{ marginBottom: 8 }}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        value={value}
        onChangeText={onChangeText}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 14,
          minHeight: 50,
          color: theme.text,
          fontSize: 16,
          backgroundColor: theme.bg,
        }}
        {...props}
      />
    </View>
  );
}
export function Section({ title, action }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 14,
      }}
    >
      <T size={19} weight="600">
        {title}
      </T>
      {action}
    </View>
  );
}
export function Row({
  title,
  subtitle,
  right,
  onPress,
  icon = 'arrow-forward-outline',
}) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {icon && (
        <View
          style={{
            width: 42,
            height: 42,
            backgroundColor: theme.card,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <T weight="600">{title}</T>
        {subtitle && (
          <T size={12} muted style={{ marginTop: 3 }}>
            {subtitle}
          </T>
        )}
      </View>
      {right && (
        <T
          size={14}
          weight="600"
          style={{ maxWidth: '42%', textAlign: 'right' }}
        >
          {right}
        </T>
      )}
    </Pressable>
  );
}
export function Choices({ label, options, value, onChange, multiple = false }) {
  const { theme } = useApp();
  return (
    <View style={{ marginBottom: 18 }}>
      {label && (
        <T size={13} weight="600" style={{ marginBottom: 10 }}>
          {label}
        </T>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((item) => {
          const option =
            typeof item === 'string' ? { label: item, value: item } : item;
          const selected = multiple
            ? value.includes(option.value)
            : value === option.value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
              onPress={() =>
                onChange(
                  multiple
                    ? selected
                      ? value.filter((v) => v !== option.value)
                      : [...value, option.value]
                    : option.value,
                )
              }
              style={{
                minHeight: 44,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? theme.text : theme.border,
                backgroundColor: selected ? theme.primary : theme.bg,
              }}
            >
              <Text
                style={{
                  color: selected ? theme.onPrimary : theme.text,
                  fontSize: 13,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
export function Empty({
  title = 'Nothing here yet',
  text = 'Start with your first shared expense.',
  icon = 'receipt-outline',
}) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 35 }}>
      <Icon name={icon} size={32} />
      <T weight="600" style={{ marginTop: 12 }}>
        {title}
      </T>
      <T muted size={13} style={{ textAlign: 'center', marginTop: 6 }}>
        {text}
      </T>
    </Card>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 30, alignItems: 'center' }}>
      <ActivityIndicator />
      <T muted size={13} style={{ marginTop: 12 }}>
        Loading your local data…
      </T>
    </View>
  );
}
export function ErrorMessage({ message }) {
  return message ? (
    <Card>
      <T accessibilityRole="alert">{message}</T>
    </Card>
  ) : null;
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e.message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
export function confirm(title, message, fn) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Confirm',
      style: 'destructive',
      onPress: () => {
        Promise.resolve(fn()).catch((e) =>
          Alert.alert('Unable to complete', e.message),
        );
      },
    },
  ]);
}
