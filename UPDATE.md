# v0.2 update — Tracker screen + tab navigation

## 1. Install navigation (PowerShell, inside comeback folder)

npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens

## 2. Replace / add these files in your comeback folder

- App.js                      (replace)
- screens/OnboardingScreen.js (replace)
- screens/TrackerScreen.js    (NEW)
- data/phases.js              (replace)
- data/milestones.js          (NEW)

## 3. Restart

npx expo start -c

## 4. One-time: tap "Reset profile" on the Today screen

The profile now stores your custom injury name and PT notes, so
re-run onboarding once. Enter ~240 days (8 months) and pick
"Return to ball" or "Full training" to get field-phase goals.
