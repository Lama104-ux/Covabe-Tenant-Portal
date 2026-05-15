import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';

const Poppins_400Regular = require('@expo-google-fonts/poppins/400Regular/Poppins_400Regular.ttf');
const Poppins_500Medium = require('@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf');
const Poppins_600SemiBold = require('@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf');
const Poppins_700Bold = require('@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf');
const Outfit_700Bold = require('@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf');

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/services/auth-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Outfit_700Bold,
  });

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="accept-invitation" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create-invitation" />
          <Stack.Screen name="properties" />
          <Stack.Screen name="property/[id]" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
