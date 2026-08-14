import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { getSwamiTier } from '@/data/swamiNames';
import { getDeekshaType } from '@/data/deekshaTypes';
import { getVruthamEndDate } from '@/engines/deekshaEngine';
import { format } from '@/engines/dateUtils';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { HeaderNav } from '@/components/HeaderNav';
import { useI18n } from '@/i18n';

export default function ProfileScreen() {
  const p = useAppStore((s) => s.profile);
  const e = useAppStore((s) => s.enrollment);
  const history = useAppStore((s) => s.journeyHistory);
  const complete = useAppStore((s) => s.completeDeeksha);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const toggleNotifications = useAppStore((s) => s.toggleNotifications);
  const signOut = useAppStore((s) => s.signOut);
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const handleSignOut = () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
  };

  if (!p || !e) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <HeaderNav />
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyIcon}>🛕</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('startJourney')}</Text>
          <TouchableOpacity onPress={() => router.replace('/onboarding/welcome')}>
            <Text style={[styles.startLink, { color: colors.primary }]}>{t('beginJourney')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tier = getSwamiTier(e.pilgrimageCount);
  const d = getDeekshaType(e.deekshaId)!;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Badge */}
        <View style={styles.hero}>
          <View style={[styles.symbolBadge, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface }]}>
            <Text style={styles.symbol}>{tier.symbol}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
          <Text style={[styles.tier, { color: colors.primary }]}>{tier.traditionalName}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te' ? 'సంప్రదాయ పేరు ప్రాంతం మరియు వంశం ప్రకారం మారవచ్చు.' : 'Traditional naming may vary by lineage.'}
          </Text>
        </View>

        {/* Language Selector */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>{t('language').toUpperCase()}</Text>
          <View style={styles.langRow}>
            {(['te', 'en'] as const).map((code) => (
              <TouchableOpacity
                key={code}
                onPress={() => setLanguage(code)}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  language === code && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textMuted }, language === code && { color: colors.primary, fontWeight: '700' }]}>
                  {code === 'en' ? t('english') : t('telugu')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme Selector (Light / Dark / System) */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>{t('theme').toUpperCase()}</Text>
          <View style={styles.langRow}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setTheme(mode)}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  theme === mode && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textMuted }, theme === mode && { color: colors.primary, fontWeight: '700' }]}>
                  {mode === 'system' ? t('themeSystem') : mode === 'light' ? t('themeLight') : t('themeDark')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications Switch */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.label, { color: colors.textDim }]}>{t('notifications').toUpperCase()}</Text>
              <Text style={[styles.value, { color: colors.text, fontSize: 14 }]}>{t('enableNotifications')}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left', fontSize: 11 }]}>
                {t('notificationDesc')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Active Deeksha */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>{t('active').toUpperCase()} {t('deeksha').toUpperCase()}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{d.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left' }]}>
            {e.pilgrimageCenter} · {format(getVruthamEndDate(e), 'dd MMM yyyy')}
          </Text>
        </View>

        {/* Journey History */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>{t('history').toUpperCase()}</Text>
          {history.length === 0 ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left' }]}>{t('noHistory')}</Text>
          ) : (
            history.slice().reverse().map((item) => (
              <View key={item.id} style={[styles.historyItem, { borderTopColor: colors.border }]}>
                <Text style={[styles.value, { color: colors.text }]}>{getDeekshaType(item.deekshaId)?.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left' }]}>
                  {item.durationDays} {t('days')} · {format(new Date(item.malaDharanamDate), 'dd MMM yyyy')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Complete Deeksha */}
        {e.status === 'active' && (
          <TouchableOpacity style={[styles.completeBtn, { backgroundColor: colors.primary }]} onPress={complete}>
            <Text style={styles.completeText}>{t('completed')} 🙏</Text>
          </TouchableOpacity>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.error }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  hero: { alignItems: 'center', padding: spacing.md },
  symbolBadge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  symbol: { fontSize: 44 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  tier: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  subtitle: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: {
    padding: spacing.md, borderWidth: 1, borderRadius: 20, gap: 6,
  },
  label: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  value: { fontSize: 16, fontWeight: '700' },
  historyItem: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderRadius: 18,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  chipText: { fontSize: 13 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completeBtn: {
    padding: 14, borderRadius: 14, alignItems: 'center',
  },
  completeText: { color: '#0D1117', fontWeight: '800', fontSize: 15 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderWidth: 1.5, borderRadius: 14, marginTop: 8,
  },
  signOutText: { fontWeight: '700', fontSize: 14 },
  empty: { flex: 1 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: 12 },
  emptyIcon: { fontSize: 56 },
  startLink: { fontSize: 16, fontWeight: '600', marginTop: 8 },
});
