import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { SacredIcon } from '@/components/SacredIcons';
import { useI18n } from '@/i18n';

export default function InviteScreen() {
  const params = useLocalSearchParams<{
    s?: string;
    n?: string;
    se?: string;
    r?: string;
    tag?: string;
  }>();

  const colors = useThemeColors();
  const { language } = useI18n();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const profile = useAppStore((s) => s.profile);
  const joinSannidhanamByQr = useAppStore((s) => s.joinSannidhanamByQr);

  const sannidhanamId = params.s || 'sannidhanam-demo';
  const sannidhanamName = params.n || 'Sri Ayyappa Sannidhanam';
  const season = params.se || 'Mandala-Makaravilakku';
  const referrerId = params.r || 'guru-swami';
  const eventTag = params.tag || 'qr_sannidhanam_invite';

  const [swamiName, setSwamiName] = useState(profile?.name ?? '');
  const [joined, setJoined] = useState(false);

  const isTe = language === 'te';

  const handleJoin = () => {
    const cleanName = swamiName.trim() || 'Kanni Swami';
    joinSannidhanamByQr({
      sannidhanamId,
      sannidhanamName,
      season,
      referrerId,
      eventTag,
      memberName: cleanName,
    });
    setJoined(true);
    setTimeout(() => {
      router.replace('/(tabs)/groups');
    }, 600);
  };

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.card,
          getClayStyle(activeTheme, 'medium'),
          { backgroundColor: colors.surface, borderColor: colors.primary },
        ]}
      >
        <View style={styles.iconWrap}>
          <SacredIcon name="temple" size={44} color="#FFFBE6" accent={colors.primary} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {isTe ? 'QR సన్నిధానం ఆహ్వానం' : 'QR SANNIDHANAM INVITE'}
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>{sannidhanamName}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {season} · {isTe ? 'మొబైల్/ఇమెయిల్ అవసరం లేదు' : 'No phone or email required'}
        </Text>

        <View style={[styles.metaBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.metaLine, { color: colors.textMuted }]}>
            Sannidhanam ID: <Text style={{ color: colors.text, fontWeight: '700' }}>{sannidhanamId}</Text>
          </Text>
          <Text style={[styles.metaLine, { color: colors.textMuted }]}>
            Referrer ID: <Text style={{ color: colors.text, fontWeight: '700' }}>{referrerId}</Text>
          </Text>
          <Text style={[styles.metaLine, { color: colors.textMuted }]}>
            Event Tag: <Text style={{ color: colors.primary, fontWeight: '700' }}>{eventTag}</Text>
          </Text>
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {isTe ? 'మీ స్వామి పేరు (Swami Name)' : 'Enter Your Swami Name'}
        </Text>
        <TextInput
          value={swamiName}
          onChangeText={setSwamiName}
          placeholder={isTe ? 'ఉదా. రమేష్ స్వామి' : 'e.g. Ramesh Swamy'}
          placeholderTextColor={colors.textDim}
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
        />

        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: colors.primary }]}
          onPress={handleJoin}
          disabled={joined}
          accessibilityRole="button"
          accessibilityLabel="Join Sannidhanam without phone or email"
        >
          <Ionicons name={joined ? 'checkmark-circle' : 'qr-code'} size={18} color="#0D1117" />
          <Text style={styles.joinBtnText}>
            {joined
              ? isTe ? 'చేరారు! సన్నిధానంకు వెళ్తోంది...' : 'Joined! Opening Sannidhanam...'
              : isTe ? 'సన్నిధానంలో చేరండి' : 'Join Sannidhanam'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {isTe ? 'హోమ్‌కు వెళ్ళండి' : 'Go to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center' },
  metaBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    marginVertical: 4,
  },
  metaLine: { fontSize: 12 },
  inputLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', marginTop: 4 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  joinBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  joinBtnText: { color: '#0D1117', fontSize: 15, fontWeight: '800' },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: '600' },
});

