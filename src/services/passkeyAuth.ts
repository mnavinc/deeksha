import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const NATIVE_PASSKEY_REDIRECT = 'deekshajourney://auth';

export interface AuthSessionResponse {
  ok: boolean;
  token: string;
  provider?: string;
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    name: string;
    createdAt?: string;
  };
}

export function isAppleDevice(): boolean {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
  }
  return false;
}

export function isWebPasskeySupported(): boolean {
  if (Platform.OS !== 'web') return true; // Native Android/iOS uses Chrome Custom Tab / ASWebAuthenticationSession handoff
  return browserSupportsWebAuthn();
}

async function openNativePasskeyHandoff(params: {
  mode: 'register' | 'login';
  displayName?: string;
  email?: string;
  phone?: string;
}): Promise<AuthSessionResponse> {
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(API_URL)) {
    throw new Error(
      'Set EXPO_PUBLIC_API_URL to your HTTPS backend URL (WebAuthn Passkeys cannot run against localhost on a phone).'
    );
  }
  const qs = new URLSearchParams({
    mode: params.mode,
    redirectUri: NATIVE_PASSKEY_REDIRECT,
    ...(params.displayName ? { displayName: params.displayName } : {}),
    ...(params.email ? { email: params.email } : {}),
    ...(params.phone ? { phone: params.phone } : {}),
  });
  const url = `${API_URL}/v1/auth/passkey/web?${qs.toString()}`;
  const result = await WebBrowser.openAuthSessionAsync(url, NATIVE_PASSKEY_REDIRECT);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Passkey authentication was cancelled.');
  }
  const queryPart = result.url.includes('?') ? result.url.split('?')[1] : '';
  const returned = new URLSearchParams(queryPart);
  const token = returned.get('token');
  const id = returned.get('id');
  if (!token || !id) {
    throw new Error('Passkey handoff did not return a valid session token.');
  }
  return {
    ok: true,
    token,
    provider: 'passkey',
    user: {
      id,
      name: returned.get('name') || 'Swami',
      email: returned.get('email') || null,
      phone: returned.get('phone') || null,
    },
  };
}

export async function loginWithPasskey(): Promise<AuthSessionResponse> {
  if (Platform.OS !== 'web') {
    return openNativePasskeyHandoff({ mode: 'login' });
  }
  if (!browserSupportsWebAuthn()) {
    throw new Error('This browser does not support WebAuthn Passkeys.');
  }

  const optRes = await fetch(`${API_URL}/v1/auth/passkey/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const optionsJSON = await optRes.json();
  if (!optRes.ok) {
    throw new Error(optionsJSON?.message ?? 'Failed to start passkey login.');
  }

  const assertion = await startAuthentication({ optionsJSON });

  const verifyRes = await fetch(`${API_URL}/v1/auth/passkey/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challenge: optionsJSON.challenge,
      response: assertion,
    }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(data?.message ?? 'Passkey login verification failed.');
  }
  return data as AuthSessionResponse;
}

export async function registerWithPasskey(params: {
  displayName: string;
  email?: string;
  phone?: string;
  authToken?: string | null;
}): Promise<AuthSessionResponse> {
  if (Platform.OS !== 'web') {
    return openNativePasskeyHandoff({
      mode: 'register',
      displayName: params.displayName,
      email: params.email,
      phone: params.phone,
    });
  }
  if (!browserSupportsWebAuthn()) {
    throw new Error('This browser does not support WebAuthn Passkeys.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.authToken) {
    headers.Authorization = `Bearer ${params.authToken}`;
  }

  const optRes = await fetch(`${API_URL}/v1/auth/passkey/register/options`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      displayName: params.displayName,
      ...(params.email ? { email: params.email } : {}),
      ...(params.phone ? { phone: params.phone } : {}),
    }),
  });
  const optionsJSON = await optRes.json();
  if (!optRes.ok) {
    throw new Error(optionsJSON?.message ?? 'Failed to create passkey options.');
  }

  const attestation = await startRegistration({ optionsJSON });

  const verifyRes = await fetch(`${API_URL}/v1/auth/passkey/register/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      challenge: optionsJSON.challenge,
      response: attestation,
    }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(data?.message ?? 'Passkey registration verification failed.');
  }
  return data as AuthSessionResponse;
}

export async function loginWithGoogleIdToken(idToken: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_URL}/v1/auth/oauth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? 'Google Sign-In verification failed.');
  }
  return data as AuthSessionResponse;
}

export async function loginWithAppleIdentityToken(params: {
  identityToken: string;
  fullName?: string;
  email?: string;
}): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_URL}/v1/auth/oauth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? 'Apple Sign-In verification failed.');
  }
  return data as AuthSessionResponse;
}

export async function syncProfileContactInfo(
  authToken: string,
  payload: {
    displayName: string;
    language: 'en' | 'te' | 'ml';
    email?: string | null;
    phone?: string | null;
    newsletterSubscribed?: boolean;
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/v1/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
