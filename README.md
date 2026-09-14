# Comeback — recovery app (v0.1, local only)

Onboarding + Today screen. No backend, everything stored on-device.

## Setup (Windows PowerShell)

1. Create a fresh Expo project (this generates correct current versions):

```powershell
npx create-expo-app@latest comeback --template blank
cd comeback
```

2. Install the one extra dependency:

```powershell
npx expo install @react-native-async-storage/async-storage
```

3. Copy these files from this folder into the project, replacing App.js:

```
App.js
theme.js
screens/OnboardingScreen.js
screens/TodayScreen.js
data/phases.js
data/quotes.js
```

4. Run it:

```powershell
npx expo start
```

Install **Expo Go** on your phone, scan the QR code, and you're in.

## What's in v0.1

- Onboarding: injury type, sport, days since injury, rehab phase
- Today screen: goals in three lanes (rehab / gym / technical) driven by phase
- Progress bar + streak counter (streak only counts full days — all goals done)
- Daily quote matched to your injury + sport, pro quotes link out to video
- Everything persists via AsyncStorage; "Reset profile" wipes it

## Next up (build order)

1. Comeback tracker screen (milestones + pre-injury benchmarks)
2. Custom goals (add/edit your physio's actual program)
3. Push notifications for quotes (expo-notifications)
4. Backend + accounts (Supabase)
5. Community stories
6. Lock screen widgets (native modules — last)
