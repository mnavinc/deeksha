export interface SannidhanamInviteData {
  sannidhanamId: string;
  sannidhanamName: string;
  season: string;
  referrerId: string;
  eventTag: string;
  trackingId?: string;
}

const BASE_INVITE_URL = 'https://deeksha-sigma.vercel.app/invite';

/**
 * Build a privacy-safe, zero-PII invite URL for QR codes and social sharing.
 * Contains only opaque IDs, group name, season, trackingId, and event tracking tag (never email/phone).
 */
export function buildSannidhanamInviteUrl(data: {
  sannidhanamId: string;
  sannidhanamName: string;
  season: string;
  referrerId: string;
  eventTag?: string;
  trackingId?: string;
}): string {
  const params = new URLSearchParams({
    s: data.sannidhanamId.trim(),
    n: data.sannidhanamName.trim().slice(0, 50),
    se: data.season.trim().slice(0, 30),
    r: data.referrerId.trim().slice(0, 40),
    tag: (data.eventTag ?? 'qr_sannidhanam_invite').trim().slice(0, 40),
  });
  if (data.trackingId?.trim()) {
    params.set('tid', data.trackingId.trim().slice(0, 40));
  }
  return `${BASE_INVITE_URL}?${params.toString()}`;
}

/**
 * Parse a scanned QR URL, deep link (`deekshajourney://invite?...`), or query string
 * into safe SannidhanamInviteData. Returns null if invalid or missing sannidhanamId.
 */
export function parseSannidhanamInvitePayload(rawInput: string): SannidhanamInviteData | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  try {
    let queryPart = trimmed;
    if (trimmed.includes('?')) {
      queryPart = trimmed.slice(trimmed.indexOf('?') + 1);
    }
    const params = new URLSearchParams(queryPart);
    const sannidhanamId = params.get('s')?.trim();
    if (!sannidhanamId) return null;

    const trackingId = params.get('tid')?.trim();

    return {
      sannidhanamId,
      sannidhanamName: params.get('n')?.trim() || 'Sri Ayyappa Sannidhanam',
      season: params.get('se')?.trim() || 'Mandala-Makaravilakku',
      referrerId: params.get('r')?.trim() || 'guru-swami',
      eventTag: params.get('tag')?.trim() || 'qr_sannidhanam_invite',
      ...(trackingId ? { trackingId } : {}),
    };
  } catch {
    return null;
  }
}

