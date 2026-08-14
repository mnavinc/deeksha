import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Ramabhadra_400Regular } from '@expo-google-fonts/ramabhadra';
import { useThemeColors } from '@/theme/colors';

export default function RootLayout() {
  const colors = useThemeColors();
  const [fontsLoaded] = useFonts({
    Ramabhadra_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={colors.background === '#FFFFFF' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: 'Ramabhadra_400Regular', fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="store/index" options={{ headerShown: false }} />
        <Stack.Screen name="donations/index" options={{ headerShown: false }} />
        <Stack.Screen name="faqs" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ headerShown: false }} />
        <Stack.Screen name="contact" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="expenses/add" options={{ title: 'Add Expense' }} />
      </Stack>
    </>
  );
}
