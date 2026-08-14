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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const { t } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const setProfile = useAppStore((s) => s.setProfile);

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = () => {
    setError(null);
    if (!identifier.trim() || (mode === 'signup' && !name.trim())) {
      setError(t('invalidCredentials'));
      return;
    }
    setLoading(true);
    // Simulate sending OTP via SMTP/SMS API
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = () => {
    setError(null);
    if (!otp.trim() || otp.length < 4) {
      setError('Please enter a valid 4-digit OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setProfile({
        id: `user-${Date.now()}`,
        name: name.trim() || 'Swami',
        language: 'te',
        pilgrimageCount: 1,
        onboardingComplete: false,
      });
      onSuccess();
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                <Text style={[styles.title, { color: colors.text }]}>{t('authTitle')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Sign In / Sign Up Mode Switcher */}
              <View style={[styles.tabRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signup' && { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setMode('signup');
                    setStep('credentials');
                    setError(null);
                  }}
                >
                  <Text style={[styles.tabText, mode === 'signup' && { color: '#0D1117', fontWeight: '800' }]}>
                    {t('signUpTab')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signin' && { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setMode('signin');
                    setStep('credentials');
                    setError(null);
                  }}
                >
                  <Text style={[styles.tabText, mode === 'signin' && { color: '#0D1117', fontWeight: '800' }]}>
                    {t('signInTab')}
                  </Text>
                </TouchableOpacity>
              </View>

              {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

              {step === 'credentials' ? (
                <View style={styles.form}>
                  {mode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t('yourName')}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. Swamy Naidu"
                        placeholderTextColor={colors.textDim}
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t('emailOrPhone')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="name@example.com / +91 9876543210"
                      placeholderTextColor={colors.textDim}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={identifier}
                      onChangeText={setIdentifier}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t('password')}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textDim}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0D1117" />
                    ) : (
                      <Text style={styles.submitText}>{t('sendOtp')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
                  <Text style={[styles.otpInfo, { color: colors.textMuted }]}>
                    OTP sent to <Text style={{ color: colors.primary, fontWeight: '700' }}>{identifier}</Text>
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t('enterOtp')}</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput, { backgroundColor: colors.background, color: colors.primary, borderColor: colors.primary }]}
                      placeholder="1234"
                      placeholderTextColor={colors.textDim}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0D1117" />
                    ) : (
                      <Text style={styles.submitText}>{t('verifyAndContinue')}</Text>
                    )}
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
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: spacing.lg,
    borderRadius: 24,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
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
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
  },
  otpInfo: {
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#0D1117',
    fontWeight: '800',
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
