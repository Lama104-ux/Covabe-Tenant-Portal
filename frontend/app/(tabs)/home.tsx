import { useFocusEffect } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable, ScrollView, StatusBar, StyleSheet,
  Text, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
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
};

const T = {
  greeting: () => {
    const h = new Date().getHours();
    if (h < 11) return "God morgon";
    if (h < 17) return "God eftermiddag";
    return "God kväll";
  },
  roleLabel: (role: string) => {
    if (role === "Admin") return "Fastighetsägare";
    if (role === "SuperAdmin") return "Systemadministratör";
    if (role === "Tenant") return "Hyresgäst";
    return role;
  },
  propertiesCount: "fastigheter",
  activeProperties: "aktiva fastigheter",
  openIssues: "öppna ärenden",
  quickActions: "SNABBÅTGÄRDER",
  myProperties: "Mina fastigheter",
  myPropertiesSub: "Se och hantera dina fastigheter",
  inviteTenant: "Bjud in hyresgäst",
  inviteTenantSub: "Skicka inbjudan via e-post",
  openIssuesTitle: "Öppna ärenden",
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, setTick] = useState(0);

  const fetchProperties = useCallback(async () => {
    if (!token || user?.role !== "Admin") {
      setLoaded(true);
      return;
    }
    try {
      const data = await api.get<Property[]>("/api/properties", token);
      setProperties(data);
    } catch (e) {
      void e;
    } finally {
      setLoaded(true);
    }
  }, [token, user?.role]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [fetchProperties]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      fetchProperties();
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchProperties]);

  if (!user) return <Redirect href="/login" />;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const total = properties.length;
  const active = properties.filter(p => p.status === 0).length;
  const open = 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.greetTop, { color: theme.textMute }]}>{T.greeting()},</Text>
            <Text style={[s.greetName, { color: theme.text }]}>{fullName}</Text>
            <Text style={[s.greetRole, { color: theme.accent }]}>{T.roleLabel(user.role)}</Text>
          </View>
          <Pressable onPress={() => router.push("/profile")} style={s.avatarBtn}>
            <View style={[s.avatar, { backgroundColor: theme.accentSoft }]}>
              <Text style={[s.avatarText, { color: theme.accent }]}>{initials}</Text>
            </View>
            <View style={[s.avatarDot, { backgroundColor: theme.accent, borderColor: theme.bg }]} />
          </Pressable>
        </View>

        {user.role === "Admin" && (
          <>
            <View style={s.statsRow}>
              <Stat theme={theme} value={loaded ? total : "…"}  label={T.propertiesCount} />
              <Stat theme={theme} value={loaded ? active : "…"} label={T.activeProperties} />
              <Stat theme={theme} value={loaded ? open : "…"}   label={T.openIssues} accent={open > 0} />
            </View>

            <Text style={[s.sectionLabel, { color: theme.textMute }]}>{T.quickActions}</Text>

            <View style={{ paddingHorizontal: Spacing.xl, gap: 10 }}>
              <QuickAction
                theme={theme}
                title={T.myProperties}
                subtitle={T.myPropertiesSub}
                icon={<BuildingIcon color="#fff" />}
                iconBg={theme.accent}
                onPress={() => router.push("/properties")}
                big
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuickAction
                  theme={theme}
                  title={T.inviteTenant}
                  subtitle={T.inviteTenantSub}
                  icon={<UserPlusIcon color={theme.accent} />}
                  iconBg={theme.accentSoft}
                  onPress={() => router.push("/create-invitation")}
                />
                <QuickAction
                  theme={theme}
                  title={T.openIssuesTitle}
                  subtitle={`${open} ${T.openIssues}`}
                  icon={<WrenchIcon color={theme.accent} />}
                  iconBg={theme.accentSoft}
                  onPress={() => router.push("/properties")}
                />
              </View>
            </View>
          </>
        )}

        {user.role === "SuperAdmin" && (
          <View style={{ paddingHorizontal: Spacing.xl, gap: 10 }}>
            <Text style={[s.sectionLabel, { color: theme.textMute, paddingHorizontal: 0 }]}>{T.quickActions}</Text>
            <QuickAction
              theme={theme}
              title="Bjud in fastighetsägare"
              subtitle="Skicka inbjudan via e-post"
              icon={<UserPlusIcon color="#fff" />}
              iconBg={theme.accent}
              onPress={() => router.push("/create-invitation")}
              big
            />
          </View>
        )}

        {user.role === "Tenant" && (
          <View style={{ paddingHorizontal: Spacing.xl, gap: 10 }}>
            <Text style={[s.sectionLabel, { color: theme.textMute, paddingHorizontal: 0 }]}>DIN BOSTAD</Text>
            <View style={[s.qa, { backgroundColor: theme.surface, borderColor: theme.border, minHeight: 100 }]}>
              <Text style={[s.qaTitle, { color: theme.textMute }]}>Information om din lägenhet kommer snart.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ theme, value, label, accent }: { theme: Theme; value: number | string; label: string; accent?: boolean }) {
  return (
    <View style={[s.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[s.statValue, { color: accent ? theme.accent : theme.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.textMute }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ theme, title, subtitle, icon, iconBg, onPress, big }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.qa,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
          flex: big ? undefined : 1,
          minHeight: big ? 110 : 130,
        },
      ]}
    >
      <View style={[s.qaIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ marginTop: "auto", gap: 2 }}>
        <Text style={[s.qaTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[s.qaSub, { color: theme.textMute }]} numberOfLines={2}>{subtitle}</Text>
      </View>
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
const UserPlusIcon = (p: any) => <Icon {...p}><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M19 8v6M22 11h-6"/></Icon>;
const WrenchIcon   = (p: any) => <Icon {...p}><Path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.83 2.83 0 1 1-4-4l9-9z"/></Icon>;

const s = StyleSheet.create({
  greetRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  greetTop:  { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 16 },
  greetName: { fontFamily: Fonts.bold, fontSize: 22, marginTop: 4 },
  greetRole: { fontFamily: Fonts.medium, fontSize: 12, marginTop: 4, letterSpacing: 0.2 },

  avatarBtn: { position: "relative" },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: Fonts.semibold, fontSize: 13 },
  avatarDot: {
    position: "absolute", top: -1, right: -1,
    width: 10, height: 10, borderRadius: 5, borderWidth: 2,
  },

  statsRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    padding: 14, gap: 4,
  },
  statValue: { fontFamily: Fonts.bold, fontSize: 22 },
  statLabel: { fontFamily: Fonts.regular, fontSize: 10.5, lineHeight: 13 },

  sectionLabel: {
    fontFamily: Fonts.semibold, fontSize: 12,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.xl, marginBottom: 10,
  },

  qa: {
    borderWidth: 1, borderRadius: Radius.lg,
    padding: 16, gap: 12,
  },
  qaIcon: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: "center", justifyContent: "center",
  },
  qaTitle: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 18 },
  qaSub:   { fontFamily: Fonts.regular, fontSize: 11, lineHeight: 15 },
});
