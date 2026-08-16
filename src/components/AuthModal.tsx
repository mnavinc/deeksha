import { useState } from 'react';
import {
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
  const setProfile = useAppStore((s) => s.setProfile);

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
        setSuccessMsg(data.message ?? `OTP sent to ${identifier}. Check your inbox.`);
        setStep('otp');
      }
    } catch (err) {
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
        // Store JWT token (we store it via profile, real apps use SecureStore)
        setProfile({
          id: data.user.id,
          name: (data.user.name ?? name.trim()) || 'Swami',
          language: 'te',
          pilgrimageCount: 1,
          onboardingComplete: false,
        });
        onSuccess();
      }
    } catch (err) {
      setError('Network error — is the backend running?');
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
});
