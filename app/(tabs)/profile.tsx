import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { isWebPasskeySupported, registerWithPasskey, syncProfileContactInfo } from '@/services/passkeyAuth';
import { getSwamiTier } from '@/data/swamiNames';
import { getDeekshaType } from '@/data/deekshaTypes';
import { getVruthamEndDate } from '@/engines/deekshaEngine';
import { format } from '@/engines/dateUtils';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { HeaderNav } from '@/components/HeaderNav';
import { QuickMalaSetupCard } from '@/components/QuickMalaSetupCard';
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
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const highContrast = useAppStore((s) => s.highContrast);
  const toggleHighContrast = useAppStore((s) => s.toggleHighContrast);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const toggleReduceMotion = useAppStore((s) => s.toggleReduceMotion);
  const totalPoints = useAppStore((s) => s.totalPoints);
  const pendingPoints = useAppStore((s) => s.pendingPoints);
  const authToken = useAppStore((s) => s.authToken);
  const setProfile = useAppStore((s) => s.setProfile);
  const signOut = useAppStore((s) => s.signOut);
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [phoneInput, setPhoneInput] = useState(p?.phone ?? '');
  const [emailInput, setEmailInput] = useState(p?.email ?? '');
  const [newsletterOptIn, setNewsletterOptIn] = useState(Boolean(p?.newsletterSubscribed));
  const [contactSavedMsg, setContactSavedMsg] = useState('');
  const [passkeyMsg, setPasskeyMsg] = useState('');

  const handleSaveContactInfo = async () => {
    if (!p) return;
    const cleanPhone = phoneInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();
    setProfile({
      ...p,
      phone: cleanPhone || undefined,
      email: cleanEmail || undefined,
      newsletterSubscribed: newsletterOptIn,
    });
    if (authToken) {
      await syncProfileContactInfo(authToken, {
        displayName: p.name,
        language: p.language,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        newsletterSubscribed: newsletterOptIn,
      });
    }
    setContactSavedMsg(language === 'te' ? 'సంప్రదింపు వివరాలు సేవ్ చేయబడ్డాయి ✓' : 'Profile contact info saved ✓');
  };

  const handleAddPasskey = async () => {
    if (!p) return;
    setPasskeyMsg('');
    if (!isWebPasskeySupported()) {
      setPasskeyMsg('Open Swamiseva in Safari/Chrome to register a cloud-synced Passkey.');
      return;
    }
    try {
      await registerWithPasskey({
        displayName: p.name,
        email: emailInput.trim() || p.email,
        phone: phoneInput.trim() || p.phone,
        authToken,
      });
      setPasskeyMsg('Passkey registered & synced with your device cloud ✓');
    } catch (err) {
      setPasskeyMsg(err instanceof Error ? err.message : 'Could not register Passkey.');
    }
  };

  const performSignOut = () => {
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
        { text: t('signOut'), style: 'destructive', onPress: performSignOut },
      ]);
    }
  };

  if (!p) {
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

  if (!e) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <HeaderNav />
        <ScrollView contentContainerStyle={styles.content}>
          <QuickMalaSetupCard />
        </ScrollView>
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
              accessibilityLabel={t('enableNotifications')}
            />
          </View>
        </View>

        {/* Accessibility Options */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>
            {language === 'te' ? 'సౌలభ్యత సెట్టింగ్‌లు (ACCESSIBILITY)' : 'ACCESSIBILITY'}
          </Text>
          <Text style={[styles.value, { color: colors.text, fontSize: 14 }]}>
            {language === 'te' ? 'అక్షరాల పరిమాణం • Readable Text Size' : 'Readable Text Size'}
          </Text>
          <View style={styles.langRow}>
            {([
              { id: 'normal', label: language === 'te' ? 'సాధారణం' : 'Normal' },
              { id: 'large', label: language === 'te' ? 'పెద్దది' : 'Large' },
              { id: 'xlarge', label: language === 'te' ? 'అతి పెద్దది' : 'Extra Large' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setFontScale(opt.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: fontScale === opt.id }}
                accessibilityLabel={`Text size ${opt.label}`}
                style={[
                  styles.chip,
                  { borderColor: colors.border, minHeight: 44, justifyContent: 'center' },
                  fontScale === opt.id && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textMuted }, fontScale === opt.id && { color: colors.primary, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.value, { color: colors.text, fontSize: 14 }]}>
                {language === 'te' ? 'అధిక కాంట్రాస్ట్ • High Contrast' : 'High Contrast Mode'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left', fontSize: 12 }]}>
                {language === 'te' ? 'స్పష్టమైన చదువు కోసం అధిక కాంట్రాస్ట్ రంగులు' : 'Stronger text and border contrast for easier reading'}
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="High contrast mode"
            />
          </View>

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.value, { color: colors.text, fontSize: 14 }]}>
                {language === 'te' ? 'తక్కువ కదలికలు • Reduce Motion' : 'Reduce Motion'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left', fontSize: 12 }]}>
                {language === 'te' ? 'యానిమేషన్ వేగాన్ని తగ్గించండి' : 'Minimize celebration bursts and motion effects'}
              </Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={toggleReduceMotion}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Reduce motion"
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

        {/* Discipline Points Card */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>{t('pointsBalance').toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <Text style={[styles.value, { fontSize: 24, color: colors.primary, fontWeight: '800' }]}>{totalPoints}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('totalPointsLabel')}</Text>
          </View>
          {pendingPoints > 0 && (
            <View style={{ marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(212, 160, 23, 0.12)', alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                +{pendingPoints} {t('pendingPointsLabel')} (Credited on Completion 🙏)
              </Text>
            </View>
          )}
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

        {/* Profile Contact Information (Mobile & Email) */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>PROFILE CONTACT INFORMATION</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left', marginTop: 0 }]}>
            {language === 'te'
              ? 'మొబైల్ & ఇమెయిల్ మీ ప్రొఫైల్ మరియు వార్తాలేఖల కోసం మాత్రమే.'
              : 'Mobile number & email are stored as your profile info (optional newsletters).'}
          </Text>
          <TextInput
            value={phoneInput}
            onChangeText={(txt) => { setPhoneInput(txt); setContactSavedMsg(''); }}
            keyboardType="phone-pad"
            placeholder={language === 'te' ? 'మొబైల్ నంబర్' : 'Mobile Number'}
            placeholderTextColor={colors.textDim}
            style={[styles.profileInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={emailInput}
            onChangeText={(txt) => { setEmailInput(txt); setContactSavedMsg(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email Address (for Resend Welcome & Newsletters)"
            placeholderTextColor={colors.textDim}
            style={[styles.profileInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          />
          <View style={[styles.rowBetween, { marginTop: 4 }]}>
            <Text style={[styles.value, { color: colors.text, fontSize: 13 }]}>
              {language === 'te' ? 'దీక్షా న్యూస్‌లెటర్ (Resend)' : 'Receive Swamiseva Newsletters'}
            </Text>
            <Switch value={newsletterOptIn} onValueChange={setNewsletterOptIn} />
          </View>
          <TouchableOpacity
            style={[styles.smallPrimaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => void handleSaveContactInfo()}
          >
            <Text style={styles.smallPrimaryBtnText}>
              {language === 'te' ? 'ప్రొఫైల్ వివరాలు సేవ్ చేయండి' : 'Save Contact Info'}
            </Text>
          </TouchableOpacity>
          {contactSavedMsg ? (
            <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>{contactSavedMsg}</Text>
          ) : null}
        </View>

        {/* Passkey Security Card */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>PASSKEY SECURITY</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'left', marginTop: 0 }]}>
            Phishing-resistant biometric key synced via Apple iCloud Keychain or Google Password Manager.
          </Text>
          <TouchableOpacity
            style={[styles.smallOutlineBtn, { borderColor: colors.primary }]}
            onPress={() => void handleAddPasskey()}
          >
            <Ionicons name="finger-print" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
              Register Passkey for This Device
            </Text>
          </TouchableOpacity>
          {passkeyMsg ? (
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{passkeyMsg}</Text>
          ) : null}
        </View>

        {/* Legal & Policies */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>LEGAL &amp; POLICIES</Text>
          <View style={styles.langRow}>
            <TouchableOpacity style={[styles.chip, { borderColor: colors.border }]} onPress={() => router.push('/terms' as any)}>
              <Text style={[styles.chipText, { color: colors.primary, fontWeight: '700' }]}>Terms &amp; Conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { borderColor: colors.border }]} onPress={() => router.push('/privacy' as any)}>
              <Text style={[styles.chipText, { color: colors.primary, fontWeight: '700' }]}>{t('privacyPolicy')}</Text>
            </TouchableOpacity>
          </View>
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
  profileInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 4,
  },
  smallPrimaryBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  smallPrimaryBtnText: { color: '#0D1117', fontSize: 13, fontWeight: '800' },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 4,
  },
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
