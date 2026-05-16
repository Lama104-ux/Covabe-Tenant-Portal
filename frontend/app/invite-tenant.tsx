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
import { PROPERTY_TYPE_META, propertyTypeFromInt, PropertyType } from "@/constants/propertyTypes";
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

type Unit = {
  id: string;
  occupantFirstName: string | null;
  occupantLastName: string | null;
};

type Floor = { units: Unit[] };
type Building = { floors: Floor[]; directUnits: Unit[] };
type PropertyStructureResponse = {
  propertyStatus: number;
  buildings: Building[];
  propertyUnits: Unit[];
};

type Availability = { total: number; free: number };

const T = {
  title: "Bjud in hyresgäst",
  subtitle: "Välj fastighet med ledig plats",
  back: "Tillbaka",
  empty: "Inga fastigheter med lediga enheter",
  emptySub: "Alla aktiva fastigheter är fullbokade. Aktivera en ny fastighet eller ta bort en hyresgäst för att bjuda in någon ny.",
  retry: "Försök igen",
};

export default function InviteTenantScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const props = await api.get<Property[]>("/api/properties", token);
      setProperties(props);

      const active = props.filter((p) => p.status === 0);
      const results = await Promise.all(
        active.map(async (p): Promise<[string, Availability]> => {
          try {
            const s = await api.get<PropertyStructureResponse>(`/api/properties/${p.id}/buildings`, token);
            const allUnits: Unit[] = [
              ...s.buildings.flatMap((b) => [
                ...b.floors.flatMap((f) => f.units),
                ...(b.directUnits ?? []),
              ]),
              ...(s.propertyUnits ?? []),
            ];
            const total = allUnits.length;
            const occupied = allUnits.filter((u) => !!(u.occupantFirstName || u.occupantLastName)).length;
            return [p.id, { total, free: total - occupied }];
          } catch {
            return [p.id, { total: 0, free: 0 }];
          }
        }),
      );
      setAvailability(Object.fromEntries(results));
    } catch (e) {
      const message = (e as { message?: string })?.message ?? "Kunde inte hämta fastigheter";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  useEffect(() => {
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (!user) return <Redirect href="/login" />;
  if (user.role !== "Admin") return <Redirect href="/home" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  const openProperty = (p: Property) =>
    router.push({ pathname: "/property/[id]", params: { id: p.id } });

  const visibleProperties = properties
    .filter((p) => p.status === 0)
    .filter((p) => (availability[p.id]?.free ?? 0) > 0)
    .sort((a, b) => (b.covabePropertyId ?? 0) - (a.covabePropertyId ?? 0));

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

      <Text style={[s.subtitle, { color: theme.textMute }]}>{T.subtitle}</Text>

      {loading && properties.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : error && properties.length === 0 ? (
        <View style={s.centered}>
          <Text style={[s.errorText, { color: theme.danger }]}>{error}</Text>
          <Pressable
            onPress={fetchAll}
            style={({ pressed }) => [
              s.retryBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={s.retryText}>{T.retry}</Text>
          </Pressable>
        </View>
      ) : visibleProperties.length === 0 ? (
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
          {visibleProperties.map((p) => (
            <PropertyCard
              key={p.id}
              theme={theme}
              property={p}
              availability={availability[p.id]}
              onPress={() => openProperty(p)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PropertyCard({
  theme, property, availability, onPress,
}: {
  theme: Theme;
  property: Property;
  availability: Availability | undefined;
  onPress: () => void;
}) {
  const addressLine = property.name || property.address || "Namnlös fastighet";
  const cityLine = [property.country, property.city, property.address]
    .filter((v) => v && v !== addressLine)
    .join(", ");
  const typeKey: PropertyType = propertyTypeFromInt(property.type);
  const typeMeta = PROPERTY_TYPE_META[typeKey];
  const unitsWord = typeMeta.unitsLabel.toLowerCase();
  const availabilityLabel = availability
    ? `${availability.free} av ${availability.total} ${unitsWord} lediga`
    : "—";

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
          <View style={[s.availPill, { backgroundColor: `${theme.success}15` }]}>
            <View style={[s.availDot, { backgroundColor: theme.success }]} />
            <Text style={[s.availText, { color: theme.success }]} numberOfLines={1}>
              {availabilityLabel}
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
  subtitle: {
    fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },

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

  availPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  availDot:  { width: 6, height: 6, borderRadius: 3 },
  availText: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 0.2 },

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
