import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, useColorScheme,
  SafeAreaView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Redirect, useRouter } from "expo-router";

import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { CovabeLogo } from "@/components/CovabeLogo";
import { useAuth } from "@/services/auth-context";

const STRINGS = {
  welcome: "Logga in för att fortsätta",
  email: "E-post",
  password: "Lösenord",
  emailPlaceholder: "namn@exempel.se",
  passwordPlaceholder: "••••••••",
  login: "Logga in",
  haveInvite: "Har du en inbjudningskod?",
  activate: "Aktivera ditt konto",
  errorEmpty: "Fyll i e-post och lösenord",
};

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/home" />;

  const handleLogin = async () => {
    if (!email || !password) {
      setError(STRINGS.errorEmpty);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/home");
    } catch (e) {
      const message = (e as { message?: string })?.message ?? "Fel e-post eller lösenord";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = () => {
    router.push("/accept-invitation");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CalmHero theme={theme} />

          <View style={s.form}>
            <Text style={[s.title, { color: theme.text }]}>{STRINGS.welcome}</Text>

            <TextField
              theme={theme}
              label={STRINGS.email}
              value={email}
              onChangeText={setEmail}
              placeholder={STRINGS.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<MailIcon color={theme.textMute} />}
            />

            <TextField
              theme={theme}
              label={STRINGS.password}
              value={password}
              onChangeText={setPassword}
              placeholder={STRINGS.passwordPlaceholder}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoComplete="password"
              icon={<LockIcon color={theme.textMute} />}
              suffix={
                <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                  {showPw
                    ? <EyeOffIcon color={theme.textMute} />
                    : <EyeIcon color={theme.textMute} />}
                </Pressable>
              }
            />

            {error && <Text style={[s.error, { color: theme.danger }]}>{error}</Text>}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                s.primaryBtn,
                { backgroundColor: theme.accent, opacity: loading ? 0.6 : pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={s.primaryBtnText}>{loading ? "…" : STRINGS.login}</Text>
            </Pressable>

            <Pressable onPress={handleAcceptInvite} style={s.linkBtn}>
              <Text style={[s.linkText, { color: theme.textMute }]}>
                {STRINGS.haveInvite}{" "}
                <Text style={{ color: theme.accent, fontFamily: Fonts.semibold }}>
                  {STRINGS.activate}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CalmHero({ theme }: { theme: Theme }) {
  return (
    <View
      style={{
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: "center",
        gap: 18,
        backgroundColor: theme.dark ? "#0a3036" : `${theme.accent}10`,
      }}
    >
      <CovabeLogo size={56} light={theme.dark} />
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: Fonts.display,
            fontSize: 26,
            color: theme.dark ? "#fff" : theme.accent,
            letterSpacing: -0.6,
          }}
        >
          Covabe
        </Text>
        <Text
          style={{
            fontFamily: Fonts.medium,
            fontSize: 11,
            color: theme.textMute,
            marginTop: 6,
            letterSpacing: 1,
          }}
        >
          TENANT PORTAL
        </Text>
      </View>
    </View>
  );
}

type FieldProps = {
  theme: Theme;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  autoComplete?: any;
};

function TextField({
  theme, label, value, onChangeText, placeholder,
  icon, suffix, secureTextEntry, keyboardType, autoCapitalize, autoComplete,
}: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: theme.textMute }}>
        {label}
      </Text>
      <View
        style={[
          s.field,
          { backgroundColor: theme.inputBg, borderColor: theme.border },
        ]}
      >
        {icon && <View>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          style={[
            s.fieldInput,
            { color: theme.text, fontFamily: Fonts.regular },
          ]}
        />
        {suffix}
      </View>
    </View>
  );
}

const Icon = ({ children, color = "#000", size = 20 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const MailIcon  = (p: any) => <Icon {...p}><Path d="M3 5h18v14H3z M3 7l9 6 9-6"/></Icon>;
const LockIcon  = (p: any) => <Icon {...p}><Path d="M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4"/></Icon>;
const EyeIcon   = (p: any) => <Icon {...p}><Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></Icon>;
const EyeOffIcon= (p: any) => <Icon {...p}><Path d="M3 3l18 18"/><Path d="M2 12s3-7 10-7c2 0 3.7.6 5.1 1.5"/><Path d="M22 12s-3 7-10 7c-2 0-3.7-.6-5.1-1.5"/></Icon>;

const s = StyleSheet.create({
  form: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.huge,
    paddingTop: Spacing.lg,
    gap: 14,
    marginTop: "auto",
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  linkBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  linkText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
});
