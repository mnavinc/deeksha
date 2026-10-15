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
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(private readonly accessToken?: string, customBaseUrl?: string) {
    this.baseUrl = (customBaseUrl ?? getBaseApiUrl()).replace(/\/+$/, '');
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 15_000, ...init } = options;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;

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
    return this.request<{ id: string; email?: string; display_name: string; language: string }>('/v1/me');
  }

  getActiveEnrollment() {
    return this.request('/v1/enrollments/active');
  }

  saveDailyLog(enrollmentId: string, log: unknown) {
    return this.request(`/v1/enrollments/${enrollmentId}/logs`, {
      method: 'PUT',
      body: JSON.stringify(log),
    });
  }

  getGroups() {
    return this.request('/v1/groups');
  }
}
