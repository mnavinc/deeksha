import { ApiClient } from './api';

export type NotificationActionType =
  | 'qr_joined'
  | 'checkin_completed'
  | 'group_expense_added'
  | 'group_announcement'
  | 'profile_incomplete_nudge'
  | 'daily_morning_sandhya'
  | 'daily_evening_checkin'
  | 'custom_reminder';

export interface AppNotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: 'in_app' | 'push' | 'both';
  status: 'queued' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export function createNotificationApi(accessToken?: string) {
  const client = new ApiClient(accessToken);

  return {
    registerPushToken(token: string, platform: 'android' | 'ios' | 'web', deviceId?: string) {
      return client.request<{ ok: boolean }>('/v1/notifications/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform, deviceId }),
      });
    },

    listNotifications(limit = 30, unreadOnly = false) {
      const qs = new URLSearchParams({
        limit: String(limit),
        unreadOnly: unreadOnly ? 'true' : 'false',
      });
      return client.request<{ notifications: AppNotificationItem[]; unreadCount: number }>(
        `/v1/notifications?${qs.toString()}`
      );
    },

    markAsRead(id: string) {
      return client.request<{ ok: boolean }>(`/v1/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    markAllAsRead() {
      return client.request<{ ok: boolean; updatedCount: number }>('/v1/notifications/read-all', {
        method: 'POST',
      });
    },

    triggerNotification(payload: {
      actionType: NotificationActionType;
      title?: string;
      body?: string;
      delaySeconds?: number;
      data?: Record<string, unknown>;
    }) {
      return client.request<{ ok: boolean; queued: boolean; jobId: string | null }>(
        '/v1/notifications/trigger',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },
  };
}
