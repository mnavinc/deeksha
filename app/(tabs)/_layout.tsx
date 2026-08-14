import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme/colors';
import { useI18n } from '@/i18n';

export default function TabLayout() {
  const { t } = useI18n();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: t('journey'),
          tabBarIcon: ({ color, size }) => <Ionicons name="trail-sign" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vidhanam"
        options={{
          title: t('poojaVidhanamTitle') === 'శ్రీ అయ్యప్ప స్వామి పూజ విధానం' ? 'పూజ విధానం' : 'Pooja Book',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('groups'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Moved to Hamburger drawer menu & Desktop header
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          href: null, // Moved to Hamburger drawer menu & Desktop header
        }}
      />
    </Tabs>
  );
}
