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
  isWebPasskeySupported,
  loginWithAppleIdentityToken,
  loginWithGoogleIdToken,
  loginWithPasskey,
  registerWithPasskey,
  type AuthSessionResponse,
} from '@/services/passkeyAuth';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
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

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setStep('credentials');
    setOtp('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSendOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!identifier.trim() || !identifier.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'Failed to send OTP. Please try again.');
      } else {
        if (data.devOtp) {
          setOtp(String(data.devOtp));
          setSuccessMsg(`Dev OTP: ${data.devOtp} (SMTP not configured)`);
        } else {
          setSuccessMsg(data.message ?? `OTP sent to ${identifier}. Check your inbox.`);
        }
        setStep('otp');
      }
    } catch {
      setError('Network error — is the backend running? Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otp.trim() || otp.length < 6) {
      setError('Please enter the 6-digit OTP from your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim().toLowerCase(),
          otp: otp.trim(),
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? 'Invalid OTP. Please try again.');
      } else {
        setAuth(data.token, {
          id: data.user.id,
          name: (data.user.name ?? name.trim()) || 'Swami',
          language: 'te',
          pilgrimageCount: 1,
          onboardingComplete: false,
        });
        await hydrateFromBackend();
        onSuccess();
      }
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const applyAuthSession = async (data: AuthSessionResponse) => {
    setAuth(data.token, {
      id: data.user.id,
      name: (data.user.name ?? name.trim()) || 'Swami',
      ...(data.user.email ? { email: data.user.email } : {}),
      ...(data.user.phone ? { phone: data.user.phone } : {}),
      language: 'te',
      pilgrimageCount: 1,
      onboardingComplete: false,
    });
    await hydrateFromBackend();
    onSuccess();
  };

  const handlePasskeyAuth = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!isWebPasskeySupported()) {
      setError('Passkey biometric prompt works in modern browsers (Safari/Chrome) or Passkey-enabled native builds.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your Swami Name before creating a Passkey.');
      return;
    }
    setLoading(true);
    try {
      const data =
        mode === 'signup'
          ? await registerWithPasskey({
              displayName: name.trim(),
              email: identifier.includes('@') ? identifier.trim().toLowerCase() : undefined,
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
    setSuccessMsg(null);
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
          : await loginWithAppleIdentityToken({ identityToken: idToken });
      await applyAuthSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed.`);
    } finally {
      setLoading(false);
    }
  };

  const applePreferred = isAppleDevice();

  const handleQuickTestLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@deeksha.app' }),
      });
      const data = await res.json();
      if (res.ok && data?.token && data?.user) {
        setAuth(data.token, {
          id: data.user.id,
          name: data.user.name || 'Swami Test',
          language: 'te',
          pilgrimageCount: 1,
          onboardingComplete: false,
        });
        await hydrateFromBackend();
        onSuccess();
        return;
      }
      throw new Error('Demo login fallback');
    } catch {
      // Offline-first demo fallback so APK & web always work even without backend/DB
      setAuth('offline-demo-token', {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Swami Test',
        language: 'te',
        pilgrimageCount: 1,
        onboardingComplete: false,
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

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
                     స్వామియే శరణం అయ్యప్ప
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

              {/* Error / success banners */}
              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
                </View>
              )}
              {successMsg && (
                <View style={styles.successBanner}>
                  <Ionicons name="mail" size={14} color="#34D399" />
                  <Text style={[styles.bannerText, { color: '#34D399' }]}>{successMsg}</Text>
                </View>
              )}

              {step === 'credentials' ? (
                <View style={styles.form}>
                  {mode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{t('yourName')}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Swamy Naidu"
                        placeholderTextColor={colors.textDim}
                        value={name}
                        onChangeText={setName}
                        autoComplete="name"
                      />
                    </View>
                  )}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{t('emailOrPhone')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textDim}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={identifier}
                      onChangeText={setIdentifier}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0D1117" />
                    ) : (
                      <>
                        <Ionicons name="mail-outline" size={17} color="#0D1117" />
                        <Text style={styles.submitText}>{t('sendOtp')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.passkeyBtn, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}
                    onPress={handlePasskeyAuth}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Passkey"
                  >
                    <Ionicons name="finger-print" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.passkeyTitle, { color: colors.text }]}>
                        {mode === 'signup' ? 'Create Passkey (Recommended)' : 'Sign in with Passkey'}
                      </Text>
                      <Text style={[styles.passkeySub, { color: colors.textMuted }]}>
                        Biometric · Synced via Apple/Google Cloud · Phishing-resistant
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.oauthRow}>
                    {applePreferred && (
                      <TouchableOpacity
                        style={[styles.oauthBtn, { backgroundColor: '#000000', borderColor: colors.border }]}
                        onPress={() => void handleSocialOAuth('apple')}
                        disabled={loading}
                      >
                        <Ionicons name="logo-apple" size={16} color="#FFFFFF" />
                        <Text style={[styles.oauthBtnText, { color: '#FFFFFF' }]}>Apple</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.oauthBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => void handleSocialOAuth('google')}
                      disabled={loading}
                    >
                      <Ionicons name="logo-google" size={15} color={colors.text} />
                      <Text style={[styles.oauthBtnText, { color: colors.text }]}>Google</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.demoBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={handleQuickTestLogin}
                    disabled={loading}
                  >
                    <Ionicons name="flash-outline" size={16} color={colors.primary} />
                    <Text style={[styles.demoBtnText, { color: colors.primary }]}>
                      Quick Test Login (test@deeksha.app)
                    </Text>
                  </TouchableOpacity>

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
              ) : (
                <View style={styles.form}>
                  <View style={styles.otpInfo}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                    <Text style={[styles.otpInfoText, { color: colors.textMuted }]}>
                      OTP sent to{' '}
                      <Text style={{ color: colors.primary, fontWeight: '700' }}>{identifier}</Text>
                      {'\n'}Check inbox + spam folder.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{t('enterOtp')}</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput, { backgroundColor: colors.background, color: colors.primary, borderColor: colors.primary }]}
                      placeholder="123456"
                      placeholderTextColor={colors.textDim}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0D1117" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={17} color="#0D1117" />
                        <Text style={styles.submitText}>{t('verifyAndContinue')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => { setStep('credentials'); setError(null); setSuccessMsg(null); }}>
                    <Text style={[styles.resendText, { color: colors.accent }]}>
                      ← Change email / Resend OTP
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: 28,
    gap: spacing.md,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: { fontSize: 28 },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { fontSize: 10, marginTop: 1 },
  closeBtn: { padding: 4 },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8514920',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F85149',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#34D39920',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 17 },
  form: { gap: spacing.md },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
  },
  otpInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  otpInfoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  submitText: {
    color: '#0D1117',
    fontWeight: '800',
    fontSize: 15,
  },
  resendText: {
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  passkeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  passkeyTitle: { fontSize: 13, fontWeight: '800' },
  passkeySub: { fontSize: 10.5, marginTop: 1 },
  oauthRow: { flexDirection: 'row', gap: 8 },
  oauthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  oauthBtnText: { fontSize: 13, fontWeight: '700' },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  legalText: { fontSize: 11 },
  legalLink: { fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
});
