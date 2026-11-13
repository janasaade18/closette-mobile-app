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

interface SignUpScreenProps {
  onComplete?: () => void;
  onSignIn?: () => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignUpScreen({ onComplete, onSignIn }: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setInfo(null);

    if (!displayName.trim()) {
      setError('Add a display name so Closette can greet you.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email,
        password,
        displayName,
      });
      if (result.needsEmailConfirmation) {
        setInfo('Check your email to confirm your account, then sign in.');
        return;
      }
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Save your preferences and make Closette feel like yours.
        </Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="What should we call you?"
          placeholderTextColor={Colors.light.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!loading}
        />

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
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor={Colors.light.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          editable={!loading}
        />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor={Colors.light.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          editable={!loading}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          onPress={() => setShowPassword((current) => !current)}>
          <Text style={styles.signInBold}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {info ? <Text style={styles.infoText}>{info}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          activeOpacity={0.8}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.light.background} />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={onSignIn}
          activeOpacity={0.7}
          disabled={loading}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInBold}>Sign In</Text>
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
  infoText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Typeface.body,
    color: Colors.light.primary,
  },
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontFamily: Typeface.display,
  },
  signInButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInText: {
    fontSize: 14,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  signInBold: {
    color: Colors.light.text,
    fontFamily: Typeface.bodyStrong,
  },
});
