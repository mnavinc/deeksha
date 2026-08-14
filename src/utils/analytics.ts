/**
 * analytics.ts — Lightweight, cross-platform user behavior tracking utility.
 * Tracks screen views, clicks, discipline progress, store purchases, and donations.
 */

export interface AnalyticsEvent {
  eventName: string;
  category: 'navigation' | 'auth' | 'discipline' | 'store' | 'donation' | 'social';
  params?: Record<string, any>;
  timestamp: string;
}

class AnalyticsService {
  private eventsLog: AnalyticsEvent[] = [];

  logEvent(eventName: string, category: AnalyticsEvent['category'], params?: Record<string, any>) {
    const event: AnalyticsEvent = {
      eventName,
      category,
      params,
      timestamp: new Date().toISOString(),
    };

    this.eventsLog.push(event);

    if (__DEV__) {
      console.log(`[Analytics 📊] ${category.toUpperCase()} -> ${eventName}`, params ?? '');
    }

    // Web Google Analytics / Plausible / PostHog hook
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: category,
        ...params,
      });
    }
  }

  logScreenView(screenName: string) {
    this.logEvent('screen_view', 'navigation', { screen_name: screenName });
  }

  getEvents() {
    return this.eventsLog;
  }
}

export const analytics = new AnalyticsService();
