/**
 * notifications.ts — Web & Mobile Notifications for Daily 7:00 PM Check-in,
 * Sunrise/Sunset Sandhya Alerts, Profile Completion Reminders, & Group Updates.
 */
import { calculateSunTimes } from './solarTimes';
import { createNotificationApi, type NotificationActionType } from '@/services/notificationApi';

function emitLocalNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // Ignore browser notification errors in restricted contexts
    }
  }
}

export async function dispatchActionNotification(params: {
  authToken?: string | null;
  actionType: NotificationActionType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  emitLocalNotification(params.title, params.body);
  if (params.authToken) {
    try {
      await createNotificationApi(params.authToken).triggerNotification({
        actionType: params.actionType,
        title: params.title,
        body: params.body,
        data: params.data,
      });
    } catch {
      // Offline-safe: do not block local user flow if backend is unreachable
    }
  }
}

export async function sendWelcomeNotification(name: string, authToken?: string | null): Promise<void> {
  await dispatchActionNotification({
    authToken,
    actionType: 'welcome',
    title: '🙏 Welcome to Swamiseva Deeksha Journey!',
    body: `Swamiye Saranam Ayyappa, ${name}! Daily check-in, journey & Sannidhanam notifications are enabled.`,
    data: { name },
  });
}

export async function sendDailyCheckinNotification(day: number, points: number, authToken?: string | null): Promise<void> {
  await dispatchActionNotification({
    authToken,
    actionType: 'checkin_completed',
    title: '✅ Daily Deeksha Check-in Complete',
    body: `Day ${day} Niyamas recorded (+${points} pts). Swamiye Saranam Ayyappa!`,
    data: { day, points },
  });
}

export async function sendJourneyUpdateNotification(milestone: string, authToken?: string | null): Promise<void> {
  await dispatchActionNotification({
    authToken,
    actionType: 'journey_update',
    title: `🗺️ Journey Update: ${milestone}`,
    body: `You unlocked "${milestone}" on your sacred Deeksha path!`,
    data: { milestone },
  });
}

export async function sendGroupMemberAddedNotification(groupName: string, memberName: string, authToken?: string | null): Promise<void> {
  await dispatchActionNotification({
    authToken,
    actionType: 'group_member_added',
    title: `👥 New Member in ${groupName}`,
    body: `${memberName} was added to ${groupName}.`,
    data: { groupName, memberName },
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }
  return true;
}

/**
 * Schedule daily reminder at 7:00 PM (19:00) if active in Deeksha
 */
export async function scheduleDaily7pmCheckinReminder(): Promise<void> {
  console.log('[NotificationEngine] Daily 7:00 PM Check-in notification scheduled.');
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    // Web reminder notification
    const now = new Date();
    const target = new Date();
    target.setHours(19, 0, 0, 0);
    if (now > target) target.setDate(target.getDate() + 1);

    const sun = calculateSunTimes();
    const msUntil7pm = target.getTime() - now.getTime();
    setTimeout(() => {
      new Notification('☀️ 7:00 PM Deeksha Check-in • నేటి దీక్ష చెక్-ఇన్ సమయం!', {
        body: `Swami, complete today's Niyamas! Today: Sunrise ${sun.sunrise} · Sunset ${sun.sunset} 🙏`,
      });
    }, Math.min(msUntil7pm, 2147483647));
  }
}

/**
 * Trigger notification when a group member adds a new expense
 */
export async function sendGroupExpenseNotification(
  groupName: string,
  amount: number,
  addedBy: string,
  authToken?: string | null
): Promise<void> {
  const title = `💰 New Group Expense — ${groupName}`;
  const body = `${addedBy} added ₹${amount.toLocaleString('en-IN')} to ${groupName}. Tap to view settlement details.`;
  await dispatchActionNotification({
    authToken,
    actionType: 'group_expense_added',
    title,
    body,
    data: { groupName, amount, addedBy },
  });
}

/**
 * Trigger notification when a new group message/announcement is posted
 */
export async function sendGroupMessageNotification(
  groupName: string,
  author: string,
  message: string,
  authToken?: string | null
): Promise<void> {
  const title = `📢 ${groupName} — Announcement`;
  const body = `${author}: "${message}"`;
  await dispatchActionNotification({
    authToken,
    actionType: 'group_announcement',
    title,
    body,
    data: { groupName, author, message },
  });
}

/**
 * Remind a QR-joined member who has not yet shared their Name & Phone to complete profile for points
 */
export async function sendProfileCompletionReminderNotification(sannidhanamName?: string): Promise<void> {
  const sun = calculateSunTimes();
  const title = '🙏 Complete Profile to Claim +50 Points';
  const body = `${sannidhanamName ? `Joined ${sannidhanamName}! ` : ''}Add your Name & Phone to earn +50 points & unlock posting. Sunrise ${sun.sunrise} · Sunset ${sun.sunset}`;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

/**
 * Send a timely Sandhya alert with today's Sunrise and Sunset times
 */
export async function sendTimelySolarAlertNotification(): Promise<void> {
  const sun = calculateSunTimes();
  const title = `🌅 Sunrise ${sun.sunrise} · 🌇 Sunset ${sun.sunset}`;
  const body = 'Swamiye Saranam Ayyappa! Align your morning Snanam, evening Deeparadhana & daily check-in with today\'s Sandhya timings.';

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
