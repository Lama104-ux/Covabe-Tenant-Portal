import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Fonts, Spacing, makeTheme } from "@/constants/theme";

export default function MessagesScreen() {
  const scheme = useColorScheme();
  const theme = makeTheme(scheme === "dark");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>Meddelanden</Text>
      </View>
      <View style={s.empty}>
        <Text style={[s.emptyText, { color: theme.textMute }]}>Inga meddelanden ännu.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontFamily: Fonts.bold, fontSize: 24 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: Fonts.regular, fontSize: 14 },
});
