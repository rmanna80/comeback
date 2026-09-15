import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickQuote } from './data/quotes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DATE_TYPE =
  Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date';

// Defaults used until the user changes them in Settings.
export const DEFAULT_NOTIF_SETTINGS = {
  morningEnabled: true,
  morningHour: 8,
  morningMinute: 0,
  eveningEnabled: true,
  eveningHour: 19,
  eveningMinute: 0,
};

export async function getNotifSettings() {
  try {
    const raw = await AsyncStorage.getItem('notifSettings');
    return raw
      ? { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(raw) }
      : { ...DEFAULT_NOTIF_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_NOTIF_SETTINGS };
  }
}

export async function saveNotifSettings(settings, profile) {
  await AsyncStorage.setItem('notifSettings', JSON.stringify(settings));
  if (profile) await initNotifications(profile);
}

// Schedules the next 7 days using the user's settings (or defaults).
// Re-run on every app launch and after settings changes — it clears
// and reschedules so nothing duplicates.
export async function initNotifications(profile) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('comeback', {
        name: 'Comeback reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const s = await getNotifSettings();
    const daysSince = Math.max(
      0,
      Math.floor((Date.now() - new Date(profile.injuryDate)) / 86400000)
    );
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const key = day.toISOString().slice(0, 10);

      if (s.morningEnabled) {
        const morning = new Date(day);
        morning.setHours(s.morningHour, s.morningMinute, 0, 0);
        if (morning > now) {
          const q = pickQuote(profile.injury, profile.sport, daysSince + i);
          await Notifications.scheduleNotificationAsync({
            identifier: `morning-${key}`,
            content: {
              title: `Day ${daysSince + i} of the comeback`,
              body: `"${q.text}" — ${q.who}`,
            },
            trigger: { type: DATE_TYPE, date: morning, channelId: 'comeback' },
          });
        }
      }

      if (s.eveningEnabled) {
        const evening = new Date(day);
        evening.setHours(s.eveningHour, s.eveningMinute, 0, 0);
        if (evening > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `evening-${key}`,
            content: {
              title: 'Boxes still open',
              body: 'Someone else is finishing their list right now. Close yours.',
            },
            trigger: { type: DATE_TYPE, date: evening, channelId: 'comeback' },
          });
        }
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Called when all of today's goals are done — you earned a quiet
// evening, so tonight's nudge gets cancelled.
export async function cancelTonightNudge(dateKey) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`evening-${dateKey}`);
  } catch (e) {}
}
