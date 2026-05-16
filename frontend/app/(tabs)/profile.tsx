import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { api, ApiError } from "@/services/api";
import { useAuth, User } from "@/services/auth-context";

const T = {
  profile: "Profil",
  settings: "INSTÄLLNINGAR",
  name: "Namn",
  email: "E-post",
  changePassword: "Byt lösenord",
  logOut: "Logga ut",
  editNameTitle: "Ändra namn",
  firstName: "Förnamn",
  lastName: "Efternamn",
  cancel: "Avbryt",
  save: "Spara",
  saving: "Sparar…",
  firstNameRequired: "Förnamn krävs",
  lastNameRequired: "Efternamn krävs",
  saveFailed: "Kunde inte spara. Försök igen.",
};

const ROLE_LABELS: Record<string, string> = {
  Admin: "Fastighetsägare",
  SuperAdmin: "Systemadministratör",
  Tenant: "Hyresgäst",
};

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, logout, updateUser, token } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!user) return <Redirect href="/login" />;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const openEdit = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setFormError(null);
    setEditOpen(true);
  };

  const saveName = async () => {
    if (!firstName.trim()) { setFormError(T.firstNameRequired); return; }
    if (!lastName.trim()) { setFormError(T.lastNameRequired); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const updated = await api.put<User>(
        "/api/auth/me",
        { firstName: firstName.trim(), lastName: lastName.trim() },
        token,
      );
      await updateUser(updated);
      setEditOpen(false);
    } catch (e) {
      const err = e as ApiError;
      setFormError(err.message || T.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      <View style={s.header}>
        <Text style={[s.headerTitle, { color: theme.text }]}>{T.profile}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[s.avatarText, { color: theme.accent }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.userName, { color: theme.text }]} numberOfLines={1}>{fullName}</Text>
            <Text style={[s.userEmail, { color: theme.textMute }]} numberOfLines={1}>{user.email}</Text>
            <View style={[s.rolePill, { backgroundColor: theme.accentSoft }]}>
              <Text style={[s.rolePillText, { color: theme.accent }]}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: theme.textMute }]}>{T.settings}</Text>

        <View style={[s.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingRow
            theme={theme}
            icon={<UserIcon color={theme.accent} />}
            label={T.name}
            value={fullName}
            chevron
            onPress={openEdit}
            isFirst
          />
          <SettingRow
            theme={theme}
            icon={<MailIcon color={theme.accent} />}
            label={T.email}
            value={user.email}
          />
          <SettingRow
            theme={theme}
            icon={<LockIcon color={theme.accent} />}
            label={T.changePassword}
            chevron
            onPress={() => router.push("/change-password")}
          />
        </View>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            s.logoutBtn,
            { borderColor: `${theme.danger}40`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <LogoutIcon color={theme.danger} />
          <Text style={[s.logoutText, { color: theme.danger }]}>{T.logOut}</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setEditOpen(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalBackdrop}
        >
          <Pressable
            style={s.modalBackdropTouchable}
            onPress={() => !submitting && setEditOpen(false)}
          >
            <Pressable
              style={[s.modalCard, { backgroundColor: theme.surface }]}
              onPress={() => {}}
            >
              <Text style={[s.modalTitle, { color: theme.text }]}>{T.editNameTitle}</Text>
              <View style={{ gap: 10, marginTop: 14 }}>
                <Field
                  theme={theme}
                  label={T.firstName}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
                <Field
                  theme={theme}
                  label={T.lastName}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
                {formError ? (
                  <Text style={[s.errorText, { color: theme.danger }]}>{formError}</Text>
                ) : null}
              </View>
              <View style={s.modalActions}>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  disabled={submitting}
                  style={({ pressed }) => [
                    s.modalSecondaryBtn,
                    { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[s.modalSecondaryBtnText, { color: theme.text }]}>{T.cancel}</Text>
                </Pressable>
                <Pressable
                  onPress={saveName}
                  disabled={submitting}
                  style={({ pressed }) => [
                    s.modalPrimaryBtn,
                    { backgroundColor: theme.accent, opacity: pressed || submitting ? 0.85 : 1 },
                  ]}
                >
                  <Text style={s.modalPrimaryBtnText}>{submitting ? T.saving : T.save}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({
  theme, icon, label, value, chevron, onPress, isFirst,
}: {
  theme: Theme;
  icon: React.ReactNode;
  label: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  isFirst?: boolean;
}) {
  const content = (
    <View style={[
      s.row,
      { borderTopColor: theme.border, borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth },
    ]}>
      <View style={[s.rowIcon, { backgroundColor: theme.accentSoft }]}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
        {value ? (
          <Text style={[s.rowValue, { color: theme.textMute }]} numberOfLines={1}>{value}</Text>
        ) : null}
      </View>
      {chevron ? <ChevronRight color={theme.textMute} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function Field({
  theme, label, value, onChangeText, autoCapitalize,
}: {
  theme: Theme;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View>
      <Text style={[s.fieldLabel, { color: theme.textMute }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.textFaint}
        style={[s.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
      />
    </View>
  );
}

const Icon = ({ children, color = "#000", size = 18 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const UserIcon = (p: any) => <Icon {...p}><Circle cx="12" cy="8" r="4"/><Path d="M4 21a8 8 0 0 1 16 0"/></Icon>;
const MailIcon = (p: any) => <Icon {...p}><Rect x="3" y="5" width="18" height="14" rx="2"/><Path d="m3 7 9 6 9-6"/></Icon>;
const LockIcon = (p: any) => <Icon {...p}><Rect x="3" y="11" width="18" height="11" rx="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>;
const LogoutIcon = (p: any) => <Icon {...p} size={18}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>;
const ChevronRight = (p: any) => <Icon {...p} size={16}><Path d="m9 6 6 6-6 6"/></Icon>;

const s = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 24 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderRadius: Radius.lg, padding: 18,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: Fonts.semibold, fontSize: 18 },
  userName:   { fontFamily: Fonts.bold, fontSize: 16 },
  userEmail:  { fontFamily: Fonts.regular, fontSize: 12, marginTop: 4 },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 999, marginTop: 8,
  },
  rolePillText: { fontFamily: Fonts.semibold, fontSize: 10.5 },

  sectionLabel: {
    fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.6,
    paddingHorizontal: 4, paddingTop: 4,
  },

  settingsCard: { borderWidth: 1, borderRadius: Radius.lg, overflow: "hidden" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { fontFamily: Fonts.medium, fontSize: 13 },
  rowValue: { fontFamily: Fonts.regular, fontSize: 11.5, marginTop: 3 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderRadius: Radius.lg, paddingVertical: 14, marginTop: 8,
  },
  logoutText: { fontFamily: Fonts.semibold, fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalBackdropTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Radius.lg,
    padding: 20,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  modalSecondaryBtnText: { fontFamily: Fonts.semibold, fontSize: 14 },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  modalPrimaryBtnText: { fontFamily: Fonts.semibold, fontSize: 14, color: "#fff" },

  fieldLabel: { fontFamily: Fonts.medium, fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.regular, fontSize: 14,
  },
  errorText: { fontFamily: Fonts.medium, fontSize: 12 },
});
