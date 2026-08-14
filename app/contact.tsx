import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';

export default function ContactScreen() {
  const { t, language } = useI18n();
  const colors = useThemeColors();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in your name, email, and message.');
      return;
    }
    Alert.alert('Message Sent 🙏', 'Thank you for reaching out to DeekshaOrg. Our team will respond shortly.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('contactUs')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            DeekshaOrg Support & Devotee Services — India
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={[styles.card, getClayStyle(activeTheme, 'low'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.infoLabel, { color: colors.textDim }]}>Official Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>support@deekshaorg.in</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.infoLabel, { color: colors.textDim }]}>{t('grievanceOfficer')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>grievance@deekshaorg.in (DPDP Act 2023 Compliance)</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {language === 'te' ? 'సందేశం పంపండి' : 'Send Us a Message'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t('yourName')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Swami Naidu"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textDim }]}>Email Address / Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="swami@deekshaorg.in"
              placeholderTextColor={colors.textDim}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textDim }]}>Message / Feedback</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Your inquiry or spiritual feedback..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
            <Text style={styles.submitText}>{t('send')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  header: { gap: 4 },
  heading: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13 },
  card: { padding: spacing.md, borderRadius: 20, borderWidth: 1, gap: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#0D1117', fontWeight: '800', fontSize: 15 },
});
