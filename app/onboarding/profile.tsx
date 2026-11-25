import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme/colors';
import { translate, type AppLanguage } from '@/i18n';
import { syncProfileContactInfo } from '@/services/passkeyAuth';
import { requestNotificationPermission } from '@/utils/notifications';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const setProfile = useAppStore((s) => s.setProfile);
  const existing = useAppStore((s) => s.profile);
  const authToken = useAppStore((s) => s.authToken);
  const { detectedLang } = useLocalSearchParams<{ detectedLang?: string }>();

  const defaultLang: AppLanguage = (existing?.language ?? detectedLang ?? 'te') as AppLanguage;
  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [language, setLanguage] = useState<AppLanguage>(defaultLang);

  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  const handleContinue = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    if (!cleanName) return;

    setProfile({
      id: existing?.id ?? `user-${Date.now()}`,
      name: cleanName,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      language,
      pilgrimageCount: existing?.pilgrimageCount ?? 0,
      onboardingComplete: false,
    });

    if (authToken) {
      void syncProfileContactInfo(authToken, {
        displayName: cleanName,
        language,
        email: cleanEmail || null,
        phone: cleanPhone || null,
      });
    }
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      await requestNotificationPermission();
    }
    router.push('/onboarding/deeksha-select');
  };

  return (
    <View style={styles.container}>
      {/* Language Selector at top */}
      <View style={styles.langHeader}>
        {(['te', 'en'] as const).map((code) => (
          <TouchableOpacity
            key={code}
            onPress={() => setLanguage(code)}
            style={[styles.langChip, language === code && styles.langChipActive]}
          >
            <Text style={[styles.langText, language === code && styles.langTextActive]}>
              {translate(code, code === 'te' ? 'telugu' : 'english')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>{t('whatToCallYou')}</Text>
      <Text style={styles.subtitle}>{t('everyPersonSwami')}</Text>

      <TextInput
        style={styles.input}
        placeholder={`${t('yourName')} *`}
        placeholderTextColor={colors.textDim}
        value={name}
        onChangeText={setName}
        autoFocus={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Email (for Welcome & Notifications)"
        placeholderTextColor={colors.textDim}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mobile Number (for Profile & Alerts)"
        placeholderTextColor={colors.textDim}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Button
        title={t('continue')}
        onPress={() => void handleContinue()}
        disabled={!name.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: 48, backgroundColor: colors.background },
  langHeader: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  langChip: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  langChipActive: { borderColor: colors.primary, backgroundColor: '#F0B42920' },
  langText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  langTextActive: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: spacing.sm, lineHeight: 30 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: spacing.md,
  },
  googleIcon: { color: colors.background, fontSize: 18, fontWeight: '900' },
  googleText: { color: colors.background, fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textDim, fontSize: 12 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: spacing.md, color: colors.text, fontSize: 16,
    marginBottom: spacing.lg,
  },
});
