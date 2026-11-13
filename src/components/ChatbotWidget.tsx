import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { getCurrentDay } from '@/engines/deekshaEngine';
import { getChatbotReply, type ChatAction, type ChatContext } from '@/engines/chatbotEngine';
import { useThemeColors, spacing } from '@/theme/colors';
import { getClayStyle } from '@/theme/claymorphism';
import { useI18n } from '@/i18n';
import { SacredIcon } from '@/components/SacredIcons';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  actions?: ChatAction[];
  suggestions?: string[];
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { language } = useI18n();

  const theme = useAppStore((s) => s.theme);
  const activeTheme = theme === 'system' ? 'dark' : theme;
  const profile = useAppStore((s) => s.profile);
  const enrollment = useAppStore((s) => s.enrollment);
  const totalPoints = useAppStore((s) => s.totalPoints);
  const pendingPoints = useAppStore((s) => s.pendingPoints);

  const [open, setOpen] = useState(false);
  const [expandedDesktop, setExpandedDesktop] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const msgIdRef = useRef(1);

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isTe = language === 'te';

  const chatContext: ChatContext = useMemo(
    () => ({
      language,
      userName: profile?.name,
      deekshaId: enrollment?.deekshaId,
      currentDay: enrollment ? getCurrentDay(enrollment) : undefined,
      durationDays: enrollment?.durationDays,
      totalPoints: totalPoints + pendingPoints,
    }),
    [language, profile?.name, enrollment, totalPoints, pendingPoints]
  );

  const initialGreeting = useMemo<ChatMessage>(() => {
    const reply = getChatbotReply('hi', chatContext);
    return {
      id: 'welcome-bot',
      role: 'bot',
      text: reply.text,
      suggestions: reply.suggestions,
      actions: reply.actions,
    };
  }, [chatContext]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialGreeting]);

  // Hide on initial 2-second splash screen
  if (pathname === '/') {
    return null;
  }

  const sendMessage = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    const userId = msgIdRef.current++;
    const botId = msgIdRef.current++;
    const userMsg: ChatMessage = {
      id: `u-${userId}`,
      role: 'user',
      text: query,
    };
    const reply = getChatbotReply(query, chatContext);
    const botMsg: ChatMessage = {
      id: `b-${botId}`,
      role: 'bot',
      text: reply.text,
      actions: reply.actions,
      suggestions: reply.suggestions,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const resetChat = () => {
    setMessages([initialGreeting]);
  };

  const handleActionPress = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  // Responsive panel dimensions
  const panelStyle = isMobile
    ? {
        width: '100%' as const,
        height: Math.min(height * 0.86, 680),
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }
    : isTablet
      ? {
          width: 400,
          height: Math.min(height * 0.78, 560),
          borderRadius: 24,
          marginRight: 20,
          marginBottom: 20,
        }
      : {
          width: expandedDesktop ? 520 : 410,
          height: expandedDesktop ? Math.min(height * 0.82, 700) : Math.min(height * 0.75, 580),
          borderRadius: 24,
          marginRight: 24,
          marginBottom: 24,
        };

  const fabBottom = isMobile ? insets.bottom + 72 : 24;
  const fabRight = isMobile ? 16 : 24;

  const chatPanelContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.panel,
        panelStyle,
        getClayStyle(activeTheme, 'high'),
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <SacredIcon name="lotus" size={34} withBadge />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isTe ? 'స్వామి దీక్షా సహాయకుడు' : 'Swami Deeksha Assistant'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.primary }]}>
            {isTe ? 'యాత్ర • పూజ • భోజన మంత్రాలు • సెట్టింగ్‌లు' : 'Journey • Mantras • App • Settings'}
          </Text>
        </View>
        {isDesktop && (
          <TouchableOpacity onPress={() => setExpandedDesktop((v) => !v)} style={styles.iconBtn}>
            <Ionicons name={expandedDesktop ? 'contract-outline' : 'expand-outline'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={resetChat} style={styles.iconBtn} accessibilityLabel="Reset chat">
          <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOpen(false)} style={styles.iconBtn} accessibilityLabel="Close chat">
          <Ionicons name="close-circle" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View key={msg.id} style={[styles.msgGroup, isUser ? styles.msgRight : styles.msgLeft]}>
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderBottomLeftRadius: 4,
                      },
                ]}
              >
                <Text style={[styles.msgText, { color: isUser ? '#0D1117' : colors.text }]}>
                  {msg.text}
                </Text>
              </View>

              {/* Action buttons */}
              {msg.actions && msg.actions.length > 0 && (
                <View style={styles.chipRow}>
                  {msg.actions.map((act, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.actionChip, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
                      onPress={() => handleActionPress(act.route)}
                    >
                      <Ionicons name="arrow-forward-circle-outline" size={14} color={colors.primary} />
                      <Text style={[styles.actionChipText, { color: colors.primary }]}>{act.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Suggestion prompt chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <View style={styles.chipRow}>
                  {msg.suggestions.map((sug, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.suggestChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      onPress={() => sendMessage(sug)}
                    >
                      <Text style={[styles.suggestChipText, { color: colors.textMuted }]}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Composer */}
      <View
        style={[
          styles.composer,
          { borderTopColor: colors.border, paddingBottom: isMobile ? Math.max(insets.bottom, 10) : 12 },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder={isTe ? 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...' : 'Ask about journey, mantras, settings...'}
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, !input.trim() && { opacity: 0.5 }]}
          onPress={() => sendMessage()}
          disabled={!input.trim()}
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={17} color="#0D1117" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <>
      {/* Floating Action Button (adapts to Mobile / Tablet / Desktop) */}
      {!open && (
        <TouchableOpacity
          style={[
            styles.fab,
            isDesktop && styles.fabDesktop,
            getClayStyle(activeTheme, 'high'),
            {
              bottom: fabBottom,
              right: fabRight,
              backgroundColor: colors.primary,
              borderColor: '#FFFBE640',
            },
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open Deeksha Assistant Chatbot"
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#0D1117" />
          {!isMobile && (
            <Text style={styles.fabLabel}>
              {isTe ? 'సహాయకుడు' : 'Ask Swami AI'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Adaptive Modal / Floating Popover */}
      <Modal
        visible={open}
        transparent
        animationType={isMobile ? 'slide' : 'fade'}
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            isMobile ? styles.overlayMobile : styles.overlayDesktop,
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          {chatPanelContent}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    elevation: 8,
  },
  fabDesktop: {
    width: 'auto',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  fabLabel: {
    color: '#0D1117',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000070',
  },
  overlayMobile: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  overlayDesktop: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  panel: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  iconBtn: {
    padding: 4,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: 12,
  },
  msgGroup: {
    maxWidth: '88%',
    gap: 6,
  },
  msgLeft: {
    alignSelf: 'flex-start',
  },
  msgRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
