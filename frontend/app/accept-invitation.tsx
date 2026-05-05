import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '@/services/api';
import { useAuth } from '@/services/auth-context';

export default function AcceptInvitationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(params.token ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Redirect href="/home" />;

  const handleSubmit = async () => {
    if (!token.trim()) {
      setError('Inbjudningskod saknas');
      return;
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Förnamn och efternamn måste vara minst 2 tecken');
      return;
    }
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await api.post<{ message: string }>('/api/invitations/accept', {
        token: token.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        phoneNumber: phone.trim() || null,
      });
      Alert.alert('Konto skapat', 'Du kan nu logga in med din e-post och lösenord.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e) {
      const message = (e as { message?: string })?.message ?? 'Kunde inte skapa konto';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const tokenFromUrl = !!params.token;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Aktivera ditt konto</Text>
          <Text style={styles.subtitle}>Slutför registreringen</Text>

          <Text style={styles.label}>Inbjudningskod</Text>
          <TextInput
            style={[styles.input, tokenFromUrl && styles.inputDisabled]}
            placeholder="Klistra in koden från mejlet"
            autoCapitalize="none"
            autoCorrect={false}
            value={token}
            onChangeText={setToken}
            editable={!submitting && !tokenFromUrl}
          />

          <Text style={styles.label}>Förnamn</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            editable={!submitting}
          />

          <Text style={styles.label}>Efternamn</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            editable={!submitting}
          />

          <Text style={styles.label}>Telefonnummer (valfritt)</Text>
          <TextInput
            style={styles.input}
            placeholder="070-xxx xx xx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!submitting}
          />

          <Text style={styles.label}>Lösenord (minst 8 tecken)</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
          />

          <Text style={styles.label}>Bekräfta lösenord</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!submitting}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Skapa konto</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.replace('/login')}
            disabled={submitting}
          >
            <Text style={styles.link}>Tillbaka till inloggning</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    marginBottom: 16,
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
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
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
