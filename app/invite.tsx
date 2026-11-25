import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isProfileComplete, useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { SwamisevaLogo } from '@/components/SwamisevaLogo';
import { MalaSetupFields, type MalaStatus } from '@/components/MalaSetupFields';
import { format } from '@/engines/dateUtils';
import { computeMalaStartDate, resolveDeekshaDuration } from '@/engines/deekshaEngine';
import { useI18n } from '@/i18n';
import { sendProfileCompletionReminderNotification } from '@/utils/notifications';

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
    tid?: string;
  }>();

  const colors = useThemeColors();
  const { language } = useI18n();
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const profile = useAppStore((s) => s.profile);
  const joinSannidhanamByQr = useAppStore((s) => s.joinSannidhanamByQr);
  const completeProfileForPoints = useAppStore((s) => s.completeProfileForPoints);
  const startDeeksha = useAppStore((s) => s.startDeeksha);

  const sannidhanamId = params.s || 'sannidhanam-demo';
  const sannidhanamName = params.n || 'Sri Ayyappa Sannidhanam';
  const season = params.se || 'Mandala-Makaravilakku';
  const referrerId = params.r || 'guru-swami';
  const eventTag = params.tag || 'qr_sannidhanam_invite';
  const trackingId = params.tid;

  const [swamiName, setSwamiName] = useState(
    profile?.name && profile.name !== 'Swami' ? profile.name : ''
  );
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [pilgrimageCount, setPilgrimageCount] = useState('1');
  const [malaStatus, setMalaStatus] = useState<MalaStatus>('existing');
  const [completedDays, setCompletedDays] = useState('0');
  const [plannedStartDate, setPlannedStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState('41');
  const [profileError, setProfileError] = useState('');
  const [joined, setJoined] = useState(false);
  const [pointsClaimed, setPointsClaimed] = useState(false);
  const [apkTriggered, setApkTriggered] = useState(false);
  const autoJoinedRef = useRef(false);

  const isTe = language === 'te';
  const isWeb = Platform.OS === 'web';
  const isAndroidWeb =
    isWeb && typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const deepLinkUrl = `deekshajourney://invite?s=${encodeURIComponent(sannidhanamId)}&n=${encodeURIComponent(sannidhanamName)}&se=${encodeURIComponent(season)}&r=${encodeURIComponent(referrerId)}&tag=${encodeURIComponent(eventTag)}${trackingId ? `&tid=${encodeURIComponent(trackingId)}` : ''}`;

  // Join the Sannidhanam immediately on QR scan, then prompt for profile (Name + Phone) for points
  useEffect(() => {
    if (!params.s || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    const alreadyComplete = isProfileComplete(profile);
    joinSannidhanamByQr({
      sannidhanamId,
      sannidhanamName,
      season,
      referrerId,
      eventTag,
      trackingId,
      memberName: profile?.name ?? 'Swami',
      phone: profile?.phone,
      awardPoints: alreadyComplete,
    });
    setJoined(true);
    if (alreadyComplete && Platform.OS !== 'web') {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/groups');
      }, 450);
      return () => clearTimeout(timer);
    }
    if (!alreadyComplete) {
      void sendProfileCompletionReminderNotification(sannidhanamName);
    }
  }, [params.s, profile, sannidhanamId, sannidhanamName, season, referrerId, eventTag, trackingId, joinSannidhanamByQr]);

  const handleCompleteProfile = () => {
    setProfileError('');
    const cleanName = swamiName.trim();
    const digits = phone.replace(/\D/g, '');
    if (cleanName.length < 2) {
      setProfileError(isTe ? 'పాయింట్ల కోసం మీ స్వామి పేరు తప్పనిసరి.' : 'Swami Name is required to earn +50 points.');
      return;
    }
    if (digits.length < 10) {
      setProfileError(isTe ? 'పాయింట్ల కోసం కనీసం 10 అంకెల ఫోన్ నంబర్ తప్పనిసరి.' : 'Valid 10-digit Phone Number is required to earn +50 points.');
      return;
    }

    const parsedCount = Math.max(1, parseInt(pilgrimageCount, 10) || 1);
    if (!joined) {
      joinSannidhanamByQr({
        sannidhanamId,
        sannidhanamName,
        season,
        referrerId,
        eventTag,
        trackingId,
        memberName: cleanName,
        phone: phone.trim(),
        pilgrimageCount: parsedCount,
        awardPoints: true,
      });
      setJoined(true);
    } else {
      completeProfileForPoints({
        name: cleanName,
        phone: phone.trim(),
        pilgrimageCount: parsedCount,
      });
    }

    const resolvedDuration = resolveDeekshaDuration(
      parsedCount,
      parseInt(durationDays, 10)
    );
    const startDate = computeMalaStartDate({
      malaStatus,
      completedDays: parseInt(completedDays, 10) || 0,
      plannedStartDate,
    });
    startDeeksha({
      deekshaId: 'ayyappa',
      pilgrimageCenter: 'Sabarimala',
      malaDharanamDate: startDate,
      durationDays: resolvedDuration,
      pilgrimageCount: parsedCount,
    });

    setPointsClaimed(true);
    setTimeout(() => {
      router.replace('/(tabs)/groups');
    }, 600);
  };

  const handleJoinUpdatesOnly = () => {
    if (!joined) {
      joinSannidhanamByQr({
        sannidhanamId,
        sannidhanamName,
        season,
        referrerId,
        eventTag,
        trackingId,
        memberName: swamiName.trim() || 'Swami',
        awardPoints: false,
      });
      setJoined(true);
    }
    void sendProfileCompletionReminderNotification(sannidhanamName);
    router.replace('/(tabs)/groups');
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
      ? 'Swamiseva Android APK డౌన్‌లోడ్ చేయాలా? (~45 MB)'
      : 'Download Swamiseva Android APK (~45 MB) to install and auto-join this Sannidhanam?';
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
          <SwamisevaLogo size={68} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {isTe ? 'SWAMISEVA · QR సన్నిధానం ఆహ్వానం' : 'SWAMISEVA · QR SANNIDHANAM INVITE'}
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

        {joined && (
          <View style={[styles.apkBox, { backgroundColor: `${colors.success}18`, borderColor: colors.success }]}>
            <Text style={[styles.apkTitle, { color: colors.success }]}>
              {isTe ? '✓ సన్నిధానంలో చేరారు!' : '✓ Joined Sannidhanam Immediately!'}
            </Text>
            <Text style={[styles.apkSub, { color: colors.textMuted }]}>
              {isTe
                ? '+50 పాయింట్లు & సభ్యుల జోడింపు/పోస్టింగ్ కోసం క్రింద మీ పేరు & ఫోన్ నంబర్ పూర్తి చేయండి.'
                : 'Complete your Name & Phone below to claim +50 points and unlock adding members & posting.'}
            </Text>
          </View>
        )}

        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {isTe ? 'మీ స్వామి పేరు * (పాయింట్ల కోసం తప్పనిసరి)' : 'Your Swami Name * (Mandatory for Points)'}
        </Text>
        <TextInput
          value={swamiName}
          onChangeText={(txt) => { setSwamiName(txt); setProfileError(''); }}
          placeholder={isTe ? 'ఉదా. రమేష్ స్వామి' : 'e.g. Ramesh Swamy'}
          placeholderTextColor={colors.textDim}
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
        />

        <Text style={[styles.inputLabel, { color: colors.text }]}>
          {isTe ? 'ఫోన్ నంబర్ * (పాయింట్ల కోసం తప్పనిసరి)' : 'Phone Number * (Mandatory for Points)'}
        </Text>
        <TextInput
          value={phone}
          onChangeText={(txt) => { setPhone(txt); setProfileError(''); }}
          keyboardType="phone-pad"
          placeholder={isTe ? '10 అంకెల మొబైల్ నంబర్' : '10-digit mobile number'}
          placeholderTextColor={colors.textDim}
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
        />

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

        <MalaSetupFields
          pilgrimageCount={Math.max(1, parseInt(pilgrimageCount, 10) || 1)}
          malaStatus={malaStatus}
          onChangeMalaStatus={setMalaStatus}
          completedDays={completedDays}
          onChangeCompletedDays={setCompletedDays}
          plannedStartDate={plannedStartDate}
          onChangePlannedStartDate={setPlannedStartDate}
          durationDays={durationDays}
          onChangeDurationDays={setDurationDays}
          isTe={isTe}
        />

        {profileError ? (
          <Text style={[styles.apkNote, { color: '#F87171', alignSelf: 'flex-start' }]}>⚠️ {profileError}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: colors.primary }]}
          onPress={handleCompleteProfile}
          disabled={pointsClaimed}
          accessibilityRole="button"
          accessibilityLabel="Complete profile to earn 50 points"
        >
          <Ionicons name={pointsClaimed ? 'checkmark-circle' : 'trophy'} size={18} color="#0D1117" />
          <Text style={styles.joinBtnText}>
            {pointsClaimed
              ? isTe ? 'ప్రొఫైల్ పూర్తయింది (+50 pts)!' : 'Profile Saved (+50 pts)! Opening...'
              : isTe ? 'ప్రొఫైల్ పూర్తి చేసి +50 పాయింట్లు పొందండి' : 'Save Profile & Claim +50 Points'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleJoinUpdatesOnly} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {isTe ? 'తర్వాత పూర్తి చేస్తాను (సన్నిధానం అప్‌డేట్స్ మాత్రమే)' : 'Continue for Updates Only (Complete Profile Later)'}
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
