import React from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Radius, Spacing, makeTheme } from "@/constants/theme";
import { useAuth } from "@/services/auth-context";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const { user, logout } = useAuth();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  const roleLabel = (role?: string) => {
    if (role === "Admin") return "Fastighetsägare";
    if (role === "SuperAdmin") return "Systemadministratör";
    if (role === "Tenant") return "Hyresgäst";
    return role ?? "";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>Profil</Text>
      </View>

      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={s.avatarRow}>
          <View style={[s.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[s.avatarText, { color: theme.accent }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: theme.text }]}>{fullName}</Text>
            <Text style={[s.role, { color: theme.accent }]}>{roleLabel(user?.role)}</Text>
          </View>
        </View>

        <View style={[s.divider, { backgroundColor: theme.border }]} />

        <Row label="E-post" value={user?.email ?? ""} theme={theme} />
      </View>

      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            s.logoutBtn,
            { borderColor: theme.danger, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[s.logoutText, { color: theme.danger }]}>Logga ut</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, theme }: any) {
  return (
    <View style={{ paddingVertical: 10, gap: 4 }}>
      <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: theme.textMute }}>{label}</Text>
      <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: theme.text }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontFamily: Fonts.bold, fontSize: 24 },

  card: {
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: Fonts.semibold, fontSize: 18 },
  name: { fontFamily: Fonts.bold, fontSize: 18 },
  role: { fontFamily: Fonts.medium, fontSize: 12, marginTop: 4, letterSpacing: 0.2 },
  divider: { height: 1, marginVertical: Spacing.md },

  logoutBtn: {
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
  },
  logoutText: { fontFamily: Fonts.semibold, fontSize: 15 },
});
