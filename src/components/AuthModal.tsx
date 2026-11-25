import { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import {
  isAppleDevice,
  loginWithAppleIdentityToken,
  loginWithGoogleIdToken,
  loginWithPasskey,
  registerWithPasskey,
  syncProfileContactInfo,
  type AuthSessionResponse,
} from '@/services/passkeyAuth';
import { requestNotificationPermission, sendWelcomeNotification } from '@/utils/notifications';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID ?? '';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const systemScheme = useColorScheme();
  const activeTheme: 'light' | 'dark' = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  const setAuth = useAppStore((s) => s.setAuth);
  const hydrateFromBackend = useAppStore((s) => s.hydrateFromBackend);

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
  };

  const applyAuthSession = async (data: AuthSessionResponse) => {
    const cleanName = fullName.trim() || data.user.name || 'Swami';
    const cleanEmail = (email.trim().toLowerCase() || data.user.email || '').trim();
    const cleanPhone = (phone.trim() || data.user.phone || '').trim();

    setAuth(data.token, {
      id: data.user.id,
      name: cleanName,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      language: 'te',
      pilgrimageCount: 1,
      onboardingComplete: false,
    });

    if (cleanEmail || cleanPhone || fullName.trim()) {
      void syncProfileContactInfo(data.token, {
        displayName: cleanName,
        language: 'te',
        email: cleanEmail || null,
        phone: cleanPhone || null,
      });
    }

    await requestNotificationPermission();
    void sendWelcomeNotification(cleanName, data.token);
    await hydrateFromBackend();
    onSuccess();
  };

  const handlePasskeyAuth = async () => {
    setError(null);
    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your Full Name.');
        return;
      }
      if (!email.trim().includes('@') && phone.replace(/\D/g, '').length < 10) {
        setError('Please enter your Email or 10-digit Mobile Number for profile notifications.');
        return;
      }
    }

    setLoading(true);
    try {
      const data =
        mode === 'signup'
          ? await registerWithPasskey({
              displayName: fullName.trim(),
              email: email.trim().includes('@') ? email.trim().toLowerCase() : undefined,
              phone: phone.trim() || undefined,
            })
          : await loginWithPasskey();
      await applyAuthSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    const clientId = provider === 'google' ? GOOGLE_CLIENT_ID : APPLE_CLIENT_ID;
    if (!clientId) {
      setError(
        provider === 'google'
          ? 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to enable Google Sign-In.'
          : 'Set EXPO_PUBLIC_APPLE_CLIENT_ID to enable Sign in with Apple.'
      );
      return;
    }

    setLoading(true);
    try {
      const redirectUri =
        Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}/onboarding/welcome`
          : 'deekshajourney://auth';
      const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const authUrl =
        provider === 'google'
          ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${encodeURIComponent('openid email profile')}&nonce=${encodeURIComponent(nonce)}`
          : `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code%20id_token&response_mode=fragment&scope=${encodeURIComponent('name email')}&nonce=${encodeURIComponent(nonce)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== 'success' || !result.url) {
        setLoading(false);
        return;
      }

      const fragment = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] ?? '';
      const params = new URLSearchParams(fragment);
      const idToken = params.get('id_token');
      if (!idToken) {
        throw new Error('No ID token returned from provider.');
      }

      const data =
        provider === 'google'
          ? await loginWithGoogleIdToken(idToken)
          : await loginWithAppleIdentityToken({
              identityToken: idToken,
              fullName: fullName.trim() || undefined,
              email: email.trim() || undefined,
            });
      await applyAuthSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed.`);
    } finally {
      setLoading(false);
    }
  };

  const applePreferred = isAppleDevice();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                getClayStyle(activeTheme, 'high'),
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.headerEmoji}>🛕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>{t('authTitle')}</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    స్వామియే శరణం అయ్యప్ప · Google &amp; Passkey Only
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Mode tabs */}
              <View style={[styles.tabRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signup' && { backgroundColor: colors.primary }]}
                  onPress={() => { setMode('signup'); resetForm(); }}
                >
                  <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'signup' && { color: '#0D1117', fontWeight: '800' }]}>
                    {t('signUpTab')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signin' && { backgroundColor: colors.primary }]}
                  onPress={() => { setMode('signin'); resetForm(); }}
                >
                  <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'signin' && { color: '#0D1117', fontWeight: '800' }]}>
                    {t('signInTab')}
                  </Text>
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <View style={styles.form}>
                {mode === 'signup' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Ramesh Swamy"
                        placeholderTextColor={colors.textDim}
                        value={fullName}
                        onChangeText={setFullName}
                        autoComplete="name"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email (for Notifications &amp; Welcome)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="name@example.com"
                        placeholderTextColor={colors.textDim}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Mobile Number (Profile &amp; Alerts)</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="10-digit mobile number"
                        placeholderTextColor={colors.textDim}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.passkeyBtn, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}
                  onPress={() => void handlePasskeyAuth()}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Passkey"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="finger-print" size={22} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.passkeyTitle, { color: colors.text }]}>
                          {mode === 'signup' ? 'Create Passkey (Recommended)' : 'Sign in with Passkey'}
                        </Text>
                        <Text style={[styles.passkeySub, { color: colors.textMuted }]}>
                          Biometric · Synced via Apple/Google Cloud · Phishing-resistant
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.oauthRow}>
                  {applePreferred && (
                    <TouchableOpacity
                      style={[styles.oauthBtn, { backgroundColor: '#000000', borderColor: colors.border }]}
                      onPress={() => void handleSocialOAuth('apple')}
                      disabled={loading}
                    >
                      <Ionicons name="logo-apple" size={16} color="#FFFFFF" />
                      <Text style={[styles.oauthBtnText, { color: '#FFFFFF' }]}>Continue with Apple</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.oauthBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => void handleSocialOAuth('google')}
                    disabled={loading}
                  >
                    <Ionicons name="logo-google" size={15} color={colors.text} />
                    <Text style={[styles.oauthBtnText, { color: colors.text }]}>Continue with Google</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.legalRow}>
                  <Text style={[styles.legalText, { color: colors.textDim }]}>By continuing, you agree to our </Text>
                  <TouchableOpacity onPress={() => { onClose(); router.push('/terms' as any); }}>
                    <Text style={[styles.legalLink, { color: colors.primary }]}>Terms</Text>
                  </TouchableOpacity>
                  <Text style={[styles.legalText, { color: colors.textDim }]}> &amp; </Text>
                  <TouchableOpacity onPress={() => { onClose(); router.push('/privacy' as any); }}>
                    <Text style={[styles.legalLink, { color: colors.primary }]}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  headerEmoji: { fontSize: 32 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 6 },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF444418',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  bannerText: { fontSize: 12, flex: 1, fontWeight: '600' },
  form: { gap: 12 },
  inputGroup: { gap: 5 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  passkeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  passkeyTitle: { fontSize: 14, fontWeight: '800' },
  passkeySub: { fontSize: 11, marginTop: 2 },
  oauthRow: { flexDirection: 'row', gap: 8 },
  oauthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  oauthBtnText: { fontSize: 13, fontWeight: '700' },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  legalText: { fontSize: 11 },
  legalLink: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
});
