/**
 * solarTimes.ts — Daily Sunrise & Sunset calculation + timely Deeksha alerts.
 * Defaults to Sabarimala Sannidhanam coordinates (9.4321° N, 77.0839° E, IST +05:30).
 */

export interface SunTimes {
  sunrise: string;
  sunset: string;
  sunriseMinutes: number;
  sunsetMinutes: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function formatMinutes(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * Calculate approximate local sunrise and sunset using NOAA solar equations.
 */
export function calculateSunTimes(
  date: Date = new Date(),
  latitude = 9.4321,
  longitude = 77.0839,
  tzOffsetMinutes = 330
): SunTimes {
  const dayOfYear = getDayOfYear(date);
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = toRad(latitude);
  const zenithRad = toRad(90.833);
  const cosHa =
    Math.cos(zenithRad) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);

  const clampedCosHa = Math.max(-1, Math.min(1, cosHa));
  const haDeg = toDeg(Math.acos(clampedCosHa));

  const sunriseMinutes = 720 - 4 * (longitude + haDeg) - eqTime + tzOffsetMinutes;
  const sunsetMinutes = 720 - 4 * (longitude - haDeg) - eqTime + tzOffsetMinutes;

  return {
    sunrise: formatMinutes(sunriseMinutes),
    sunset: formatMinutes(sunsetMinutes),
    sunriseMinutes: Math.round(sunriseMinutes),
    sunsetMinutes: Math.round(sunsetMinutes),
  };
}

export interface TimelyAlert {
  id: string;
  title: string;
  body: string;
  urgency: 'info' | 'warning';
}

export function getTimelyDeekshaAlert(
  now: Date = new Date(),
  sunTimes: SunTimes = calculateSunTimes(now),
  needsProfileCompletion = false,
  language: 'en' | 'te' | 'ml' = 'en'
): TimelyAlert {
  const isTe = language === 'te';
  if (needsProfileCompletion) {
    return {
      id: 'profile-incomplete',
      title: isTe ? 'ప్రొఫైల్ పూర్తి చేసి +50 పాయింట్లు పొందండి' : 'Complete Profile for +50 Points',
      body: isTe
        ? `పేరు & ఫోన్ నంబర్ జోడించి సన్నిధానం పోస్టింగ్ అన్‌లాక్ చేయండి. నేటి సూర్యోదయం ${sunTimes.sunrise} · సూర్యాస్తమయం ${sunTimes.sunset}`
        : `Add Name & Phone to claim points & unlock Sannidhanam posting. Today: Sunrise ${sunTimes.sunrise} · Sunset ${sunTimes.sunset}`,
      urgency: 'warning',
    };
  }

  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < sunTimes.sunriseMinutes + 60) {
    return {
      id: 'morning-sandhya',
      title: isTe ? `ఉదయ సంధ్య & స్నానం · సూర్యోదయం ${sunTimes.sunrise}` : `Morning Snanam & Pooja · Sunrise ${sunTimes.sunrise}`,
      body: isTe
        ? `ఈరోజు సూర్యోదయం ${sunTimes.sunrise}, సూర్యాస్తమయం ${sunTimes.sunset}. స్వామియే శరణం అయ్యప్ప!`
        : `Today's Sunrise ${sunTimes.sunrise} · Sunset ${sunTimes.sunset}. Complete morning Niyamas before sunrise.`,
      urgency: 'info',
    };
  }

  if (mins >= sunTimes.sunsetMinutes - 45 && mins <= sunTimes.sunsetMinutes + 90) {
    return {
      id: 'evening-sandhya',
      title: isTe ? `సాయంత్రం దీపారాధన · సూర్యాస్తమయం ${sunTimes.sunset}` : `Evening Deeparadhana · Sunset ${sunTimes.sunset}`,
      body: isTe
        ? `సూర్యాస్తమయం ${sunTimes.sunset}. సాయంత్రం పూజ & హరివరాసనం పఠించండి.`
        : `Sunset at ${sunTimes.sunset}. Time for evening Pooja, Sharanu Gosha & daily check-in.`,
      urgency: 'info',
    };
  }

  return {
    id: 'daily-sandhya',
    title: isTe ? `నేటి సూర్యోదయం ${sunTimes.sunrise} · సూర్యాస్తమయం ${sunTimes.sunset}` : `Sunrise ${sunTimes.sunrise} · Sunset ${sunTimes.sunset}`,
    body: isTe
      ? '7:00 PM లోపు నేటి దీక్ష నియమాలను చెక్-ఇన్ చేయండి.'
      : 'Stay aligned with Sandhya timings and complete your 7:00 PM Deeksha check-in.',
    urgency: 'info',
  };
}

