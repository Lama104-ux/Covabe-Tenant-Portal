import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet,
  Text, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { PROPERTY_TYPE_META, propertyTypeFromInt } from "@/constants/propertyTypes";
import { Building, BuildingsDrillDown, ViewState } from "@/components/BuildingsDrillDown";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

type Property = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: number;
  type: number | null;
};

const T = {
  back: "Tillbaka",
  propertyDetails: "Fastighetsdetaljer",
  address: "Adress",
  statusActive: "Aktiv",
  statusInactive: "Inaktiv",
  contractStatus: "Status",
  openTickets: "öppna ärenden",
  noLeaseholder: "Ingen hyresgäst ännu",
  loading: "Hämtar fastighetsdata…",
  notFound: "Fastighet hittades inte",
};

export default function PropertyDetailScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [property, setProperty] = useState<Property | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ level: "buildings" });

  const fetchAll = useCallback(async () => {
    if (!id || !token) return;
    try {
      const [props, blds] = await Promise.all([
        api.get<Property[]>("/api/properties", token),
        api.get<Building[]>(`/api/properties/${id}/buildings`, token),
      ]);
      setProperty(props.find((p) => p.id === id) ?? null);
      setBuildings(blds);
    } catch (e) {
      void e;
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchAll();
    const intervalId = setInterval(fetchAll, 30000);
    return () => clearInterval(intervalId);
  }, [fetchAll]);

  const skipBuilding = buildings.length === 1;

  const goBack = useCallback(() => {
    if (view.level === "units") {
      setView({ level: "floors", buildingIdx: view.buildingIdx });
      return;
    }
    if (view.level === "floors" && !skipBuilding) {
      setView({ level: "buildings" });
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/properties");
  }, [view, skipBuilding, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  if (!user) return <Redirect href="/login" />;
  if (user.role !== "Admin") return <Redirect href="/home" />;

  if (loading && !property) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <Header theme={theme} onBack={goBack} />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMute, fontFamily: Fonts.medium, marginTop: 12 }}>{T.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <Header theme={theme} onBack={goBack} />
        <View style={s.centered}>
          <Text style={{ color: theme.textMute, fontFamily: Fonts.medium }}>{T.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeKey = propertyTypeFromInt(property.type);
  const meta = PROPERTY_TYPE_META[typeKey];
  const active = property.status === 0;
  const addressLine = property.name || property.address || "Namnlös fastighet";
  const cityLine = [property.city, property.country].filter(Boolean).join(", ");
  const fullAddress = [property.address, property.city, property.country].filter(Boolean).join(", ");

  const totalUnits = buildings.reduce((a, b) => a + b.floors.reduce((aa, f) => aa + f.units.length, 0), 0);
  const occupiedUnits = buildings.reduce(
    (a, b) => a + b.floors.reduce((aa, f) => aa + f.units.filter((u) => !!(u.occupantFirstName || u.occupantLastName)).length, 0),
    0,
  );
  const totalBuildings = buildings.length;

  const heroSummary = totalBuildings > 0
    ? `${totalBuildings} ${totalBuildings === 1 ? "byggnad" : "byggnader"}`
    : T.propertyDetails;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <Header theme={theme} onBack={goBack} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4, paddingVertical: 8 }}>
          <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>{addressLine}</Text>
          {cityLine ? (
            <Text style={[s.subtitle, { color: theme.textMute }]}>{cityLine}</Text>
          ) : null}
        </View>

        <View style={[s.hero, { backgroundColor: theme.accent }]}>
          <View style={s.typeChip}>
            <Text style={s.typeChipText}>{meta.label.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={s.heroLabel}>Struktur</Text>
            <Text style={s.heroSummary} numberOfLines={2}>{heroSummary}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {meta.unitsKey ? (
            <>
              <Stat theme={theme} value={totalUnits} label={meta.unitsLabel} />
              <Stat theme={theme} value={occupiedUnits} label="Uthyrda" accent={occupiedUnits > 0} />
              <Stat theme={theme} value={active ? T.statusActive : T.statusInactive} label={T.contractStatus} accent={active} />
            </>
          ) : (
            <>
              <Stat theme={theme} value={occupiedUnits} label={meta.occupantsLabel} accent={occupiedUnits > 0} />
              <Stat theme={theme} value={active ? T.statusActive : T.statusInactive} label={T.contractStatus} accent={active} />
              <Stat theme={theme} value={0} label={T.openTickets} />
            </>
          )}
        </View>

        {fullAddress ? (
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[s.cardIcon, { backgroundColor: theme.accentSoft }]}>
              <MapPinIcon color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, { color: theme.textMute }]}>{T.address}</Text>
              <Text style={[s.cardValue, { color: theme.text }]} numberOfLines={2}>{fullAddress}</Text>
            </View>
          </View>
        ) : null}

        <BuildingsDrillDown theme={theme} propertyType={typeKey} propertyId={id!} buildings={buildings} view={view} setView={setView} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ theme, onBack }: { theme: Theme; onBack: () => void }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onBack} hitSlop={10} style={s.backIconBtn}>
        <ChevronLeft color={theme.text} />
      </Pressable>
      <View style={{ flex: 1 }} />
      <View style={s.backIconBtn} />
    </View>
  );
}

function Stat({ theme, value, label, accent }: { theme: Theme; value: number | string; label: string; accent?: boolean }) {
  return (
    <View style={[s.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[s.statValue, { color: accent ? theme.accent : theme.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.textMute }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const Icon = ({ children, color = "#000", size = 20 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const ChevronLeft = (p: any) => <Icon {...p} size={22}><Path d="M15 6l-6 6 6 6"/></Icon>;
const MapPinIcon  = (p: any) => <Icon {...p}><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></Icon>;

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  backIconBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: Fonts.bold, fontSize: 22 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13 },

  hero: {
    height: 130, borderRadius: Radius.lg, overflow: "hidden",
    padding: 14, justifyContent: "space-between",
  },
  typeChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  typeChipText: { fontFamily: Fonts.semibold, fontSize: 10.5, color: "#fff", letterSpacing: 0.6 },
  heroLabel: { fontFamily: Fonts.medium, fontSize: 11, color: "rgba(255,255,255,0.85)" },
  heroSummary: { fontFamily: Fonts.bold, fontSize: 17, color: "#fff", marginTop: 6 },

  statCard: {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    padding: 14, gap: 4,
  },
  statValue: { fontFamily: Fonts.bold, fontSize: 18 },
  statLabel: { fontFamily: Fonts.regular, fontSize: 10.5, lineHeight: 13 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: Radius.md, padding: 14,
  },
  cardIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  cardLabel: { fontFamily: Fonts.medium, fontSize: 11 },
  cardValue: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 18, marginTop: 4 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxl },
});
