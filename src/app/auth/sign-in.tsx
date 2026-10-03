import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SignInScreenProps {
  onComplete?: () => void;
  onSignUp?: () => void;
}

export default function SignInScreen({
  onComplete,
  onSignUp,
}: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
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
          Welcome back
        </Text>

        <Text style={styles.subtitle}>
          Sign in to continue to your Closette.
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
          placeholder="Your password"
          placeholderTextColor="#A0A0A0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.forgotButton}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={onSignUp}
          activeOpacity={0.7}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
            <Text style={styles.signUpBold}>
              Sign Up
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

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
  },

  forgotText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },

  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  signUpButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  signUpText: {
    fontSize: 14,
    color: '#888888',
  },

  signUpBold: {
    color: '#111111',
    fontWeight: '600',
  },
});