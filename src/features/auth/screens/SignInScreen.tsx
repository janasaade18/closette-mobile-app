import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';

interface SignInScreenProps {
  onComplete?: () => void;
  onSignUp?: () => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignInScreen({ onComplete, onSignUp }: SignInScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      onComplete?.();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>CLOSETTE</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to your Closette.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Your email"
          placeholderTextColor={Colors.light.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Your password"
            placeholderTextColor={Colors.light.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            editable={!loading}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((current) => !current)}
            style={styles.eye}>
            <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.8}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.light.background} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={onSignUp}
          activeOpacity={0.7}
          disabled={loading}>
          <Text style={styles.signUpText}>
            Don&#39;t have an account?{' '}
            <Text style={styles.signUpBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: PageGutter,
    paddingTop: 54,
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
  },
  brand: {
    fontSize: 18,
    fontFamily: Typeface.display,
    letterSpacing: 5,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontFamily: Typeface.body,
    color: Colors.light.text,
    marginBottom: 10,
    marginTop: 18,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  eye: { minWidth: 44, alignItems: 'center' },
  eyeText: { fontFamily: Typeface.bodyStrong, color: Colors.light.text, fontSize: 13 },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Typeface.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Typeface.body,
    color: Colors.light.rust,
  },
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontFamily: Typeface.display,
  },
  signUpButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  signUpBold: {
    color: Colors.light.text,
    fontFamily: Typeface.bodyStrong,
  },
});
