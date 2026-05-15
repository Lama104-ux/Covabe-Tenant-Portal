import { useFocusEffect } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet,
  Text, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { PROPERTY_TYPE_META, propertyTypeFromInt } from "@/constants/propertyTypes";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

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
  type: number | null;
};

const T = {
  title: "Mina fastigheter",
  back: "Tillbaka",
  statusActive: "Aktiv",
  statusInactive: "Inaktiv",
  empty: "Inga fastigheter ännu",
  emptySub: "Lägg till fastigheter i Covabe-webbsidan så syns de här automatiskt.",
  retry: "Försök igen",
};

export default function PropertiesScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Property[]>("/api/properties", token);
      setProperties(data);
    } catch (e) {
      const message = (e as { message?: string })?.message ?? "Kunde inte hämta fastigheter";
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

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const data = await api.get<Property[]>("/api/properties", token);
        setProperties(data);
      } catch (e) {
        void e;
      }
    }, 30000);
    return () => clearInterval(id);
  }, [token]);

  if (!user) return <Redirect href="/login" />;
  if (user.role !== "Admin") return <Redirect href="/home" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  const openProperty = (p: Property) =>
    router.push({ pathname: "/property/[id]", params: { id: p.id } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      <View style={s.header}>
        <Pressable onPress={goBack} hitSlop={10} style={s.backIconBtn}>
          <ChevronLeft color={theme.text} />
        </Pressable>
        <Text style={[s.title, { color: theme.text }]}>{T.title}</Text>
        <View style={s.backIconBtn} />
      </View>

      {loading && properties.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : error && properties.length === 0 ? (
        <View style={s.centered}>
          <Text style={[s.errorText, { color: theme.danger }]}>{error}</Text>
          <Pressable
            onPress={fetchProperties}
            style={({ pressed }) => [
              s.retryBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={s.retryText}>{T.retry}</Text>
          </Pressable>
        </View>
      ) : properties.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIcon, { backgroundColor: theme.accentSoft }]}>
            <BuildingIcon color={theme.accent} size={32} />
          </View>
          <Text style={[s.emptyTitle, { color: theme.text }]}>{T.empty}</Text>
          <Text style={[s.emptySub, { color: theme.textMute }]}>{T.emptySub}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.xl, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {[...properties]
            .sort((a, b) => {
              const aActive = a.status === 0;
              const bActive = b.status === 0;
              if (aActive !== bActive) return aActive ? -1 : 1;
              return (b.covabePropertyId ?? 0) - (a.covabePropertyId ?? 0);
            })
            .map((p) => (
              <PropertyCard key={p.id} theme={theme} property={p} onPress={() => openProperty(p)} />
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PropertyCard({ theme, property, onPress }: { theme: Theme; property: Property; onPress: () => void }) {
  const active = property.status === 0;
  const addressLine = property.name || property.address || "Namnlös fastighet";
  const cityLine = [property.country, property.city, property.address]
    .filter((v) => v && v !== addressLine)
    .join(", ");
  const typeMeta = PROPERTY_TYPE_META[propertyTypeFromInt(property.type)];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[s.cardIcon, { backgroundColor: theme.accentSoft }]}>
        <BuildingIcon color={theme.accent} size={24} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.cardAddress, { color: theme.text }]} numberOfLines={1}>
          {addressLine}
        </Text>
        {cityLine ? (
          <Text style={[s.cardCity, { color: theme.textMute }]} numberOfLines={1}>
            {cityLine}
          </Text>
        ) : null}
        <View style={s.chips}>
          <View style={[
            s.statusPill,
            { backgroundColor: active ? `${theme.accent}15` : `${theme.danger}15` },
          ]}>
            <View style={[
              s.statusDot,
              { backgroundColor: active ? "#009700" : theme.danger },
            ]} />
            <Text style={[
              s.statusText,
              { color: active ? theme.accent : theme.danger },
            ]}>
              {active ? T.statusActive : T.statusInactive}
            </Text>
          </View>
          <View style={[s.typeChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[s.typeText, { color: theme.textMute }]}>{typeMeta.label}</Text>
          </View>
        </View>
      </View>
      <ChevronRight color={theme.textMute} />
    </Pressable>
  );
}

const Icon = ({ children, color = "#000", size = 22 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const BuildingIcon = (p: any) => <Icon {...p}><Path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h.01M8 11h.01M8 15h.01M12 7h.01M12 11h.01M12 15h.01"/></Icon>;
const ChevronLeft  = (p: any) => <Icon {...p}><Path d="M15 6l-6 6 6 6"/></Icon>;
const ChevronRight = (p: any) => <Icon {...p} size={20}><Path d="M9 6l6 6-6 6"/></Icon>;

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  backIconBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: Fonts.bold, fontSize: 22, flex: 1, textAlign: "center" },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: Radius.lg,
    padding: 16,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center",
  },
  cardAddress: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 19 },
  cardCity:    { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 17, marginTop: 3 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 0.2 },

  typeChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  typeText: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 0.2 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxl, gap: 14 },
  errorText: { fontFamily: Fonts.medium, fontSize: 14, textAlign: "center" },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radius.lg },
  retryText: { color: "#fff", fontFamily: Fonts.semibold, fontSize: 14 },

  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: Spacing.xxl, gap: 12,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontFamily: Fonts.semibold, fontSize: 16 },
  emptySub:   { fontFamily: Fonts.regular, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
