import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { api, ApiError } from "@/services/api";
import { useAuth } from "@/services/auth-context";

type InvitationStatus = "pending" | "accepted" | "expired" | null;

type UnitDetail = {
  unitId: string;
  propertyId: string;
  buildingId: string | null;
  floorId: string | null;
  occupantFirstName: string | null;
  occupantLastName: string | null;
  occupantEmail: string | null;
  occupantPhone: string | null;
  assignedAt: string | null;
  invitationStatus: InvitationStatus;
  acceptUrl: string | null;
};

type Building = {
  id: string;
  name: string | null;
  floors: { id: string; number: number; units: { id: string; code: string | null; customUnitId: string | null }[] }[];
};

type Ctx = {
  buildingName: string | null;
  floorNumber: number | null;
  unitLabel: string;
};

const T = {
  back: "Tillbaka",
  title: "Lägenhetsdetaljer",
  loading: "Hämtar lägenhetsdata…",
  notFound: "Lägenheten hittades inte",
  vacant: "Ledig",
  rented: "Uthyrd",
  occupantSection: "Hyresgäst",
  noOccupant: "Ingen hyresgäst tilldelad ännu",
  assignButton: "Bjud in hyresgäst",
  cancel: "Avbryt",
  send: "Skicka inbjudan",
  saving: "Skickar…",
  removeButton: "Ta bort hyresgäst",
  removing: "Tar bort…",
  removeConfirmTitle: "Ta bort hyresgäst?",
  removeConfirmMsg: "Är du säker på att du vill ta bort hyresgästen från denna lägenhet? Inbjudan tas också bort om den inte har använts.",
  firstNameLabel: "Förnamn",
  lastNameLabel: "Efternamn",
  fullNameLabel: "Namn",
  emailLabel: "E-post",
  phoneLabel: "Telefon (valfritt)",
  firstNameRequired: "Förnamn krävs",
  lastNameRequired: "Efternamn krävs",
  emailRequired: "E-post krävs",
  emailInvalid: "Ogiltig e-postadress",
  saveFailed: "Kunde inte skicka inbjudan. Försök igen.",
  removeFailed: "Kunde inte ta bort. Försök igen.",
  invitationStatusLabel: "Status",
  inviteSentTitle: "Inbjudan skickad",
  inviteSentDesc: "Hyresgästen har fått en länk för att skapa konto.",
  invitePending: "Inbjudan väntar på att accepteras",
  inviteAccepted: "Hyresgästen har skapat konto",
  inviteExpired: "Inbjudan har löpt ut",
  acceptUrlLabel: "Aktiveringslänk (synlig endast i utveckling)",
};

function invitationStatusLabel(s: InvitationStatus): string {
  if (s === "accepted") return T.inviteAccepted;
  if (s === "expired") return T.inviteExpired;
  if (s === "pending") return T.invitePending;
  return "—";
}

export default function UnitDetailScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();
  const { id, propertyId } = useLocalSearchParams<{ id: string; propertyId: string }>();

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!id || !propertyId || !token) return;
    try {
      const [detail, buildings] = await Promise.all([
        api.get<UnitDetail>(`/api/properties/${propertyId}/units/${id}`, token),
        api.get<Building[]>(`/api/properties/${propertyId}/buildings`, token),
      ]);
      setUnit(detail);

      let buildingName: string | null = null;
      let floorNumber: number | null = null;
      let unitLabel = "—";
      for (const b of buildings) {
        for (const f of b.floors) {
          const found = f.units.find((u) => u.id === id);
          if (found) {
            buildingName = b.name;
            floorNumber = f.number;
            unitLabel = found.code || found.customUnitId || "—";
            break;
          }
        }
      }
      setCtx({ buildingName, floorNumber, unitLabel });
    } catch (e) {
      void e;
    } finally {
      setLoading(false);
    }
  }, [id, propertyId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!user) return <Redirect href="/login" />;
  if (user.role !== "Admin") return <Redirect href="/home" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/properties");
  };

  const validate = (): string | null => {
    if (!form.firstName.trim()) return T.firstNameRequired;
    if (!form.lastName.trim()) return T.lastNameRequired;
    if (!form.email.trim()) return T.emailRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return T.emailInvalid;
    return null;
  };

  const handleAssign = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await api.post<UnitDetail>(
        `/api/properties/${propertyId}/units/${id}/assign`,
        {
          tenantFirstName: form.firstName.trim(),
          tenantLastName: form.lastName.trim(),
          tenantEmail: form.email.trim(),
          tenantPhone: form.phone.trim() || null,
        },
        token,
      );
      setUnit(result);
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
      setShowForm(false);
    } catch (e) {
      const err = e as ApiError;
      setFormError(err.message || T.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const performRemove = async () => {
    setRemoving(true);
    try {
      await api.delete(`/api/properties/${propertyId}/units/${id}/assignment`, token);
      setUnit((prev) =>
        prev
          ? {
              ...prev,
              occupantFirstName: null,
              occupantLastName: null,
              occupantEmail: null,
              occupantPhone: null,
              assignedAt: null,
              invitationStatus: null,
              acceptUrl: null,
            }
          : prev,
      );
    } catch {
      Alert.alert("Fel", T.removeFailed);
    } finally {
      setRemoving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(T.removeConfirmTitle, T.removeConfirmMsg, [
      { text: T.cancel, style: "cancel" },
      { text: T.removeButton, style: "destructive", onPress: performRemove },
    ]);
  };

  if (loading && !unit) {
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

  if (!unit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <Header theme={theme} onBack={goBack} />
        <View style={s.centered}>
          <Text style={{ color: theme.textMute, fontFamily: Fonts.medium }}>{T.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [unit.occupantFirstName, unit.occupantLastName].filter(Boolean).join(" ");
  const occupied = !!fullName;
  const dot = occupied ? "#009700" : theme.textMute;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <Header theme={theme} onBack={goBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 4, paddingVertical: 8 }}>
            <Text style={[s.crumbs, { color: theme.textMute }]}>
              {[ctx?.buildingName, ctx?.floorNumber != null ? `Våning ${ctx.floorNumber}` : null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>
              Lägenhet {ctx?.unitLabel}
            </Text>
          </View>

          <View style={[s.hero, { backgroundColor: theme.accent }]}>
            <View style={[s.statusChip, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <View style={[s.statusDot, { backgroundColor: occupied ? "#A8FFA8" : "#E5E7EB" }]} />
              <Text style={s.statusChipText}>{occupied ? T.rented : T.vacant}</Text>
            </View>
            <View>
              <Text style={s.heroLabel}>{T.title}</Text>
              <Text style={s.heroSummary} numberOfLines={2}>
                {occupied ? fullName : T.noOccupant}
              </Text>
            </View>
          </View>

          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={[s.legendDot, { backgroundColor: dot }]} />
              <Text style={[s.cardTitle, { color: theme.text }]}>{T.occupantSection}</Text>
            </View>

            {occupied ? (
              <View style={{ gap: 8 }}>
                <DetailRow theme={theme} label={T.firstNameLabel} value={unit.occupantFirstName || "—"} />
                <DetailRow theme={theme} label={T.lastNameLabel} value={unit.occupantLastName || "—"} />
                <DetailRow theme={theme} label={T.emailLabel} value={unit.occupantEmail || "—"} />
                {unit.occupantPhone ? (
                  <DetailRow theme={theme} label={T.phoneLabel} value={unit.occupantPhone} />
                ) : null}
                <DetailRow
                  theme={theme}
                  label={T.invitationStatusLabel}
                  value={invitationStatusLabel(unit.invitationStatus)}
                />
                {unit.acceptUrl ? (
                  <DetailRow theme={theme} label={T.acceptUrlLabel} value={unit.acceptUrl} />
                ) : null}
                <Pressable
                  onPress={handleRemove}
                  disabled={removing}
                  style={({ pressed }) => [
                    s.dangerBtn,
                    { backgroundColor: theme.danger, opacity: pressed || removing ? 0.75 : 1, marginTop: 8 },
                  ]}
                >
                  <Text style={s.dangerBtnText}>{removing ? T.removing : T.removeButton}</Text>
                </Pressable>
              </View>
            ) : showForm ? (
              <View style={{ gap: 10 }}>
                <Field
                  theme={theme} label={T.firstNameLabel}
                  value={form.firstName}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  autoCapitalize="words"
                />
                <Field
                  theme={theme} label={T.lastNameLabel}
                  value={form.lastName}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  autoCapitalize="words"
                />
                <Field
                  theme={theme} label={T.emailLabel}
                  value={form.email}
                  onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  theme={theme} label={T.phoneLabel}
                  value={form.phone}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                  keyboardType="phone-pad"
                />
                {formError ? (
                  <Text style={[s.errorText, { color: theme.danger }]}>{formError}</Text>
                ) : null}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <Pressable
                    onPress={() => { setShowForm(false); setFormError(null); setForm({ firstName: "", lastName: "", email: "", phone: "" }); }}
                    style={({ pressed }) => [
                      s.secondaryBtn,
                      { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                    ]}
                    disabled={submitting}
                  >
                    <Text style={[s.secondaryBtnText, { color: theme.text }]}>{T.cancel}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAssign}
                    disabled={submitting}
                    style={({ pressed }) => [
                      s.primaryBtn,
                      { backgroundColor: theme.accent, opacity: pressed || submitting ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>{submitting ? T.saving : T.send}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={[s.muted, { color: theme.textMute, marginBottom: 12 }]}>{T.noOccupant}</Text>
                <Pressable
                  onPress={() => setShowForm(true)}
                  style={({ pressed }) => [
                    s.primaryBtn,
                    { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={s.primaryBtnText}>{T.assignButton}</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

function DetailRow({ theme, label, value }: { theme: Theme; label: string; value: string }) {
  return (
    <View>
      <Text style={[s.fieldLabel, { color: theme.textMute }]}>{label}</Text>
      <Text style={[s.fieldValue, { color: theme.text }]} selectable>{value}</Text>
    </View>
  );
}

function Field({
  theme, label, value, onChangeText, keyboardType, autoCapitalize,
}: {
  theme: Theme; label: string; value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View>
      <Text style={[s.fieldLabel, { color: theme.textMute }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.textFaint}
        style={[s.input, { borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }]}
      />
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

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  backIconBtn: {
    width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  crumbs: { fontFamily: Fonts.medium, fontSize: 12 },
  title:  { fontFamily: Fonts.bold, fontSize: 22 },

  hero: {
    minHeight: 130, borderRadius: Radius.lg, overflow: "hidden",
    padding: 14, justifyContent: "space-between", gap: 12,
  },
  statusChip: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontFamily: Fonts.semibold, fontSize: 11, color: "#fff", letterSpacing: 0.4 },
  heroLabel: { fontFamily: Fonts.medium, fontSize: 11, color: "rgba(255,255,255,0.85)" },
  heroSummary: { fontFamily: Fonts.bold, fontSize: 17, color: "#fff", marginTop: 6 },

  card: {
    borderWidth: 1, borderRadius: Radius.md, padding: 16,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 15 },
  muted: { fontFamily: Fonts.regular, fontSize: 13 },

  fieldLabel: { fontFamily: Fonts.medium, fontSize: 11, marginBottom: 4 },
  fieldValue: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 18 },

  input: {
    borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Fonts.regular, fontSize: 14,
  },

  primaryBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.md, alignItems: "center",
  },
  primaryBtnText: { fontFamily: Fonts.semibold, fontSize: 14, color: "#fff" },
  secondaryBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.md, alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: { fontFamily: Fonts.semibold, fontSize: 14 },

  dangerBtn: {
    paddingVertical: 13, borderRadius: Radius.md, alignItems: "center",
  },
  dangerBtnText: { fontFamily: Fonts.semibold, fontSize: 14, color: "#fff" },

  errorText: { fontFamily: Fonts.medium, fontSize: 12 },

  legendDot: { width: 10, height: 10, borderRadius: 5 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxl },
});
