import Constants from 'expo-constants';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined);

export class ApiClient {
  constructor(private readonly accessToken: string) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!baseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured.');
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.accessToken}`, ...init.headers },
    });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return response.json() as Promise<T>;
  }

  saveDailyLog(enrollmentId: string, log: unknown) {
    return this.request(`/v1/enrollments/${enrollmentId}/logs`, { method: 'PUT', body: JSON.stringify(log) });
  }
}
