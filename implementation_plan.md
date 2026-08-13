# Revised Implementation Plan — All Feedback Incorporated

## Summary of Changes
1. **Full Telugu i18n** on every screen, every string
2. **Language persists on re-login** + auto-detect from device locale (Telugu/English)
3. **Splash screen greeting** based on active Deeksha + language (e.g. "స్వామియే శరణం అయ్యప్ప" for Ayyappa in Telugu)
4. **Google Login** option on profile/onboarding screen
5. **Beautiful game-board Journey Map** — full-page winding path (like reference), toggle Timeline ↔ Map view
6. **react-native-maps MapView** in Temples tab (requires native build)
7. **Expo Go fix** — build Android dev client on Windows via `npx expo run:android`
8. **UI Refinement** — premium design across all screens, responsive, accessible

---

## Expo Go — Android Dev Client on Windows
Since Expo SDK 57 + Reanimated 4 are not supported in stock Expo Go, the correct approach on Windows is:
- Install Android Studio + Android SDK
- Run `npx expo run:android` — builds a custom dev client APK and installs it directly to device/emulator
- For iOS: Use **EAS Build** (`npx eas build --profile development --platform ios`) — builds in cloud, no Mac needed

---

## Phase 1 — i18n Expansion

### [MODIFY] `src/i18n/index.ts`
Add 30+ new keys covering all hardcoded strings.

---

## Phase 2 — Store & Hydration

### [MODIFY] `src/store/useAppStore.ts`
Export useHasHydrated() hook.

---

## Phase 3 — Splash + Device Language Detection

### [MODIFY] `app/index.tsx`
- Wait for store hydration
- Auto-detect device language (Telugu/English)
- Show deeksha-specific saranam greeting

---

## Phase 4 — Google Login
### [MODIFY] `app/onboarding/profile.tsx`

---

## Phase 5 — Full Telugu All Screens

---

## Phase 6 — Journey Map Redesign (Game-board style)

---

## Phase 7 — MapView in Temples Tab

---

## Phase 8 — UI Refinement
