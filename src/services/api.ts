export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getBaseApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  let configUrl: string | undefined;

  try {
    // Optional require for Expo runtime without breaking in Node test environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants');
    configUrl = Constants?.default?.expoConfig?.extra?.apiUrl ?? Constants?.expoConfig?.extra?.apiUrl;
  } catch {
    // In node or testing environments where expo-constants is not present
  }

  const raw = envUrl || configUrl || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);

export class ApiClient {
  private readonly baseUrl: string;
  private readonly inflightGets = new Map<string, Promise<unknown>>();

  constructor(private readonly accessToken?: string, customBaseUrl?: string) {
    this.baseUrl = (customBaseUrl ?? getBaseApiUrl()).replace(/\/+$/, '');
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;

    // Deduplicate concurrent identical GET requests
    if (method === 'GET' && !options.signal) {
      const existing = this.inflightGets.get(url);
      if (existing) return existing as Promise<T>;
      const promise = this.executeWithRetry<T>(url, method, options).finally(() => {
        this.inflightGets.delete(url);
      });
      this.inflightGets.set(url, promise);
      return promise;
    }

    return this.executeWithRetry<T>(url, method, options);
  }

  private async executeWithRetry<T>(url: string, method: string, options: RequestOptions): Promise<T> {
    const maxRetries = options.retries ?? (method === 'GET' ? 2 : 0);
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeOnce<T>(url, options);
      } catch (err) {
        lastError = err;
        const isRetryable =
          err instanceof ApiError &&
          (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT' || RETRYABLE_STATUSES.has(err.status));

        if (!isRetryable || attempt === maxRetries) {
          throw err;
        }
        const backoffMs = Math.min(1000 * 2 ** attempt, 4000) + Math.floor(Math.random() * 200);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError;
  }

  private async executeOnce<T>(url: string, options: RequestOptions): Promise<T> {
    const { timeoutMs = 15_000, retries: _retries, ...init } = options;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorData = typeof payload === 'object' && payload !== null ? payload : {};
        const errorCode = (errorData as { error?: string }).error ?? `HTTP_${response.status}`;
        const errorMessage =
          (errorData as { message?: string }).message ?? `API request failed with status ${response.status}`;
        const errorDetails = (errorData as { details?: unknown }).details;

        throw new ApiError(response.status, errorCode, errorMessage, errorDetails);
      }

      return payload as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(408, 'TIMEOUT', `Request timed out after ${timeoutMs}ms`);
      }
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        err instanceof Error ? err.message : 'A network error occurred connecting to the API server'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getMe() {
    return this.request<{ id: string; email?: string; display_name: string; language: 'en' | 'te' | 'ml' }>('/v1/me');
  }

  updateMe(body: { displayName: string; language: 'en' | 'te' | 'ml' }) {
    return this.request<{ id: string; display_name: string; language: 'en' | 'te' | 'ml' }>('/v1/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  getActiveEnrollment() {
    return this.request<{
      id: string;
      deeksha_type_id: string;
      mala_dharanam_date: string;
      duration_days: number;
      target_yatra_date?: string | null;
      pilgrimage_count: number;
      status: string;
    } | null>('/v1/enrollments/active');
  }

  createEnrollment(body: {
    deekshaTypeId: string;
    malaDharanamDate: string;
    durationDays: number;
    targetYatraDate?: string;
    pilgrimageCount: number;
  }) {
    return this.request<{ id: string }>('/v1/enrollments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getEnrollmentLogs(enrollmentId: string) {
    return this.request<
      Array<{
        log_date: string;
        checkpoints: Record<string, boolean>;
        walking_km: number;
        saranam_count: number;
        notes?: string | null;
      }>
    >(`/v1/enrollments/${enrollmentId}/logs`);
  }

  saveDailyLog(enrollmentId: string, log: unknown) {
    return this.request(`/v1/enrollments/${enrollmentId}/logs`, {
      method: 'PUT',
      body: JSON.stringify(log),
    });
  }

  completeEnrollment(enrollmentId: string) {
    return this.request(`/v1/enrollments/${enrollmentId}/complete`, {
      method: 'PATCH',
    });
  }

  getGroups() {
    return this.request<
      Array<{
        id: string;
        name: string;
        season: string;
        route?: string | null;
        members?: Array<{ userId: string; role: 'GROUP_ADMIN' | 'EXPENSE_MANAGER' | 'MEMBER'; name: string }>;
      }>
    >('/v1/groups');
  }

  createGroup(body: { name: string; season: string; route?: string }) {
    return this.request<{ id: string; name: string; season: string; route: string | null }>('/v1/groups', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
