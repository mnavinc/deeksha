/**
 * notifications.ts — Web & Mobile Notifications for Daily 7:00 PM Check-in,
 * Sunrise/Sunset Sandhya Alerts, Profile Completion Reminders, & Group Updates.
 */
import { calculateSunTimes } from './solarTimes';

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
export async function sendGroupExpenseNotification(groupName: string, amount: number, addedBy: string): Promise<void> {
  const title = `💰 New Group Expense — ${groupName}`;
  const body = `${addedBy} added ₹${amount.toLocaleString('en-IN')} to ${groupName}. Tap to view settlement details.`;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

/**
 * Trigger notification when a new group message/announcement is posted
 */
export async function sendGroupMessageNotification(groupName: string, author: string, message: string): Promise<void> {
  const title = `📢 ${groupName} — Announcement`;
  const body = `${author}: "${message}"`;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
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
