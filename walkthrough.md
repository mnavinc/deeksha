# Walkthrough — Telugu i18n + Language Persistence + Journey Map Redesign

## What Was Built

### 1. 🌐 Full Telugu (i18n) — Every Screen

**60+ translation keys** added to [`src/i18n/index.ts`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/i18n/index.ts) covering:

| Screen | Keys Added |
|--------|-----------|
| Splash | Deeksha greeting, subtitle |
| Onboarding | What to call you, Google sign-in, continue, features list |
| Deeksha Select | Which deeksha, duration, confirm with temple |
| Setup | Pilgrimage number, duration, center, start deeksha |
| Home Tab | Day/days/today/points/members/group expenses/days remaining |
| Journey Tab | Trail title, view toggle, official/traditional labels, locked/unlocked |
| Temples Tab | Discover temples, nearby, get directions, no temples found |
| Groups Tab | Create circle, add member, guru, nominate, approved, mark paid, split costs |
| Community Tab | Community, recommended, reminders, guide not assigned |
| Profile Tab | Language, active deeksha, history, completed, begin journey |
| DailyChecklist | All 8 daily checkpoint labels + chants count |

---

### 2. 🔄 Language Persists on Re-Login

**Problem**: Zustand's AsyncStorage hydration is async — old code routed before store loaded, so language appeared as default `'en'` on every app open.

**Fix** in [`useAppStore.ts`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/store/useAppStore.ts):
```typescript
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    // ...
  }, []);
  return hydrated;
}
```

**Splash screen** [`app/index.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/index.tsx) now waits for `hasHydrated === true` before routing → selected language is restored on every re-login.

---

### 3. 📱 Auto-Detect Device Language

On first launch (no profile), the app reads the phone's locale via `expo-localization`:
- Phone set to Telugu → app defaults to Telugu
- Phone set to English → app defaults to English

---

### 4. 🙏 Deeksha-Specific Saranam on Splash

Splash screen now shows the correct saranam in the user's language:

| Deeksha | Telugu | English |
|---------|--------|---------|
| Ayyappa | స్వామియే శరణం అయ్యప్ప | Swamiye Saranam Ayyappa |
| Bhavani | జై భవాని | Jai Bhavani |
| Govinda | గోవిందా గోవిందా | Govinda Govinda |
| Shiva | ఓం నమః శివాయ | Om Namah Shivaya |
| Hanuman | జై హనుమాన్ | Jai Hanuman |

---

### 5. 🔐 Google Login Option

[`app/onboarding/profile.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/onboarding/profile.tsx) now has:
- **Language toggle** at the top (Telugu/English) — pre-selected based on phone locale
- **"Sign in with Google"** button (stub — needs Google OAuth client ID in production)
- **Or continue with name** divider → name input

---

### 6. 🗺️ Game-Board Journey Map

[`src/components/JourneyTrailMap.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/components/JourneyTrailMap.tsx) completely rebuilt:
- **Winding golden dashed path** through a green forest landscape
- **Nature elements**: Trees, bushes, ponds rendered in SVG
- **15 checkpoint markers** along the path with icons
- **Progress highlighting** — completed path glows brighter gold
- **Start/Finish** labels (Mala Dharanam → Sabarimala)
- **Glow effect** on active checkpoint

[`app/(tabs)/journey.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/journey.tsx):
- **Map / Timeline toggle** at the top
- **Timeline view**: connector-line list with phase tags, unlock status, official/traditional badges
- **Both views** fully translated to Telugu

---

### 7. 🛕 MapView in Temples Tab

[`app/(tabs)/map.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/map.tsx):
- **List / Map toggle** — switch between temple list and Google Maps satellite view
- **MapView with Markers** for each temple (tap marker → callout → Get Directions)
- Locate button finds nearby temples and centers the map on user location
- Full Telugu/English i18n

> [!IMPORTANT]
> **MapView requires a native build** — it won't work in Expo Go. Run:
> ```
> npx expo run:android
> ```
> This requires Android Studio installed on Windows.

---

### 8. 📱 How to Preview

#### Option A — Expo Go (Web only, no MapView)
```bash
npx expo start --tunnel
# Scan QR with Expo Go app
# Note: react-native-maps won't work without native build
```

#### Option B — Android Dev Client (Full features including MapView)
```bash
# Requires Android Studio + Android SDK installed
npx expo run:android
# Installs custom dev APK directly to device/emulator
```

#### Option C — EAS Cloud Build for iOS (no Mac needed)
```bash
npm install -g eas-cli
eas login
eas build --profile development --platform ios
# Scan QR from EAS dashboard to install on iPhone
```

---

## Files Changed

| File | Change |
|------|--------|
| [`src/i18n/index.ts`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/i18n/index.ts) | 60+ new translation keys |
| [`src/store/useAppStore.ts`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/store/useAppStore.ts) | `useHasHydrated()` hook |
| [`src/components/JourneyTrailMap.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/components/JourneyTrailMap.tsx) | Full game-board map rebuild |
| [`src/components/DailyChecklist.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/src/components/DailyChecklist.tsx) | Telugu labels for all 8 checkpoints |
| [`app/index.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/index.tsx) | Hydration wait + deeksha greeting + animation |
| [`app/onboarding/profile.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/onboarding/profile.tsx) | Google login + language picker |
| [`app/onboarding/welcome.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/onboarding/welcome.tsx) | Full i18n |
| [`app/onboarding/deeksha-select.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/onboarding/deeksha-select.tsx) | Full i18n |
| [`app/onboarding/setup.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/onboarding/setup.tsx) | Full i18n |
| [`app/(tabs)/_layout.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/_layout.tsx) | All 6 tab titles in i18n |
| [`app/(tabs)/index.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/index.tsx) | Full i18n |
| [`app/(tabs)/journey.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/journey.tsx) | Map+Timeline toggle, full i18n |
| [`app/(tabs)/map.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/map.tsx) | MapView + list/map toggle + full i18n |
| [`app/(tabs)/groups.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/groups.tsx) | Full i18n |
| [`app/(tabs)/community.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/community.tsx) | Full i18n |
| [`app/(tabs)/profile.tsx`](file:///c:/Users/ncr3a/Projects/deeksha-journey/app/(tabs)/profile.tsx) | Full i18n + refined UI |
