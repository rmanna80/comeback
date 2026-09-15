import { useEffect, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOAL_TEMPLATES } from '../data/phases';
import { pickQuote } from '../data/quotes';
import { cancelTonightNudge } from '../notifications';
import { colors, lanes } from '../theme';

const dayKey = () => new Date().toISOString().slice(0, 10);
const LANE_IDS = ['rehab', 'gym', 'technical'];

export default function TodayScreen({ profile }) {
  const templateGoals = useMemo(
    () =>
      (GOAL_TEMPLATES[profile.phase] || []).map((g, i) => ({
        ...g,
        id: `${profile.phase}-${i}`,
      })),
    [profile.phase]
  );

  const [goals, setGoals] = useState(templateGoals);
  const [isCustom, setIsCustom] = useState(false);
  const [done, setDone] = useState({});
  const [streak, setStreak] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLane, setNewLane] = useState('technical');
  const [checkins, setCheckins] = useState({});
  const [noteDraft, setNoteDraft] = useState('');

  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(profile.injuryDate)) / 86400000)
  );
  const quote = pickQuote(profile.injury, profile.sport, daysSince);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      const custom = await AsyncStorage.getItem('customGoals');
      if (custom) {
        setGoals(JSON.parse(custom));
        setIsCustom(true);
      } else {
        setGoals(templateGoals);
        setIsCustom(false);
      }
      const raw = await AsyncStorage.getItem('completions');
      const all = raw ? JSON.parse(raw) : {};
      setDone(all[dayKey()] || {});
      const s = await AsyncStorage.getItem('streak');
      if (s) {
        const { count, lastDay } = JSON.parse(s);
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        setStreak(lastDay === dayKey() || lastDay === yesterday ? count : 0);
      }
      const cRaw = await AsyncStorage.getItem('checkins');
      const c = cRaw ? JSON.parse(cRaw) : {};
      setCheckins(c);
      setNoteDraft(c[dayKey()]?.note || '');
    })();
  }, [templateGoals, isFocused]);

  const keyDaysAgo = (n) =>
    new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

  const saveCheckin = async (rating) => {
    const key = dayKey();
    const next = {
      ...checkins,
      [key]: { ...(checkins[key] || {}), rating },
    };
    setCheckins(next);
    await AsyncStorage.setItem('checkins', JSON.stringify(next));
  };

  const saveNote = async () => {
    const key = dayKey();
    if (!checkins[key]) return;
    const next = {
      ...checkins,
      [key]: { ...checkins[key], note: noteDraft.trim() },
    };
    setCheckins(next);
    await AsyncStorage.setItem('checkins', JSON.stringify(next));
  };

  const persistGoals = async (list) => {
    setGoals(list);
    setIsCustom(true);
    await AsyncStorage.setItem('customGoals', JSON.stringify(list));
  };

  const addGoal = () => {
    if (!newTitle.trim()) return;
    persistGoals([
      ...goals,
      { id: `c-${Date.now()}`, lane: newLane, title: newTitle.trim() },
    ]);
    setNewTitle('');
  };

  const deleteGoal = (id) => persistGoals(goals.filter((g) => g.id !== id));

  const resetToTemplate = async () => {
    await AsyncStorage.removeItem('customGoals');
    setGoals(templateGoals);
    setIsCustom(false);
    setEditMode(false);
  };

  const toggle = async (id) => {
    if (editMode) return;
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    const raw = await AsyncStorage.getItem('completions');
    const all = raw ? JSON.parse(raw) : {};
    all[dayKey()] = next;
    await AsyncStorage.setItem('completions', JSON.stringify(all));

    const logRaw = await AsyncStorage.getItem('dayLog');
    const log = logRaw ? JSON.parse(logRaw) : {};
    log[dayKey()] = {
      done: goals.filter((g) => next[g.id]).length,
      total: goals.length,
    };
    await AsyncStorage.setItem('dayLog', JSON.stringify(log));

    const allDone = goals.length > 0 && goals.every((g) => next[g.id]);
    if (allDone) {
      cancelTonightNudge(dayKey());
      const s = await AsyncStorage.getItem('streak');
      const prev = s ? JSON.parse(s) : { count: 0, lastDay: null };
      if (prev.lastDay !== dayKey()) {
        const updated = { count: prev.count + 1, lastDay: dayKey() };
        await AsyncStorage.setItem('streak', JSON.stringify(updated));
        setStreak(updated.count);
        const bRaw = await AsyncStorage.getItem('bestStreak');
        const best = bRaw ? Number(bRaw) : 0;
        if (updated.count > best) {
          await AsyncStorage.setItem('bestStreak', String(updated.count));
        }
      }
    }
  };

  const doneCount = goals.filter((g) => done[g.id]).length;
  const pct = goals.length ? doneCount / goals.length : 0;
  const byLane = LANE_IDS.map((l) => ({
    lane: l,
    items: goals.filter((g) => g.lane === l),
  })).filter((x) => x.items.length || editMode);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long', month: 'short', day: 'numeric',
            })}
          </Text>
          <Text style={styles.title}>Day {daysSince} of the comeback</Text>
        </View>
        <Pressable
          onPress={() => setEditMode(!editMode)}
          style={[styles.editBtn, editMode && styles.editBtnOn]}
          hitSlop={6}
        >
          <Text style={[styles.editBtnText, editMode && styles.editBtnTextOn]}>
            {editMode ? 'Done' : 'Edit'}
          </Text>
        </Pressable>
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
        {isCustom ? ' · your program' : ' · starter template'}
      </Text>

      {checkins[keyDaysAgo(1)]?.rating <= 2 &&
      checkins[keyDaysAgo(2)]?.rating <= 2 ? (
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>Two rough days logged</Text>
          <Text style={styles.adviceText}>
            Recovery is training too. Consider swapping today's field work
            for recovery volume — bike, mobility, light touches. If it
            keeps up, loop in your PT.
          </Text>
        </View>
      ) : null}

      {byLane.map(({ lane, items }) => (
        <View key={lane} style={{ marginTop: 18 }}>
          <Text style={[styles.laneLabel, { color: lanes[lane].color }]}>
            {lanes[lane].label}
          </Text>
          {items.map((g) => (
            <Pressable key={g.id} onPress={() => toggle(g.id)} style={styles.goal}>
              {editMode ? (
                <Pressable onPress={() => deleteGoal(g.id)} hitSlop={8}>
                  <Text style={styles.deleteMark}>✕</Text>
                </Pressable>
              ) : (
                <View style={[styles.check, done[g.id] && styles.checkOn]}>
                  {done[g.id] ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              )}
              <Text
                style={[
                  styles.goalText,
                  !editMode && done[g.id] && styles.goalTextDone,
                ]}
              >
                {g.title}
              </Text>
            </Pressable>
          ))}
          {editMode && !items.length ? (
            <Text style={styles.emptyLane}>No goals here yet — add one below</Text>
          ) : null}
        </View>
      ))}

      {editMode ? (
        <View style={styles.addBox}>
          <Text style={styles.addLabel}>Add a goal</Text>
          <View style={styles.laneChips}>
            {LANE_IDS.map((l) => (
              <Pressable
                key={l}
                onPress={() => setNewLane(l)}
                style={[
                  styles.laneChip,
                  newLane === l && {
                    backgroundColor: lanes[l].soft,
                    borderColor: lanes[l].color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.laneChipText,
                    newLane === l && { color: lanes[l].color, fontWeight: '700' },
                  ]}
                >
                  {lanes[l].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="e.g. 5-10-5 shuttle × 6, under 5.2s"
              placeholderTextColor={colors.inkFaint}
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={addGoal}
              returnKeyType="done"
            />
            <Pressable onPress={addGoal} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
          <Pressable onPress={resetToTemplate}>
            <Text style={styles.resetTemplate}>
              Reset to the {profile.phase} phase template
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.checkinCard}>
        <Text style={styles.checkinTitle}>How did it feel today?</Text>
        <Text style={styles.checkinSub}>1 = rough · 5 = strong</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = checkins[dayKey()]?.rating === n;
            return (
              <Pressable
                key={n}
                onPress={() => saveCheckin(n)}
                style={[styles.ratingDot, selected && styles.ratingDotOn]}
              >
                <Text
                  style={[styles.ratingNum, selected && styles.ratingNumOn]}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {checkins[dayKey()]?.rating ? (
          <>
            {checkins[dayKey()].rating <= 2 ? (
              <Text style={styles.checkinLow}>
                Rough one. A lighter day keeps the comeback on schedule —
                mention it to your PT if it lingers.
              </Text>
            ) : null}
            <TextInput
              style={styles.noteInput}
              placeholder="Optional: what stood out? (swelling, felt fast…)"
              placeholderTextColor={colors.inkFaint}
              value={noteDraft}
              onChangeText={setNoteDraft}
              onEndEditing={saveNote}
              multiline
            />
          </>
        ) : null}
        <View style={styles.weekRow}>
          {[6, 5, 4, 3, 2, 1, 0].map((n) => {
            const r = checkins[keyDaysAgo(n)]?.rating;
            return (
              <View
                key={n}
                style={[
                  styles.weekDot,
                  r >= 4 && { backgroundColor: colors.pitch, borderColor: colors.pitch },
                  r === 3 && { backgroundColor: colors.pitchSoft, borderColor: colors.pitchSoft },
                  r <= 2 && r > 0 && { backgroundColor: colors.emberSoft, borderColor: colors.ember },
                ]}
              />
            );
          })}
          <Text style={styles.weekLabel}>last 7 days</Text>
        </View>
      </View>

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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  date: { color: colors.inkSoft, fontSize: 13 },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 2 },
  editBtn: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card,
  },
  editBtnOn: { backgroundColor: colors.pitch, borderColor: colors.pitch },
  editBtnText: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  editBtnTextOn: { color: '#fff' },
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
  deleteMark: { color: colors.ember, fontSize: 16, fontWeight: '700', width: 22, textAlign: 'center' },
  goalText: { color: colors.ink, fontSize: 15, flex: 1 },
  goalTextDone: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  emptyLane: { color: colors.inkFaint, fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
  addBox: {
    marginTop: 20, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.line, padding: 14,
  },
  addLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  laneChips: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  laneChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  laneChipText: { color: colors.inkSoft, fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.ember, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  resetTemplate: { color: colors.inkFaint, fontSize: 12, marginTop: 12, textAlign: 'center' },
  adviceCard: {
    marginTop: 14, backgroundColor: colors.emberSoft,
    borderRadius: 12, padding: 14,
  },
  adviceTitle: { color: colors.ember, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  adviceText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  checkinCard: {
    marginTop: 24, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.line, padding: 16,
  },
  checkinTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  checkinSub: { color: colors.inkFaint, fontSize: 12, marginTop: 2, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  ratingDot: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
    borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  ratingDotOn: { backgroundColor: colors.pitch, borderColor: colors.pitch },
  ratingNum: { color: colors.inkSoft, fontSize: 16, fontWeight: '700' },
  ratingNumOn: { color: '#fff' },
  checkinLow: {
    color: colors.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 12,
  },
  noteInput: {
    marginTop: 12, backgroundColor: colors.bg, borderWidth: 1,
    borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: colors.ink, minHeight: 44,
  },
  weekRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
  },
  weekDot: {
    width: 14, height: 14, borderRadius: 5,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg,
  },
  weekLabel: { color: colors.inkFaint, fontSize: 11, marginLeft: 6 },
  quoteCard: {
    marginTop: 24, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.line, padding: 16,
  },
  quoteKicker: { color: colors.ember, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  quoteText: { color: colors.ink, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  quoteWho: { color: colors.inkSoft, fontSize: 13, marginTop: 8 },
});
