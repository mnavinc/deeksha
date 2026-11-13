import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { SacredIcon } from '@/components/SacredIcons';
import { useI18n } from '@/i18n';

const DEFAULT_APK_URL =
  process.env.EXPO_PUBLIC_APK_URL ??
  'https://github.com/mnavinc/deeksha/releases/latest/download/app-release.apk';

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
  const groups = useAppStore((s) => s.groups);
  const joinSannidhanamByQr = useAppStore((s) => s.joinSannidhanamByQr);

  const sannidhanamId = params.s || 'sannidhanam-demo';
  const sannidhanamName = params.n || 'Sri Ayyappa Sannidhanam';
  const season = params.se || 'Mandala-Makaravilakku';
  const referrerId = params.r || 'guru-swami';
  const eventTag = params.tag || 'qr_sannidhanam_invite';

  const [swamiName, setSwamiName] = useState(profile?.name ?? '');
  const [earnPointsProfile, setEarnPointsProfile] = useState(true);
  const [pilgrimageCount, setPilgrimageCount] = useState('1');
  const [joined, setJoined] = useState(false);
  const [apkTriggered, setApkTriggered] = useState(false);

  const isTe = language === 'te';
  const isWeb = Platform.OS === 'web';
  const isAndroidWeb =
    isWeb && typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const deepLinkUrl = `deekshajourney://invite?s=${encodeURIComponent(sannidhanamId)}&n=${encodeURIComponent(sannidhanamName)}&se=${encodeURIComponent(season)}&r=${encodeURIComponent(referrerId)}&tag=${encodeURIComponent(eventTag)}`;

  // Auto-join immediately when opened inside an already-configured app
  useEffect(() => {
    if (!params.s || !profile?.name || joined) return;
    const alreadyInGroup = groups.some((g) => g.id === sannidhanamId);
    joinSannidhanamByQr({
      sannidhanamId,
      sannidhanamName,
      season,
      referrerId,
      eventTag,
      memberName: profile.name,
    });
    if (!alreadyInGroup || Platform.OS !== 'web') {
      const timer = setTimeout(() => {
        setJoined(true);
        router.replace('/(tabs)/groups');
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [params.s, profile?.name, joined, groups, sannidhanamId, sannidhanamName, season, referrerId, eventTag, joinSannidhanamByQr]);

  const handleJoin = () => {
    const cleanName = swamiName.trim() || 'Member Swami';
    const parsedCount = Math.max(1, parseInt(pilgrimageCount, 10) || 1);
    joinSannidhanamByQr({
      sannidhanamId,
      sannidhanamName,
      season,
      referrerId,
      eventTag,
      memberName: cleanName,
      pilgrimageCount: parsedCount,
      awardPoints: earnPointsProfile,
    });
    setJoined(true);
    setTimeout(() => {
      router.replace('/(tabs)/groups');
    }, 600);
  };

  const startApkDownload = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(deepLinkUrl);
      } catch {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'deeksha_pending_qr_invite',
          JSON.stringify({ sannidhanamId, sannidhanamName, season, referrerId, eventTag })
        );
      } catch {}
    }
    setApkTriggered(true);
    Linking.openURL(DEFAULT_APK_URL).catch(() => {});
  };

  const handleDownloadApkAndJoin = () => {
    const confirmMsg = isTe
      ? 'Deeksha Journey Android APK డౌన్‌లోడ్ చేయాలా? (~45 MB)'
      : 'Download Deeksha Journey Android APK (~45 MB) to install and auto-join this Sannidhanam?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        void startApkDownload();
      }
    } else {
      Alert.alert('Confirm APK Download', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => void startApkDownload() },
      ]);
    }
  };

  const handleOpenInstalledApp = () => {
    Linking.openURL(deepLinkUrl).catch(() => {});
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

        {/* Android Web: Download APK + Deep Link Auto-Join */}
        {isWeb && (
          <View style={[styles.apkBox, { backgroundColor: `${colors.primary}14`, borderColor: colors.primary }]}>
            <Text style={[styles.apkTitle, { color: colors.primary }]}>
              {isAndroidWeb
                ? isTe ? '📱 Android యాప్ డౌన్‌లోడ్ & ఆటో-జాయిన్' : '📱 Get the Android App & Auto-Join'
                : isTe ? '📱 Android APK డౌన్‌లోడ్' : '📱 Android App Available'}
            </Text>
            <Text style={[styles.apkSub, { color: colors.textMuted }]}>
              {isTe
                ? 'APK ఇన్‌స్టాల్ చేసిన తర్వాత "Open Installed App" నొక్కితే ఈ సన్నిధానంలో ఆటోమేటిక్‌గా చేరుతారు.'
                : 'Install the APK, then tap "Open Installed App" to auto-join this Sannidhanam with zero signup.'}
            </Text>
            <View style={styles.apkBtnRow}>
              <TouchableOpacity
                style={[styles.apkBtn, { backgroundColor: colors.primary }]}
                onPress={handleDownloadApkAndJoin}
                accessibilityRole="button"
                accessibilityLabel="Download Android APK"
              >
                <Ionicons name="download-outline" size={16} color="#0D1117" />
                <Text style={styles.apkBtnText}>
                  {isTe ? 'APK డౌన్‌లోడ్' : 'Download APK'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.apkBtnOutline, { borderColor: colors.primary }]}
                onPress={handleOpenInstalledApp}
                accessibilityRole="button"
                accessibilityLabel="Open Installed App"
              >
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={[styles.apkBtnOutlineText, { color: colors.primary }]}>
                  {isTe ? 'యాప్ తెరవండి' : 'Open App'}
                </Text>
              </TouchableOpacity>
            </View>
            {apkTriggered && (
              <Text style={[styles.apkNote, { color: colors.success }]}>
                {isTe
                  ? '✓ APK డౌన్‌లోడ్ ప్రారంభమైంది & ఇన్వైట్ లింక్ కాపీ చేయబడింది!'
                  : '✓ APK download started & invite link copied for app handoff!'}
              </Text>
            )}
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 0 }]}>
              {isTe ? 'పాయింట్ల కోసం ప్రొఫైల్ పూర్తి చేయండి (+50 pts)' : 'Complete Profile for +50 Points'}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted, textAlign: 'left', fontSize: 11 }]}>
              {isTe
                ? 'ఆఫ్ చేస్తే అప్‌డేట్ల కోసం సాధారణ సభ్యుడిగా చేరుతారు'
                : 'Turn off to join simply as a member for Sannidhanam updates'}
            </Text>
          </View>
          <Switch
            value={earnPointsProfile}
            onValueChange={setEarnPointsProfile}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {isTe ? 'మీ స్వామి పేరు (Swami Name)' : 'Your Swami Name'}
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

        {earnPointsProfile && (
          <>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isTe ? 'మాల ధారణ సంఖ్య (Yatra Count)' : 'Pilgrimage Count (e.g. 1 for Kanni)'}
            </Text>
            <TextInput
              value={pilgrimageCount}
              onChangeText={setPilgrimageCount}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.textDim}
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
              ]}
            />
          </>
        )}

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
  apkBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 6,
  },
  apkTitle: { fontSize: 13, fontWeight: '800' },
  apkSub: { fontSize: 11, lineHeight: 16 },
  apkBtnRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  apkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  apkBtnText: { color: '#0D1117', fontSize: 12, fontWeight: '800' },
  apkBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  apkBtnOutlineText: { fontSize: 12, fontWeight: '800' },
  apkNote: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
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
