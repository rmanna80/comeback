# v0.3 update — notifications

## 1. Install (inside comeback folder)

npx expo install expo-notifications

## 2. Replace / add these files

- App.js               (replace)
- notifications.js     (NEW - goes in the root, next to App.js)
- screens/TodayScreen.js (replace)

## 3. Restart

npx expo start -c

Allow notifications when the app asks. You'll get:
- 8:00 AM - day count + a quote matched to your injury/sport
- 7:00 PM - a nudge, but ONLY if today's goals aren't all done
  (finishing your list cancels tonight's nudge - you earned quiet)

Times are hardcoded for now (notifications.js, setHours lines)
- change them there if you want different times.
