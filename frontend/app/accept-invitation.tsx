import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet,
  Text, TextInput, useColorScheme, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { CovabeLogo } from "@/components/CovabeLogo";
import { Fonts, Radius, Spacing, makeTheme, Theme } from "@/constants/theme";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";

const T = {
  back: "Tillbaka",
  step: (n: number, total: number) => `Steg ${n} av ${total}`,

  s1Title: "Aktivera ditt konto",
  s1Sub: "Klistra in inbjudningslänken eller koden du fått i mejlet.",
  s1Code: "Inbjudningskod",
  s1Placeholder: "Klistra in länken eller koden",
  s1Continue: "Fortsätt",
  s1NoCode: "Har du ingen kod?",
  s1Login: "Logga in istället",
  s1ErrEmpty: "Ange din inbjudningskod",

  s2Title: "Skapa ditt konto",
  s2Sub: "Fyll i dina uppgifter och välj ett säkert lösenord.",
  s2FirstName: "Förnamn",
  s2LastName: "Efternamn",
  s2Phone: "Telefonnummer (valfritt)",
  s2PhonePlaceholder: "070-xxx xx xx",
  s2Pw: "Lösenord",
  s2PwConfirm: "Bekräfta lösenord",
  s2Reqs: "Lösenordet måste innehålla:",
  s2Req8: "Minst 8 tecken",
  s2ReqUpper: "En stor bokstav",
  s2ReqDigit: "En siffra",
  s2Terms: "Jag godkänner ",
  s2TermsLink: "användarvillkor och integritetspolicy",
  s2Activate: "Aktivera konto",
  s2ErrNames: "Förnamn och efternamn måste vara minst 2 tecken",
  s2ErrMatch: "Lösenorden matchar inte",
  s2ErrTerms: "Du måste godkänna villkoren",
  s2ErrPhone: "Ange ett giltigt telefonnummer eller lämna fältet tomt",

  s3Title: "Välkommen till Covabe!",
  s3Sub: "Ditt konto är aktiverat. Du kan nu logga in och börja använda portalen.",
  s3Continue: "Gå till inloggning",
};

const TOTAL_STEPS = 3;

export default function AcceptInvitationScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [token, setToken] = useState("");
  const [tokenErr, setTokenErr] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (params.token && !token) setToken(params.token);
  }, [params.token]);

  const reqs = useMemo(() => ({
    len: pw.length >= 8,
    upper: /[A-ZÅÄÖ]/.test(pw),
    digit: /\d/.test(pw),
  }), [pw]);
  const pwValid = reqs.len && reqs.upper && reqs.digit;
  const namesValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;
  const canActivate = namesValid && pwValid && pw === pw2 && terms;

  if (user) return <Redirect href="/home" />;

  const parseToken = (raw: string) => {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      const tp = url.searchParams.get("token");
      if (tp) return tp;
    } catch {
      // not a URL — use raw
    }
    return trimmed;
  };

  const continueFromCode = () => {
    const t = parseToken(token);
    if (!t) { setTokenErr(T.s1ErrEmpty); return; }
    setToken(t);
    setTokenErr(null);
    setStep(2);
  };

  const activate = async () => {
    if (!namesValid) { setPwErr(T.s2ErrNames); return; }
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed && !/^[0-9+\-\s()]{6,}$/.test(phoneTrimmed)) {
      setPwErr(T.s2ErrPhone); return;
    }
    if (pw !== pw2) { setPwErr(T.s2ErrMatch); return; }
    if (!terms) { setPwErr(T.s2ErrTerms); return; }
    setPwErr(null);
    setActivating(true);
    try {
      await api.post<{ message: string }>("/api/invitations/accept", {
        token: token.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: pw,
        phoneNumber: phone.trim() || null,
      });
      setStep(3);
    } catch (e) {
      const message = (e as { message?: string })?.message ?? "Kunde inte skapa konto";
      setPwErr(message);
    } finally {
      setActivating(false);
    }
  };

  const goToLogin = () => router.replace("/login");

  const handleBack = () => {
    if (step === 2) setStep(1);
    else router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.topbar}>
          {step !== 3 ? (
            <Pressable onPress={handleBack} hitSlop={10} style={s.backBtn}>
              <ChevronLeft color={theme.text} />
              <Text style={[s.backText, { color: theme.text }]}>{T.back}</Text>
            </Pressable>
          ) : <View />}
          {step !== 3 && (
            <Text style={[s.stepLabel, { color: theme.textMute }]}>
              {T.step(step, TOTAL_STEPS)}
            </Text>
          )}
        </View>

        {step !== 3 && <Progress step={step} theme={theme} />}

        <ScrollView
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.logoBlock}>
            <CovabeLogo size={44} light={theme.dark} />
          </View>

          <View style={{ paddingHorizontal: Spacing.xxl, gap: 18 }}>
            {step === 1 && (
              <Step1
                theme={theme}
                token={token}
                setToken={setToken}
                error={tokenErr}
                onContinue={continueFromCode}
                onLogin={() => router.replace("/login")}
              />
            )}
            {step === 2 && (
              <Step2
                theme={theme}
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                phone={phone} setPhone={setPhone}
                pw={pw} setPw={setPw}
                pw2={pw2} setPw2={setPw2}
                showPw={showPw} setShowPw={setShowPw}
                terms={terms} setTerms={setTerms}
                reqs={reqs}
                error={pwErr}
                canActivate={canActivate}
                activating={activating}
                onActivate={activate}
              />
            )}
            {step === 3 && <Step3 theme={theme} onContinue={goToLogin} />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Step1({ theme, token, setToken, error, onContinue, onLogin }: any) {
  return (
    <>
      <View style={{ gap: 8 }}>
        <Text style={[s.title, { color: theme.text }]}>{T.s1Title}</Text>
        <Text style={[s.sub, { color: theme.textMute }]}>{T.s1Sub}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={[s.label, { color: theme.textMute }]}>{T.s1Code}</Text>
        <View style={[s.field, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <KeyIcon color={theme.textMute} />
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder={T.s1Placeholder}
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            style={[s.fieldInput, { color: theme.text, fontFamily: Fonts.regular }]}
          />
        </View>
        {error && <Text style={[s.err, { color: theme.danger }]}>{error}</Text>}
      </View>

      <PrimaryBtn theme={theme} label={T.s1Continue} onPress={onContinue} />

      <Pressable onPress={onLogin} style={{ alignItems: "center", paddingVertical: 8 }}>
        <Text style={[s.linkText, { color: theme.textMute }]}>
          {T.s1NoCode}{" "}
          <Text style={{ color: theme.accent, fontFamily: Fonts.semibold }}>{T.s1Login}</Text>
        </Text>
      </Pressable>
    </>
  );
}

function Step2({
  theme, firstName, setFirstName, lastName, setLastName, phone, setPhone,
  pw, setPw, pw2, setPw2, showPw, setShowPw, terms, setTerms, reqs,
  error, canActivate, activating, onActivate,
}: any) {
  return (
    <>
      <View style={{ gap: 8 }}>
        <Text style={[s.title, { color: theme.text }]}>{T.s2Title}</Text>
        <Text style={[s.sub, { color: theme.textMute }]}>{T.s2Sub}</Text>
      </View>

      <TextField theme={theme} label={T.s2FirstName} value={firstName}
                 onChangeText={setFirstName} icon={<UserIcon color={theme.textMute} />} />

      <TextField theme={theme} label={T.s2LastName} value={lastName}
                 onChangeText={setLastName} icon={<UserIcon color={theme.textMute} />} />

      <TextField theme={theme} label={T.s2Phone} value={phone}
                 onChangeText={(v: string) => setPhone(v.replace(/[^0-9+\-\s()]/g, ""))}
                 placeholder={T.s2PhonePlaceholder}
                 keyboardType="phone-pad" icon={<PhoneIcon color={theme.textMute} />} />

      <PwField theme={theme} label={T.s2Pw} value={pw} onChangeText={setPw}
               show={showPw} onToggleShow={() => setShowPw(!showPw)} />

      <PwField theme={theme} label={T.s2PwConfirm} value={pw2} onChangeText={setPw2}
               show={showPw} onToggleShow={() => setShowPw(!showPw)} />

      <View style={[s.reqsBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Text style={[s.label, { color: theme.textMute, marginBottom: 6 }]}>{T.s2Reqs}</Text>
        <Req theme={theme} ok={reqs.len} label={T.s2Req8} />
        <Req theme={theme} ok={reqs.upper} label={T.s2ReqUpper} />
        <Req theme={theme} ok={reqs.digit} label={T.s2ReqDigit} />
      </View>

      <Pressable
        onPress={() => setTerms(!terms)}
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 }}
      >
        <View style={[
          s.checkbox,
          { borderColor: terms ? theme.accent : theme.borderStrong,
            backgroundColor: terms ? theme.accent : "transparent" },
        ]}>
          {terms && <Check color="#fff" size={14} />}
        </View>
        <Text style={[s.terms, { color: theme.text }]}>
          {T.s2Terms}
          <Text style={{ color: theme.accent, fontFamily: Fonts.semibold }}>{T.s2TermsLink}</Text>
        </Text>
      </Pressable>

      {error && <Text style={[s.err, { color: theme.danger }]}>{error}</Text>}

      <PrimaryBtn
        theme={theme}
        label={activating ? "Aktiverar…" : T.s2Activate}
        onPress={onActivate}
        disabled={!canActivate || activating}
      />
    </>
  );
}

function Step3({ theme, onContinue }: any) {
  return (
    <View style={{ alignItems: "center", paddingTop: 40, gap: 18 }}>
      <View style={[s.successCircle, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
        <Check color={theme.accent} size={42} />
      </View>
      <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
        <Text style={[s.title, { color: theme.text, textAlign: "center" }]}>{T.s3Title}</Text>
        <Text style={[s.sub, { color: theme.textMute, textAlign: "center" }]}>{T.s3Sub}</Text>
      </View>
      <View style={{ width: "100%", paddingTop: 8 }}>
        <PrimaryBtn theme={theme} label={T.s3Continue} onPress={onContinue} />
      </View>
    </View>
  );
}

function Progress({ step, theme }: { step: number; theme: Theme }) {
  return (
    <View style={s.progressTrack}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            s.progressSeg,
            { backgroundColor: i <= step ? theme.accent : theme.border },
          ]}
        />
      ))}
    </View>
  );
}

function TextField({ theme, label, value, onChangeText, placeholder, icon, keyboardType }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.label, { color: theme.textMute }]}>{label}</Text>
      <View style={[s.field, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          style={[s.fieldInput, { color: theme.text, fontFamily: Fonts.regular }]}
        />
      </View>
    </View>
  );
}

function PwField({ theme, label, value, onChangeText, show, onToggleShow }: any) {
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 3 }}>
      <View style={[
        s.reqDot,
        { backgroundColor: ok ? theme.accent : "transparent",
          borderColor: ok ? theme.accent : theme.borderStrong },
      ]}>
        {ok && <Check color="#fff" size={10} />}
      </View>
      <Text style={{
        fontFamily: Fonts.regular, fontSize: 13,
        color: ok ? theme.text : theme.textMute,
      }}>
        {label}
      </Text>
    </View>
  );
}

function PrimaryBtn({ theme, label, onPress, disabled }: any) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.primaryBtn,
        { backgroundColor: theme.accent,
          opacity: disabled ? 0.45 : pressed ? 0.92 : 1 },
      ]}
    >
      <Text style={s.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const Icon = ({ children, color = "#000", size = 20 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);
const LockIcon    = (p: any) => <Icon {...p}><Path d="M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4"/></Icon>;
const EyeIcon     = (p: any) => <Icon {...p}><Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></Icon>;
const EyeOffIcon  = (p: any) => <Icon {...p}><Path d="M3 3l18 18"/><Path d="M2 12s3-7 10-7c2 0 3.7.6 5.1 1.5"/><Path d="M22 12s-3 7-10 7c-2 0-3.7-.6-5.1-1.5"/></Icon>;
const ChevronLeft = (p: any) => <Icon {...p} size={22}><Path d="M15 6l-6 6 6 6"/></Icon>;
const UserIcon    = (p: any) => <Icon {...p}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></Icon>;
const PhoneIcon   = (p: any) => <Icon {...p}><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
const KeyIcon     = (p: any) => <Icon {...p}><Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Icon>;
const Check       = ({ color = "#fff", size = 16 }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12l5 5L20 7"/>
  </Svg>
);

const s = StyleSheet.create({
  topbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: 10, minHeight: 44,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  backText: { fontFamily: Fonts.medium, fontSize: 14 },
  stepLabel: { fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 0.4 },

  progressTrack: {
    flexDirection: "row", gap: 6,
    paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg,
  },
  progressSeg: { flex: 1, height: 3, borderRadius: 2 },

  logoBlock: { alignItems: "center", paddingVertical: 18 },

  title: { fontFamily: Fonts.bold, fontSize: 24 },
  sub:   { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: Fonts.medium, fontSize: 12 },
  err:   { fontFamily: Fonts.medium, fontSize: 12 },

  field: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  fieldInput: { flex: 1, fontSize: 15, padding: 0 },

  reqsBox: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  reqDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },

  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  terms: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, lineHeight: 19 },

  primaryBtn: {
    paddingVertical: 16, borderRadius: Radius.lg,
    alignItems: "center", marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontFamily: Fonts.semibold, fontSize: 15 },

  linkText: { fontFamily: Fonts.medium, fontSize: 13 },

  successCircle: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
});
