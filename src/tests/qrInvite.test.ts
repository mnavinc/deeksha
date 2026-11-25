import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSannidhanamInviteUrl, parseSannidhanamInvitePayload } from '../engines/qrInviteEngine';
import { DEVOTIONAL_REELS } from '../data/devotionalReels';
import { calculateSunTimes, getTimelyDeekshaAlert } from '../utils/solarTimes';
import { computeMalaStartDate, resolveDeekshaDuration } from '../engines/deekshaEngine';

describe('QR Sannidhanam Invite Engine & Viral Reels', () => {
  it('builds a zero-PII invite URL and parses sannidhanamId, referrerId, and eventTag', () => {
    const url = buildSannidhanamInviteUrl({
      sannidhanamId: 'san-108',
      sannidhanamName: 'Sabarimala Seva',
      season: 'Mandala 2026',
      referrerId: 'usr-guru-1',
      eventTag: 'qr_sannidhanam_invite',
      trackingId: 'trk_test_108',
    });

    assert.match(url, /^https:\/\/deeksha-sigma\.vercel\.app\/invite\?/);
    assert.ok(!url.includes('@'), 'QR URL must not contain email PII');

    const parsed = parseSannidhanamInvitePayload(url);
    assert.ok(parsed);
    assert.equal(parsed.sannidhanamId, 'san-108');
    assert.equal(parsed.sannidhanamName, 'Sabarimala Seva');
    assert.equal(parsed.season, 'Mandala 2026');
    assert.equal(parsed.referrerId, 'usr-guru-1');
    assert.equal(parsed.eventTag, 'qr_sannidhanam_invite');
    assert.equal(parsed.trackingId, 'trk_test_108');
  });

  it('returns null for invalid or empty QR payloads', () => {
    assert.equal(parseSannidhanamInvitePayload(''), null);
    assert.equal(parseSannidhanamInvitePayload('https://example.com/no-params'), null);
  });

  it('provides bilingual devotional reels with Instagram and YouTube Shorts links', () => {
    assert.ok(DEVOTIONAL_REELS.length >= 6);
    for (const reel of DEVOTIONAL_REELS) {
      assert.ok(reel.titleEn.length > 0);
      assert.ok(reel.titleTe.length > 0);
      assert.match(reel.instagramUrl, /^https:\/\/www\.instagram\.com\//);
      assert.match(reel.youtubeShortsUrl, /^https:\/\/www\.youtube\.com\//);
    }
  });

  it('computes daily sunrise and sunset times and builds timely profile-completion alerts', () => {
    const sun = calculateSunTimes(new Date('2026-11-13T12:00:00+05:30'));
    assert.match(sun.sunrise, /^\d{2}:\d{2} AM$/);
    assert.match(sun.sunset, /^\d{2}:\d{2} PM$/);

    const pendingAlert = getTimelyDeekshaAlert(new Date('2026-11-13T12:00:00+05:30'), sun, true, 'en');
    assert.equal(pendingAlert.urgency, 'warning');
    assert.ok(pendingAlert.body.includes(sun.sunrise));
    assert.ok(pendingAlert.body.includes(sun.sunset));
  });

  it('computes mala start date for existing and upcoming malas and resolves duration by Kanni status', () => {
    const ref = new Date('2026-11-23T10:00:00Z');
    assert.equal(
      computeMalaStartDate({ malaStatus: 'existing', completedDays: 10, referenceDate: ref }),
      '2026-11-13'
    );
    assert.equal(
      computeMalaStartDate({ malaStatus: 'upcoming', plannedStartDate: '2026-12-01', referenceDate: ref }),
      '2026-12-01'
    );
    assert.equal(resolveDeekshaDuration(1, 21), 41);
    assert.equal(resolveDeekshaDuration(2, 21), 21);
    assert.equal(resolveDeekshaDuration(3, 11), 11);
  });
});

