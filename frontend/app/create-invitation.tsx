import * as Clipboard from 'expo-clipboard';
import { Redirect, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/services/api';
import { useAuth } from '@/services/auth-context';

type InvitationRoleOption = 'Admin' | 'Tenant';

type CreateInvitationResponse = {
  id: string;
  email: string;
  role: InvitationRoleOption;
  expiresAt: string;
  acceptUrl: string | null;
};

export default function CreateInvitationScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin';

  const [role, setRole] = useState<InvitationRoleOption>(isSuperAdmin ? 'Admin' : 'Tenant');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Redirect href="/login" />;
  if (!isSuperAdmin && !isAdmin) return <Redirect href="/home" />;

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Fyll i e-post');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await api.post<CreateInvitationResponse>(
        '/api/invitations',
        { email: email.trim(), role },
        token,
      );

      let message = `Skickad till ${response.email} (${response.role}).`;
      if (response.acceptUrl) {
        await Clipboard.setStringAsync(response.acceptUrl);
        message += '\n\nAktiveringslänken är kopierad till urklipp — klistra in den i webbläsaren eller skicka till mottagaren.';
      } else {
        message += '\n\nMottagaren får aktiveringslänken via mejl.';
      }
      Alert.alert('Inbjudan skapad', message, [
        { text: 'Skapa en till', onPress: () => setEmail('') },
        { text: 'Tillbaka', onPress: () => router.replace('/home') },
      ]);
    } catch (e) {
      const message = (e as { message?: string })?.message ?? 'Kunde inte skapa inbjudan';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Skapa inbjudan</Text>
            <Text style={styles.subtitle}>
              Bjud in en användare till portalen. De får en länk för att aktivera sitt konto.
            </Text>

            {isSuperAdmin ? (
              <>
                <Text style={styles.label}>Roll</Text>
                <View style={styles.roleRow}>
                  {(['Admin', 'Tenant'] as const).map((r) => {
                    const active = role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleButton, active && styles.roleButtonActive]}
                        onPress={() => setRole(r)}
                        disabled={submitting}
                      >
                        <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>
                          {r === 'Admin' ? 'Fastighetsägare' : 'Hyresgäst'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.roleInfo}>
                <Text style={styles.roleInfoText}>Roll: Hyresgäst</Text>
              </View>
            )}

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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Skicka inbjudan</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.replace('/home')}
              disabled={submitting}
            >
              <Text style={styles.link}>Tillbaka</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  roleInfo: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  roleInfoText: {
    fontSize: 14,
    color: '#374151',
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
