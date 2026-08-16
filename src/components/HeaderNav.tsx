import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { getSwamiTier } from '@/data/swamiNames';

export function HeaderNav() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const pathname = usePathname();
  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const signOut = useAppStore((s) => s.signOut);
  const systemScheme = useColorScheme();
  const activeTheme: 'light' | 'dark' = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const tier = getSwamiTier(enrollment?.pilgrimageCount ?? 1);

  const navItems = [
    { label: t('home'), route: '/(tabs)' as any, icon: 'home-outline' },
    { label: t('journey'), route: '/(tabs)/journey' as any, icon: 'trail-sign-outline' },
    { label: t('poojaVidhanamTitle'), route: '/(tabs)/vidhanam' as any, icon: 'book-outline' },
    { label: t('groups'), route: '/(tabs)/groups' as any, icon: 'people-outline' },
    { label: t('guide'), route: '/guide' as any, icon: 'book-open-outline' },
    { label: t('poojaStore'), route: '/store' as any, icon: 'bag-handle-outline' },
    { label: t('donations'), route: '/donations' as any, icon: 'heart-outline' },
    { label: t('community'), route: '/(tabs)/community' as any, icon: 'people-circle-outline' },
    { label: t('temples'), route: '/(tabs)/map' as any, icon: 'map-outline' },
    { label: t('faqs'), route: '/faqs' as any, icon: 'help-circle-outline' },
    { label: t('aboutUs'), route: '/about' as any, icon: 'information-circle-outline' },
    { label: t('contactUs'), route: '/contact' as any, icon: 'mail-outline' },
    { label: t('privacyPolicy'), route: '/privacy' as any, icon: 'shield-checkmark-outline' },
  ];

  const performSignOut = () => {
    setDrawerOpen(false);
    signOut();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {}
    }
    router.replace('/onboarding/welcome?action=signin');
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('signOutConfirm') || 'Are you sure you want to sign out?')) {
        performSignOut();
      }
    } else {
      Alert.alert(t('signOut'), t('signOutConfirm'), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: performSignOut,
        },
      ]);
    }
  };

  return (
    <>
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        {/* Branding Logo */}
        <TouchableOpacity style={styles.brandRow} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.brandSymbol}>🛕</Text>
          <View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Deeksha Journey</Text>
            <Text style={[styles.brandSaranam, { color: colors.primary }]}>{t('saranam')}</Text>
          </View>
        </TouchableOpacity>

        {isDesktop ? (
          /* Desktop Header Navigation Links */
          <View style={styles.desktopNav}>
            {navItems.map((item) => {
              const active = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route)}
                  style={[styles.desktopNavLink, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                >
                  <Text style={[styles.desktopNavText, { color: active ? colors.primary : colors.textMuted }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Language & Theme Controls */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                onPress={() => setLanguage(language === 'en' ? 'te' : 'en')}
                style={[styles.chipBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.chipBtnText, { color: colors.primary }]}>
                  {language === 'en' ? 'తెలుగు' : 'English'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
                style={[styles.chipBtn, { borderColor: colors.border }]}
              >
                <Ionicons name={activeTheme === 'dark' ? 'sunny' : 'moon'} size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Mobile Hamburger Button */
          <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Slide-out Claymorphism Mobile Drawer */}
      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setDrawerOpen(false)} />
          <View
            style={[
              styles.drawerContent,
              getClayStyle(activeTheme, 'high'),
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.profileBadge}>
                <Text style={styles.drawerAvatar}>{tier.symbol}</Text>
                <View>
                  <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name ?? 'Swami'}</Text>
                  <Text style={[styles.profileTier, { color: colors.primary }]}>{tier.traditionalName}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.drawerScroll}>
              {/* Drawer Links */}
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setDrawerOpen(false);
                    router.push(item.route);
                  }}
                >
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  <Text style={[styles.drawerItemText, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Language Switcher */}
              <View style={styles.drawerSection}>
                <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('language')}</Text>
                <View style={styles.chipRow}>
                  {(['te', 'en'] as const).map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[
                        styles.drawerChip,
                        { borderColor: colors.border },
                        language === lang && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.drawerChipText, { color: colors.textMuted }, language === lang && { color: colors.primary, fontWeight: '700' }]}>
                        {lang === 'te' ? 'తెలుగు' : 'English'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Theme Switcher */}
              <View style={styles.drawerSection}>
                <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('theme')}</Text>
                <View style={styles.chipRow}>
                  {(['system', 'light', 'dark'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setTheme(mode)}
                      style={[
                        styles.drawerChip,
                        { borderColor: colors.border },
                        theme === mode && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.drawerChipText, { color: colors.textMuted }, theme === mode && { color: colors.primary, fontWeight: '700' }]}>
                        {mode === 'system' ? t('themeSystem') : mode === 'light' ? t('themeLight') : t('themeDark')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity style={[styles.signOutDrawerBtn, { borderColor: colors.error }]} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.signOutDrawerText, { color: colors.error }]}>{t('signOut')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandSymbol: {
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandSaranam: {
    fontSize: 10,
    fontWeight: '700',
  },
  desktopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  desktopNavLink: {
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
  },
  chipBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hamburgerBtn: {
    padding: 6,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: '#000000A0',
    flexDirection: 'row',
    zIndex: 9999,
  },
  overlayDismiss: {
    flex: 1,
  },
  drawerContent: {
    width: 310,
    maxWidth: '85%',
    height: '100%',
    padding: spacing.md,
    gap: spacing.md,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: -4, height: 0 },
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D40',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerAvatar: {
    fontSize: 28,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileTier: {
    fontSize: 12,
    fontWeight: '600',
  },
  drawerScroll: {
    gap: spacing.md,
    paddingBottom: 40,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  drawerSection: {
    gap: 6,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  drawerChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  drawerChipText: {
    fontSize: 12,
  },
  signOutDrawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    marginTop: 16,
  },
  signOutDrawerText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
