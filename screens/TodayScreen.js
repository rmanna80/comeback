import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOAL_TEMPLATES } from '../data/phases';
import { pickQuote } from '../data/quotes';
import { colors, lanes } from '../theme';

const dayKey = () => new Date().toISOString().slice(0, 10);

export default function TodayScreen({ profile, onReset }) {
  const goals = useMemo(
    () => (GOAL_TEMPLATES[profile.phase] || []).map((g, i) => ({ ...g, id: `${profile.phase}-${i}` })),
    [profile.phase]
  );
  const [done, setDone] = useState({});
  const [streak, setStreak] = useState(0);

  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(profile.injuryDate)) / 86400000)
  );
  const quote = pickQuote(profile.injury, profile.sport, daysSince);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('completions');
      const all = raw ? JSON.parse(raw) : {};
      setDone(all[dayKey()] || {});
      const s = await AsyncStorage.getItem('streak');
      if (s) {
        const { count, lastDay } = JSON.parse(s);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        setStreak(lastDay === dayKey() || lastDay === yesterday ? count : 0);
      }
    })();
  }, []);

  const toggle = async (id) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    const raw = await AsyncStorage.getItem('completions');
    const all = raw ? JSON.parse(raw) : {};
    all[dayKey()] = next;
    await AsyncStorage.setItem('completions', JSON.stringify(all));

    const allDone = goals.every((g) => next[g.id]);
    if (allDone) {
      const s = await AsyncStorage.getItem('streak');
      const prev = s ? JSON.parse(s) : { count: 0, lastDay: null };
      if (prev.lastDay !== dayKey()) {
        const updated = { count: prev.count + 1, lastDay: dayKey() };
        await AsyncStorage.setItem('streak', JSON.stringify(updated));
        setStreak(updated.count);
      }
    }
  };

  const doneCount = goals.filter((g) => done[g.id]).length;
  const pct = goals.length ? doneCount / goals.length : 0;
  const byLane = ['rehab', 'gym', 'technical']
    .map((l) => ({ lane: l, items: goals.filter((g) => g.lane === l) }))
    .filter((x) => x.items.length);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.title}>Day {daysSince} of the comeback</Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>streak</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {doneCount} of {goals.length} goals done today
      </Text>

      {byLane.map(({ lane, items }) => (
        <View key={lane} style={{ marginTop: 18 }}>
          <Text style={[styles.laneLabel, { color: lanes[lane].color }]}>
            {lanes[lane].label}
          </Text>
          {items.map((g) => (
            <Pressable key={g.id} onPress={() => toggle(g.id)} style={styles.goal}>
              <View style={[styles.check, done[g.id] && styles.checkOn]}>
                {done[g.id] ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={[styles.goalText, done[g.id] && styles.goalTextDone]}>
                {g.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable
        style={styles.quoteCard}
        onPress={() => quote.url && Linking.openURL(quote.url)}
      >
        <Text style={styles.quoteKicker}>Today's fuel</Text>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteWho}>
          — {quote.who}{quote.url ? '  ↗' : ''}
        </Text>
      </Pressable>

      <Pressable onPress={onReset} style={{ marginTop: 24, marginBottom: 40 }}>
        <Text style={styles.reset}>Reset profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  date: { color: colors.inkSoft, fontSize: 13 },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 2 },
  streak: {
    backgroundColor: colors.emberSoft, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  streakNum: { color: colors.ember, fontSize: 20, fontWeight: '800' },
  streakLabel: { color: colors.ember, fontSize: 11 },
  track: { height: 6, backgroundColor: colors.line, borderRadius: 3 },
  fill: { height: 6, backgroundColor: colors.pitch, borderRadius: 3 },
  progressText: { color: colors.inkFaint, fontSize: 12, marginTop: 6 },
  laneLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  goal: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
  },
  check: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.inkFaint, alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.done, borderColor: colors.done },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  goalText: { color: colors.ink, fontSize: 15, flex: 1 },
  goalTextDone: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  quoteCard: {
    marginTop: 24, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.line, padding: 16,
  },
  quoteKicker: { color: colors.ember, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  quoteText: { color: colors.ink, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  quoteWho: { color: colors.inkSoft, fontSize: 13, marginTop: 8 },
  reset: { color: colors.inkFaint, fontSize: 13, textAlign: 'center' },
});
