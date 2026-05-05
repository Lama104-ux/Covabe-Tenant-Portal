import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/services/auth-context';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Redirect href="/home" />;

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Fyll i e-post och lösenord');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch (e) {
      const message = (e as { message?: string })?.message ?? 'Inloggning misslyckades';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Covabe Tenant Portal</Text>
        <Text style={styles.subtitle}>Logga in för att fortsätta</Text>

        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={styles.input}
          placeholder="namn@exempel.se"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!submitting}
        />

        <Text style={styles.label}>Lösenord</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Logga in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push('/accept-invitation')}
          disabled={submitting}
        >
          <Text style={styles.link}>Har du en inbjudningskod? Aktivera ditt konto</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  link: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});
