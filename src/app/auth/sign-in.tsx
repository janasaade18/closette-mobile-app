import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/theme';

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
         placeholderTextColor={Colors.light.textSecondary}
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
          placeholderTextColor={Colors.light.textSecondary}
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
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
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
  },

  forgotText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  buttonText: {
    color: Colors.light.background,
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
    color: Colors.light.textSecondary,
  },

  signUpBold: {
    color: Colors.light.text,
    fontWeight: '600',
  },
});