import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/services/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return <Redirect href="/login" />;

  const canCreateInvitations = user.role === 'SuperAdmin' || user.role === 'Admin';
  const canManageProperties = user.role === 'Admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hej {user.firstName}!</Text>
        <Text style={styles.role}>Roll: {user.role}</Text>
        <Text style={styles.email}>{user.email}</Text>

        {canManageProperties ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/properties')}
          >
            <Text style={styles.primaryButtonText}>Mina fastigheter</Text>
          </TouchableOpacity>
        ) : null}

        {canCreateInvitations ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/create-invitation')}
          >
            <Text style={styles.primaryButtonText}>Skapa inbjudan</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logga ut</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
