import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SignUpScreenProps {
  onComplete?: () => void;
  onSignIn?: () => void;
}

export default function SignUpScreen({
  onComplete,
  onSignIn,
}: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const handleSignUp = () => {
    // Authentication will be connected later.
    onComplete?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>
          CLOSETTE
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Create your account
        </Text>

        <Text style={styles.subtitle}>
          Save your preferences and make Closette
          feel like yours.
        </Text>

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your email"
          placeholderTextColor="#A0A0A0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Create a password"
          placeholderTextColor="#A0A0A0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>
          Confirm password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor="#A0A0A0"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Create account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={onSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInBold}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 54,
  },

  header: {
    alignItems: 'center',
    marginBottom: 44,
  },

  brand: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 5,
    color: '#111111',
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#777777',
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 10,
    marginTop: 18,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },

  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  signInButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  signInText: {
    fontSize: 14,
    color: '#888888',
  },

  signInBold: {
    color: '#111111',
    fontWeight: '600',
  },
});