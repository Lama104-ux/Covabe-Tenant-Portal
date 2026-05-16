import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { api, ApiError } from "@/services/api";
import { useAuth } from "@/services/auth-context";

const T = {
  back: "Tillbaka",
  title: "Byt lösenord",
  subtitle: "Uppdatera ditt lösenord regelbundet för att hålla kontot säkert.",
  current: "Nuvarande lösenord",
  next: "Nytt lösenord",
  confirm: "Bekräfta nytt lösenord",
  save: "Spara nytt lösenord",
  saving: "Sparar…",
  savedTitle: "Lösenord uppdaterat",
  savedSub: "Du kan fortsätta använda appen som vanligt.",
  reqLength: "Minst 8 tecken",
  reqUpper: "En stor bokstav",
  reqDigit: "En siffra",
  errCurrent: "Ange ditt nuvarande lösenord",
  errMatch: "Lösenorden matchar inte",
  errReqs: "Det nya lösenordet uppfyller inte kraven",
};

export default function ChangePasswordScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user, token } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const reqs = useMemo(() => ({
    len: next.length >= 8,
    upper: /[A-ZÅÄÖ]/.test(next),
    digit: /\d/.test(next),
  }), [next]);
  const pwValid = reqs.len && reqs.upper && reqs.digit;
  const canSave = current.length > 0 && pwValid && next === confirm;

  if (!user) return <Redirect href="/login" />;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  const handleSave = async () => {
    if (!current) { setError(T.errCurrent); return; }
    if (!pwValid) { setError(T.errReqs); return; }
    if (next !== confirm) { setError(T.errMatch); return; }
    setError(null);
    setLoading(true);
    try {
      await api.post(
        "/api/auth/change-password",
        { currentPassword: current, newPassword: next },
        token,
      );
      setSaved(true);
      setTimeout(() => goBack(), 1400);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message ?? "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
        <View style={s.successWrap}>
          <View style={[s.successCircle, { backgroundColor: `${theme.success}1e` }]}>
            <CheckIcon color={theme.success} size={40} />
          </View>
          <Text style={[s.successTitle, { color: theme.text }]}>{T.savedTitle}</Text>
          <Text style={[s.successSub, { color: theme.textMute }]}>{T.savedSub}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.header}>
          <Pressable onPress={goBack} hitSlop={10} style={s.backBtn}>
            <ChevronLeft color={theme.text} />
            <Text style={[s.backText, { color: theme.text }]}>{T.back}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 32, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 6, paddingVertical: 6 }}>
            <Text style={[s.title, { color: theme.text }]}>{T.title}</Text>
            <Text style={[s.subtitle, { color: theme.textMute }]}>{T.subtitle}</Text>
          </View>

          <PwField theme={theme} label={T.current} value={current} onChangeText={setCurrent}
                   show={showCur} onToggleShow={() => setShowCur(!showCur)} />

          <PwField theme={theme} label={T.next} value={next} onChangeText={setNext}
                   show={showNew} onToggleShow={() => setShowNew(!showNew)} />

          <View style={[s.reqsBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Req theme={theme} ok={reqs.len}   label={T.reqLength} />
            <Req theme={theme} ok={reqs.upper} label={T.reqUpper} />
            <Req theme={theme} ok={reqs.digit} label={T.reqDigit} />
          </View>

          <PwField theme={theme} label={T.confirm} value={confirm} onChangeText={setConfirm}
                   show={showNew} onToggleShow={() => setShowNew(!showNew)} />

          {error ? <Text style={[s.error, { color: theme.danger }]}>{error}</Text> : null}

          <Pressable
            onPress={handleSave}
            disabled={!canSave || loading}
            style={({ pressed }) => [
              s.primaryBtn,
              {
                backgroundColor: theme.accent,
                opacity: !canSave || loading ? 0.45 : pressed ? 0.92 : 1,
                marginTop: 8,
              },
            ]}
          >
            <Text style={s.primaryBtnText}>{loading ? T.saving : T.save}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PwField({
  theme, label, value, onChangeText, show, onToggleShow,
}: {
  theme: Theme;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, { color: theme.textMute }]}>{label}</Text>
      <View style={[s.field, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <LockIcon color={theme.textMute} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="••••••••"
          placeholderTextColor={theme.textFaint}
          style={[s.fieldInput, { color: theme.text, fontFamily: Fonts.regular }]}
        />
        <Pressable onPress={onToggleShow} hitSlop={8}>
          {show ? <EyeOffIcon color={theme.textMute} /> : <EyeIcon color={theme.textMute} />}
        </Pressable>
      </View>
    </View>
  );
}

function Req({ theme, ok, label }: { theme: Theme; ok: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
      <View style={[
        s.reqDot,
        {
          backgroundColor: ok ? theme.success : "transparent",
          borderColor: ok ? theme.success : theme.borderStrong,
        },
      ]}>
        {ok ? <CheckIcon color="#fff" size={11} /> : null}
      </View>
      <Text style={{
        fontFamily: Fonts.regular, fontSize: 13,
        color: ok ? theme.text : theme.textMute,
      }}>{label}</Text>
    </View>
  );
}

const Icon = ({ children, color = "#000", size = 20 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const LockIcon = (p: any) => <Icon {...p}><Rect x="3" y="11" width="18" height="11" rx="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>;
const EyeIcon = (p: any) => <Icon {...p}><Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></Icon>;
const EyeOffIcon = (p: any) => <Icon {...p}><Path d="M3 3l18 18"/><Path d="M2 12s3-7 10-7c2 0 3.7.6 5.1 1.5"/><Path d="M22 12s-3 7-10 7c-2 0-3.7-.6-5.1-1.5"/></Icon>;
const ChevronLeft = (p: any) => <Icon {...p} size={22}><Path d="M15 6l-6 6 6 6"/></Icon>;
const CheckIcon = ({ color = "#fff", size = 16 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12l5 5L20 7"/>
  </Svg>
);

const s = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    flexDirection: "row", alignItems: "center",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, padding: 4 },
  backText: { fontFamily: Fonts.medium, fontSize: 14 },

  title:    { fontFamily: Fonts.bold, fontSize: 22 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19 },

  label: { fontFamily: Fonts.medium, fontSize: 12 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  fieldInput: { flex: 1, fontSize: 15, padding: 0 },

  reqsBox: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  reqDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },

  primaryBtn: {
    paddingVertical: 16, borderRadius: Radius.lg, alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontFamily: Fonts.semibold, fontSize: 15 },

  error: { fontFamily: Fonts.medium, fontSize: 12 },

  successWrap: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 30,
  },
  successCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontFamily: Fonts.bold, fontSize: 20, textAlign: "center" },
  successSub:   { fontFamily: Fonts.regular, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
