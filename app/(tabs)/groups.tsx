import { useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { calculateBalances, suggestSettlements } from '@/engines/expenseEngine';
import { useAppStore } from '@/store/useAppStore';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { HeaderNav } from '@/components/HeaderNav';
import { QrCodeSvg } from '@/components/QrCodeSvg';
import { buildSannidhanamInviteUrl, parseSannidhanamInvitePayload } from '@/engines/qrInviteEngine';

export default function GroupsScreen() {
  const groups = useAppStore((s) => s.groups);
  const create = useAppStore((s) => s.createGroup);
  const expenses = useAppStore((s) => s.expenses);
  const addMember = useAppStore((s) => s.addGroupMember);
  const removeMember = useAppStore((s) => s.removeGroupMember);
  const setRole = useAppStore((s) => s.setGroupMemberRole);
  const addMessage = useAppStore((s) => s.addGroupMessage);
  const nominate = useAppStore((s) => s.nominateGroupGuru);
  const profile = useAppStore((s) => s.profile);
  const joinSannidhanamByQr = useAppStore((s) => s.joinSannidhanamByQr);
  const userActionLogs = useAppStore((s) => s.userActionLogs);
  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const colors = useThemeColors();
  const { t, language } = useI18n();

  const [groupNameInput, setGroupNameInput] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [qrInput, setQrInput] = useState('');

  const group = groups[0];

  const handleCreateGroup = () => {
    const trimmed = groupNameInput.trim();
    setErrorMsg('');

    if (trimmed.length < 3) {
      setErrorMsg(language === 'te' ? 'సన్నిధానం పేరు కనీసం 3 అక్షరాలు ఉండాలి.' : 'Sannidhanam name must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 50) {
      setErrorMsg(language === 'te' ? 'సన్నిధానం పేరు 50 అక్షరాల కంటే తక్కువ ఉండాలి.' : 'Sannidhanam name must be less than 50 characters.');
      return;
    }

    // Name duplication check
    const duplicate = groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setErrorMsg(language === 'te' ? 'ఈ పేరుతో సన్నిధానం ఇప్పటికే ఉంది. దయచేసి వేరే పేరును ఉపయోగించండి.' : 'A Sannidhanam with this name already exists. Please choose a different name.');
      return;
    }

    create(trimmed, 'Current mandala season');
    setGroupNameInput('');
  };

  const handleAddMember = () => {
    if (!group || !memberInput.trim()) return;
    addMember(group.id, memberInput.trim());
    setMemberInput('');
  };

  if (!group) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <HeaderNav />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('sannidhanam')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te' ? 'మీ గురు స్వామి సన్నిధానం గ్రూపును సృష్టించండి లేదా చేరండి.' : 'Create or manage your pilgrim Sannidhanam group.'}
          </Text>

          <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]}>{t('createSannidhanam')}</Text>
            <TextInput
              value={groupNameInput}
              onChangeText={(txt) => { setGroupNameInput(txt); setErrorMsg(''); }}
              placeholder={language === 'te' ? 'ఉదా. శ్రీ అయ్యప్ప సన్నిధానం' : 'e.g. Sri Manikanta Sannidhanam'}
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}
            <TouchableOpacity
              style={[styles.primary, { backgroundColor: colors.primary }]}
              onPress={handleCreateGroup}
            >
              <Text style={styles.primaryText}>{t('createSannidhanam')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const balances = calculateBalances(expenses.filter((e) => e.groupId === group.id), group.members);
  const settlements = suggestSettlements(balances);
  const messages = group.messages ?? [];

  const isVerifiedGroup = Boolean(group.guruName);

  const inviteUrl = buildSannidhanamInviteUrl({
    sannidhanamId: group.id,
    sannidhanamName: group.name,
    season: group.season,
    referrerId: profile?.id ?? 'guru-swami',
    eventTag: 'qr_sannidhanam_invite',
  });
  const inviteText =
    language === 'te'
      ? `🙏 స్వామియే శరణం అయ్యప్ప!\n"${group.name}" సన్నిధానం గ్రూపులో చేరండి (${group.season}).\nదీక్ష ట్రాకర్, పూజా విధానం & యాత్ర మార్గదర్శి:`
      : `🙏 Swamiye Saranam Ayyappa!\nJoin our "${group.name}" Sannidhanam circle (${group.season}) on Deeksha Journey:`;

  const handleJoinByQrInput = () => {
    const parsed = parseSannidhanamInvitePayload(qrInput);
    if (!parsed) {
      setInviteStatus(language === 'te' ? 'సరైన QR లింక్ నమోదు చేయండి.' : 'Please paste a valid QR invite link.');
      return;
    }
    joinSannidhanamByQr({
      ...parsed,
      memberName: profile?.name ?? 'Swami',
    });
    setQrInput('');
    setInviteStatus(
      language === 'te'
        ? `"${parsed.sannidhanamName}" సన్నిధానంలో చేరారు!`
        : `Joined "${parsed.sannidhanamName}" via QR (${parsed.eventTag})!`
    );
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${inviteText}\n${inviteUrl}`)}`;
    Linking.openURL(url).catch(() => {});
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText)}`;
    Linking.openURL(url).catch(() => {});
  };

  const shareToInstagram = async () => {
    const fullText = `${inviteText}\n${inviteUrl}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullText);
        setInviteStatus(
          language === 'te'
            ? 'ఆహ్వాన లింక్ కాపీ చేయబడింది! Instagram DM / Storyలో పేస్ట్ చేయండి.'
            : 'Invite copied! Paste in Instagram DM or Story.'
        );
      } catch {}
      Linking.openURL('https://www.instagram.com/direct/inbox/').catch(() => {});
    } else {
      await Share.share({ message: fullText, url: inviteUrl }).catch(() => {});
    }
  };

  const filteredMembers = group.members.filter((m) =>
    memberSearchQuery.trim() === ''
      ? true
      : m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <HeaderNav />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroHeaderRow}>
              <Text style={styles.eyebrow}>{language === 'te' ? 'పవిత్ర సన్నిధానం' : 'SACRED SANNIDHANAM'}</Text>
              {isVerifiedGroup && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{language === 'te' ? ' గురు స్వామి ఆమోదం ✅' : ' Verified Sannidhanam ✅'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.heading}>{group.name}</Text>
            <Text style={styles.subtitle}>{group.members.length} {t('members')} · {group.season}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{group.members.length}</Text>
          </View>
        </View>

        {/* Invite Swamis to Sannidhanam (QR Code + WhatsApp / Telegram / Instagram) */}
        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.text }]}>
            {language === 'te' ? 'సన్నిధానం QR ఆహ్వానం • QR & Social Invite' : 'Sannidhanam QR & Social Invite'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {language === 'te'
              ? 'ఈ QR కోడ్ స్కాన్ చేసి మొబైల్/ఇమెయిల్ లేకుండానే సన్నిధానంలో చేరవచ్చు'
              : 'Scan this safe QR code (no phone/email needed) or share via WhatsApp, Telegram & Instagram'}
          </Text>
          <View style={styles.qrCenter}>
            <QrCodeSvg value={inviteUrl} size={156} />
            <Text style={[styles.subtitle, { color: colors.textDim, textAlign: 'center', marginTop: 6 }]}>
              ID: {group.id.slice(0, 14)} · Tag: qr_sannidhanam_invite
            </Text>
          </View>
          <View style={styles.shareRow}>
            <TouchableOpacity
              onPress={shareToWhatsApp}
              accessibilityRole="button"
              accessibilityLabel="Invite via WhatsApp"
              style={[styles.shareBtn, { backgroundColor: '#25D3661E', borderColor: '#25D366' }]}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={[styles.shareBtnText, { color: '#25D366' }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareToTelegram}
              accessibilityRole="button"
              accessibilityLabel="Invite via Telegram"
              style={[styles.shareBtn, { backgroundColor: '#0088CC1E', borderColor: '#0088CC' }]}
            >
              <Ionicons name="paper-plane" size={18} color="#38BDF8" />
              <Text style={[styles.shareBtnText, { color: '#38BDF8' }]}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareToInstagram}
              accessibilityRole="button"
              accessibilityLabel="Invite via Instagram"
              style={[styles.shareBtn, { backgroundColor: '#E1306C1E', borderColor: '#E1306C' }]}
            >
              <Ionicons name="logo-instagram" size={18} color="#F472B6" />
              <Text style={[styles.shareBtnText, { color: '#F472B6' }]}>Instagram</Text>
            </TouchableOpacity>
          </View>
          {/* Paste scanned QR invite URL */}
          <View style={[styles.addRow, { borderColor: colors.border, marginTop: 6 }]}>
            <TextInput
              value={qrInput}
              onChangeText={setQrInput}
              placeholder={language === 'te' ? 'QR ఆహ్వాన లింక్ పేస్ట్ చేయండి...' : 'Paste scanned QR invite link...'}
              placeholderTextColor={colors.textDim}
              style={[styles.memberInput, { color: colors.text }]}
            />
            <TouchableOpacity
              onPress={handleJoinByQrInput}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
            >
              <Text style={{ color: '#0D1117', fontSize: 12, fontWeight: '800' }}>{language === 'te' ? 'చేరండి' : 'Join QR'}</Text>
            </TouchableOpacity>
          </View>
          {userActionLogs.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              ✓ {userActionLogs.length} action log(s) · Latest tag: {userActionLogs[0].eventTags.join(', ')}
            </Text>
          )}
          {inviteStatus ? (
            <Text style={[styles.subtitle, { color: colors.success, marginTop: 4 }]}>{inviteStatus}</Text>
          ) : null}
        </View>

        {/* Guru Swamy Verification & Nomination */}
        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.section, { color: colors.text }]}>{t('guru')}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{group.guruName ?? t('guideNotAssigned')}</Text>
            </View>
            <TouchableOpacity onPress={() => nominate(group.id, group.members[0]?.name ?? '')}>
              <Text style={styles.link}>{group.guruName ? t('approved') : t('nominate')}</Text>
            </TouchableOpacity>
          </View>
          {group.guruName && (
            <View style={styles.verifiedGuruRow}>
              <Text style={styles.good}>
                ✓ {t('approved')} {group.guruApprovalCount}/{Math.max(0, group.members.length - 1)}
              </Text>
              <Text style={styles.verifiedSubText}>
                {language === 'te' ? 'గురు స్వామి మార్గదర్శకత్వం కలిగిన ధృవీకరించబడిన సమూహం' : 'Verified circle with active Guru Swamy guidance'}
              </Text>
            </View>
          )}
        </View>

        {/* Members with Search */}
        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.section, { color: colors.text }]}>{t('members')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{filteredMembers.length} listed</Text>
          </View>

          {/* Member Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              value={memberSearchQuery}
              onChangeText={setMemberSearchQuery}
              placeholder={language === 'te' ? 'సభ్యులను వెతకండి...' : 'Search group members...'}
              placeholderTextColor={colors.textDim}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {memberSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {filteredMembers.map((m) => (
            <View key={m.userId} style={styles.member}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{m.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: colors.text }]}>{m.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{m.role.replace('_', ' ').toLowerCase()}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setRole(group.id, m.userId,
                    m.role === 'MEMBER' ? 'EXPENSE_MANAGER' : m.role === 'EXPENSE_MANAGER' ? 'GROUP_ADMIN' : 'MEMBER'
                  )
                }
              >
                <Text style={styles.role}>Role</Text>
              </TouchableOpacity>
              {group.members.length > 1 && (
                <TouchableOpacity onPress={() => removeMember(group.id, m.userId)}>
                  <Ionicons name="close-circle" color={colors.error} size={20} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add member (raw name or registered profile) */}
          <View style={[styles.addRow, { borderColor: colors.border }]}>
            <TextInput
              value={memberInput}
              onChangeText={setMemberInput}
              placeholder={language === 'te' ? 'సభ్యుని పేరు నమోదు చేయండి...' : 'Enter member name to add...'}
              placeholderTextColor={colors.textDim}
              style={[styles.memberInput, { color: colors.text }]}
            />
            <TouchableOpacity onPress={handleAddMember}>
              <Ionicons name="person-add" color={colors.primary} size={23} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Chat / Notes */}
        <View style={[styles.card, getClayStyle(activeTheme, 'medium'), { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.section, { color: colors.text }]}>{t('groupChat')}</Text>
            <Text style={styles.live}>● LIVE</Text>
          </View>
          {messages.length === 0 ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {language === 'te'
                ? 'మీ వలయంతో ఒక ఉపయోగకరమైన గమనిక లేదా ప్రణాళికను పంచుకోండి.'
                : 'Share a helpful note, plan or reminder with your circle.'}
            </Text>
          ) : (
            messages.slice(-4).map((x) => (
              <View key={x.id} style={[styles.message, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={styles.messageAuthor}>{x.author}</Text>
                <Text style={[styles.messageText, { color: colors.text }]}>{x.text}</Text>
              </View>
            ))
          )}
          <View style={[styles.addRow, { borderColor: colors.border }]}>
            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder={t('message')}
              placeholderTextColor={colors.textDim}
              style={[styles.memberInput, { color: colors.text }]}
            />
            <TouchableOpacity onPress={() => { if (noteInput.trim()) { addMessage(group.id, noteInput.trim()); setNoteInput(''); } }}>
              <Ionicons name="send" color={colors.primary} size={21} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Expense */}
        <TouchableOpacity style={styles.expense} onPress={() => router.push('/expenses/add')}>
          <Ionicons name="wallet-outline" color={colors.primary} size={22} />
          <View>
            <Text style={styles.expenseTitle}>{t('addExpense')}</Text>
            <Text style={styles.subtitle}>{t('splitCosts')}</Text>
          </View>
        </TouchableOpacity>

        {/* Balances */}
        {balances.map((b) => (
          <View key={b.userId} style={[styles.balance, { backgroundColor: colors.surface }]}>
            <Text style={[styles.memberName, { color: colors.text }]}>{b.name}</Text>
            <Text style={[styles.net, { color: b.net >= 0 ? colors.success : colors.error }]}>
              {b.net >= 0 ? 'Gets ' : 'Owes '}₹{Math.abs(b.net).toFixed(0)}
            </Text>
          </View>
        ))}

        {/* Settlements */}
        {settlements.map((s, i) => (
          <TouchableOpacity key={i} style={[styles.settlement, { borderColor: colors.border }]}>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{s.fromName} → {s.toName}</Text>
            <Text style={styles.link}>₹{s.amount.toFixed(0)} · {t('markPaid')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: spacing.md, gap: 12, paddingBottom: 60 },
  hero: {
    backgroundColor: '#162A25',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#F0B429', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  verifiedBadge: {
    backgroundColor: '#34d39922',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  verifiedText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  heading: { color: '#ffffff', fontSize: 23, fontWeight: '800', marginTop: 4 },
  subtitle: { fontSize: 12, marginTop: 3 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0B42930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#F0B429', fontSize: 18, fontWeight: '800' },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: 16, fontWeight: '700' },
  link: { color: '#F0B429', fontSize: 12, fontWeight: '700' },
  verifiedGuruRow: { gap: 2 },
  good: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  verifiedSubText: { color: '#34d399', fontSize: 11, fontStyle: 'italic' },
  qrCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 12 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  memberAvatar: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: '#58A6FF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { color: '#58A6FF', fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '600' },
  role: { color: '#F0B429', fontSize: 11, fontWeight: '600', paddingHorizontal: 6 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderColor: '#30363D',
    paddingTop: 10,
  },
  memberInput: { flex: 1, fontSize: 13 },
  live: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  message: { backgroundColor: '#0D1117', borderRadius: 10, padding: 9 },
  messageAuthor: { color: '#F0B429', fontSize: 11, fontWeight: '700' },
  messageText: { color: '#ffffff', fontSize: 13, marginTop: 2 },
  expense: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F0B42914',
    borderWidth: 1,
    borderColor: '#F0B42955',
  },
  expenseTitle: { color: '#F0B429', fontWeight: '800' },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  net: { fontWeight: '800' },
  settlement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  primary: { padding: 15, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#0D1117', fontWeight: '800' },
  errorText: { color: '#f87171', fontSize: 12, marginTop: -4 },
});
