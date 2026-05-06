import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '@/services/api';
import { useAuth } from '@/services/auth-context';

type Property = {
  id: string;
  covabePropertyId: number | null;
  customId: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  status: number;
};

export default function PropertiesScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Property[]>('/api/properties', token);
      setProperties(data);
    } catch (e) {
      const message = (e as ApiError)?.message ?? 'Kunde inte hämta fastigheter';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [fetchProperties]),
  );

  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'Admin') return <Redirect href="/home" />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mina fastigheter</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Hämtar från Covabe…' : `${properties.length} st`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProperties}>
              <Text style={styles.retryButtonText}>Försök igen</Text>
            </TouchableOpacity>
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Inga fastigheter hittade</Text>
            <Text style={styles.emptyText}>
              Lägg till fastigheter i Covabe-webbsidan så syns de här automatiskt.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sourceNote}>
              Fastigheterna hanteras i Covabe-webbsidan. Här ser du dem i läs-läge.
            </Text>
            {properties.map((property) => (
              <View key={property.id} style={styles.card}>
                <Text style={styles.cardTitle}>{property.name ?? 'Namnlös fastighet'}</Text>
                {property.customId ? (
                  <Text style={styles.cardMeta}>ID: {property.customId}</Text>
                ) : null}
                {property.address || property.city ? (
                  <Text style={styles.cardMeta}>
                    {[property.address, property.city, property.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                ) : null}
                {property.description ? (
                  <Text style={styles.cardDescription}>{property.description}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/home')}>
        <Text style={styles.backLinkText}>← Tillbaka</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sourceNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 12,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});
