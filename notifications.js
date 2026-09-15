import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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

// Schedules the next 7 days: a morning quote (8:00) and an evening
// nudge (19:00). Re-run on every app launch — it clears and
// reschedules so the quotes stay fresh and never duplicate.
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

    const daysSince = Math.max(
      0,
      Math.floor((Date.now() - new Date(profile.injuryDate)) / 86400000)
    );
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      const key = day.toISOString().slice(0, 10);

      const morning = new Date(day);
      morning.setHours(8, 0, 0, 0);
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

      const evening = new Date(day);
      evening.setHours(19, 0, 0, 0);
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
