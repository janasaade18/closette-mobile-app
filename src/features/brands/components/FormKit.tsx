import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Colors, Typeface } from '@/constants/theme';

export function Field({
  label,
  ...input
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.light.textSecondary}
        {...input}
        style={[styles.input, input.multiline && styles.multiline, input.style]}
      />
    </View>
  );
}

export function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          placeholderTextColor={Colors.light.textSecondary}
          style={[styles.input, styles.passwordInput]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          onPress={() => setHidden((current) => !current)}
          style={styles.eye}>
          <Text style={styles.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={[styles.button, (disabled || busy) && styles.buttonDisabled]}>
      {busy ? (
        <ActivityIndicator color={Colors.light.onPrimary} />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function StatusBlock({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.status}>
      <Text style={styles.statusTitle}>{title}</Text>
      {body ? <Text style={styles.statusBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

export function ProgressLabel({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>Uploading {percent}%</Text>
    </View>
  );
}

export function ScreenBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    color: Colors.light.primary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 13,
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 15,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  eye: { paddingHorizontal: 4, minWidth: 44, alignItems: 'center' },
  eyeText: { color: Colors.light.primary, fontFamily: Typeface.bodyStrong, fontSize: 13 },
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 15,
  },
  status: {
    paddingTop: 48,
    gap: 10,
    alignItems: 'flex-start',
  },
  statusTitle: {
    color: Colors.light.primary,
    fontFamily: Typeface.display,
    fontSize: 28,
  },
  statusBody: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 15,
    lineHeight: 22,
  },
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.outlineBlue,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },
  progressText: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 12,
  },
  body: { gap: 14 },
});
