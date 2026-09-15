import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { milestonesFor, returnEstimateFor } from '../data/milestones';
import { computeBadges } from '../data/badges';
import { colors } from '../theme';

export default function TrackerScreen({ profile }) {
  const [unlocked, setUnlocked] = useState({});
  const [benchmarks, setBenchmarks] = useState([]);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [dayLog, setDayLog] = useState({});
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const isFocused = useIsFocused();
  const [bestStreak, setBestStreak] = useState(0);
  const [phaseHistory, setPhaseHistory] = useState([]);

  const milestones = milestonesFor(profile.injury);
  const estimate = returnEstimateFor(profile.injury);
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(profile.injuryDate)) / 86400000)
  );
  const pct = Math.min(1, daysSince / estimate);
  const pastEstimate = daysSince > estimate;
  const nextId = milestones.find((m) => !unlocked[m.id])?.id;
  const displayName = profile.injuryName || profile.injury;

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      const m = await AsyncStorage.getItem('milestones');
      if (m) setUnlocked(JSON.parse(m));
      const b = await AsyncStorage.getItem('benchmarks');
      if (b) setBenchmarks(JSON.parse(b));
      const l = await AsyncStorage.getItem('dayLog');
      const log = l ? JSON.parse(l) : {};
      const c = await AsyncStorage.getItem('completions');
      if (c) {
        const comps = JSON.parse(c);
        Object.keys(comps).forEach((k) => {
          if (!log[k]) {
            const anyDone = Object.values(comps[k]).some(Boolean);
            if (anyDone) log[k] = { done: 1, total: 2 };
          }
        });
      }
      setDayLog(log);
      const bs = await AsyncStorage.getItem('bestStreak');
      setBestStreak(bs ? Number(bs) : 0);
      const ph = await AsyncStorage.getItem('phaseHistory');
      setPhaseHistory(ph ? JSON.parse(ph) : []);
    })();
  }, [isFocused]);

  const monthDays = (() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    const count = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= count; d++) cells.push(new Date(year, month, d));
    return cells;
  })();

  const todayKey = new Date().toISOString().slice(0, 10);

  const dayStatus = (date) => {
    if (!date) return 'blank';
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (key > todayKey) return 'future';
    const entry = dayLog[key];
    if (!entry) return 'missed';
    if (entry.total > 0 && entry.done >= entry.total) return 'complete';
    if (entry.done > 0) return 'partial';
    return 'missed';
  };

  const shiftMonth = (delta) =>
    setMonthCursor(
      (m) => new Date(m.getFullYear(), m.getMonth() + delta, 1)
    );

  const toggleMilestone = async (id) => {
    const next = { ...unlocked };
    if (next[id]) delete next[id];
    else next[id] = new Date().toISOString();
    setUnlocked(next);
    await AsyncStorage.setItem('milestones', JSON.stringify(next));
  };

  const saveBenchmarks = async (list) => {
    setBenchmarks(list);
    await AsyncStorage.setItem('benchmarks', JSON.stringify(list));
  };

  const addBenchmark = () => {
    if (!newName.trim() || !newTarget.trim()) return;
    saveBenchmarks([
      ...benchmarks,
      {
        id: `${Date.now()}`,
        name: newName.trim(),
        target: parseFloat(newTarget) || 0,
        current: 0,
      },
    ]);
    setNewName('');
    setNewTarget('');
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditValue(b.current ? String(b.current) : '');
  };

  const saveEdit = () => {
    saveBenchmarks(
      benchmarks.map((b) =>
        b.id === editingId ? { ...b, current: parseFloat(editValue) || 0 } : b
      )
    );
    setEditingId(null);
    setEditValue('');
  };

  const removeBenchmark = (id) =>
    saveBenchmarks(benchmarks.filter((b) => b.id !== id));

  const dayOf = (iso) => {
    const d = Math.floor(
      (new Date(iso) - new Date(profile.injuryDate)) / 86400000
    );
    return `Day ${Math.max(0, d)}`;
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.kicker}>The comeback</Text>
      <Text style={styles.title}>
        Day {daysSince} · {displayName} · {profile.sport}
      </Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.trackLabels}>
        <Text style={styles.trackText}>Day {daysSince}</Text>
        <Text style={styles.trackText}>
          {pastEstimate
            ? 'Past projected return — now beat your old self'
            : `~${estimate - daysSince} days to projected return`}
        </Text>
      </View>

      {profile.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesKicker}>From your PT</Text>
          <Text style={styles.notesText}>{profile.notes}</Text>
        </View>
      ) : null}

      <Text style={[styles.section, { color: colors.pitch }]}>Milestones</Text>
      {milestones.map((m) => {
        const isDone = !!unlocked[m.id];
        const isNext = m.id === nextId;
        return (
          <Pressable
            key={m.id}
            onPress={() => toggleMilestone(m.id)}
            style={[styles.milestone, isNext && styles.milestoneNext]}
          >
            <View
              style={[
                styles.check,
                isDone && styles.checkOn,
                isNext && !isDone && styles.checkNext,
              ]}
            >
              {isDone ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text
              style={[
                styles.milestoneText,
                isDone && styles.milestoneDone,
                isNext && styles.milestoneNextText,
              ]}
            >
              {m.title}
            </Text>
            <Text style={styles.milestoneDate}>
              {isDone ? dayOf(unlocked[m.id]) : isNext ? 'up next' : ''}
            </Text>
          </Pressable>
        );
      })}

      <Text style={[styles.section, { color: colors.ember, marginTop: 24 }]}>
        Better than before
      </Text>
      <Text style={styles.sectionSub}>
        Your pre-injury numbers. Tap one to log where you are now — beat the
        number, own the comeback.
      </Text>

      {benchmarks.map((b) => {
        const beaten = b.current >= b.target && b.target > 0;
        const editing = editingId === b.id;
        return (
          <Pressable
            key={b.id}
            onPress={() => (editing ? null : startEdit(b))}
            style={[styles.bench, beaten && styles.benchBeaten]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.benchName, beaten && styles.benchNameBeaten]}>
                {b.name}
              </Text>
              <Text style={[styles.benchNums, beaten && styles.benchNumsBeaten]}>
                {beaten
                  ? `Beat it — ${b.current} (was ${b.target})`
                  : `Target ${b.target} · now ${b.current || '—'}`}
              </Text>
            </View>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="decimal-pad"
                  autoFocus
                  placeholder="now"
                  placeholderTextColor={colors.inkFaint}
                />
                <Pressable onPress={saveEdit} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => removeBenchmark(b.id)} hitSlop={8}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}

      <View style={styles.addRow}>
        <TextInput
          style={[styles.addInput, { flex: 2 }]}
          placeholder="Benchmark (squat lb, 20m sprint s…)"
          placeholderTextColor={colors.inkFaint}
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={[styles.addInput, { flex: 1 }]}
          placeholder="Target"
          placeholderTextColor={colors.inkFaint}
          keyboardType="decimal-pad"
          value={newTarget}
          onChangeText={setNewTarget}
        />
        <Pressable onPress={addBenchmark} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
      <Text style={[styles.section, { color: colors.ember, marginTop: 24 }]}>
        Trophy case
      </Text>
      {(() => {
        const { earned, locked } = computeBadges({
          unlockedMilestones: unlocked,
          milestones,
          bestStreak,
          benchmarks,
          phaseHistory,
          injuryDate: profile.injuryDate,
        });
        if (!earned.length && !locked.length) return null;
        return (
          <View style={styles.badgeGrid}>
            {earned.map((b) => (
              <View key={b.id} style={[styles.badge, styles.badgeEarned]}>
                <Ionicons name={b.icon} size={18} color={colors.ember} />
                <Text style={styles.badgeLabel} numberOfLines={1}>
                  {b.label}
                </Text>
                <Text style={styles.badgeSub} numberOfLines={1}>{b.sub}</Text>
              </View>
            ))}
            {locked.map((b) => (
              <View key={b.id} style={styles.badge}>
                <Ionicons name="lock-closed" size={18} color={colors.inkFaint} />
                <Text style={[styles.badgeLabel, styles.badgeLocked]} numberOfLines={1}>
                  {b.label}
                </Text>
                <Text style={styles.badgeSub} numberOfLines={1}>{b.sub}</Text>
              </View>
            ))}
          </View>
        );
      })()}

      <Text style={[styles.section, { color: colors.inkSoft, marginTop: 24 }]}>
        History
      </Text>
      <View style={styles.calCard}>
        <View style={styles.calHeader}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8}>
            <Text style={styles.calNav}>‹</Text>
          </Pressable>
          <Text style={styles.calMonth}>
            {monthCursor.toLocaleDateString(undefined, {
              month: 'long', year: 'numeric',
            })}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8}>
            <Text style={styles.calNav}>›</Text>
          </Pressable>
        </View>
        <View style={styles.calGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={`h${i}`} style={styles.calDow}>{d}</Text>
          ))}
          {monthDays.map((date, i) => {
            const status = dayStatus(date);
            return (
              <View
                key={i}
                style={[
                  styles.calCell,
                  status === 'complete' && styles.calComplete,
                  status === 'partial' && styles.calPartial,
                ]}
              >
                <Text
                  style={[
                    styles.calDay,
                    status === 'complete' && styles.calDayComplete,
                    status === 'future' && styles.calDayFuture,
                  ]}
                >
                  {date ? date.getDate() : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, styles.calComplete]} />
          <Text style={styles.legendText}>all goals</Text>
          <View style={[styles.legendDot, styles.calPartial]} />
          <Text style={styles.legendText}>some</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.bg }]} />
          <Text style={styles.legendText}>none</Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  kicker: { color: colors.inkSoft, fontSize: 13 },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 2, marginBottom: 14 },
  track: { height: 8, backgroundColor: colors.line, borderRadius: 4 },
  fill: { height: 8, backgroundColor: colors.pitch, borderRadius: 4 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 4 },
  trackText: { color: colors.inkFaint, fontSize: 12, flexShrink: 1 },
  notesCard: {
    backgroundColor: colors.pitchSoft, borderRadius: 12, padding: 14, marginTop: 12,
  },
  notesKicker: { color: colors.pitch, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  notesText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  section: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 8, letterSpacing: 0.3 },
  sectionSub: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  milestone: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
  },
  milestoneNext: { backgroundColor: colors.emberSoft },
  check: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.inkFaint, alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.pitch, borderColor: colors.pitch },
  checkNext: { borderColor: colors.ember },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  milestoneText: { color: colors.ink, fontSize: 15, flex: 1 },
  milestoneDone: { color: colors.inkFaint },
  milestoneNextText: { color: colors.ember, fontWeight: '600' },
  milestoneDate: { color: colors.inkFaint, fontSize: 12 },
  bench: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  benchBeaten: { backgroundColor: colors.pitchSoft, borderColor: colors.pitch },
  benchName: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  benchNameBeaten: { color: colors.pitch },
  benchNums: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  benchNumsBeaten: { color: colors.pitch },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 15, color: colors.ink, width: 70,
  },
  saveBtn: {
    backgroundColor: colors.pitch, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  remove: { color: colors.inkFaint, fontSize: 15, padding: 4 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  addInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.ember, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  badge: {
    width: '48%', backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.line, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 2,
  },
  badgeEarned: { backgroundColor: colors.emberSoft, borderColor: colors.ember },
  badgeLabel: {
    color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 4,
  },
  badgeLocked: { color: colors.inkFaint },
  badgeSub: { color: colors.inkSoft, fontSize: 11 },
  calCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 12,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4,
  },
  calNav: { color: colors.inkSoft, fontSize: 22, paddingHorizontal: 10 },
  calMonth: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDow: {
    width: '14.28%', textAlign: 'center', color: colors.inkFaint,
    fontSize: 11, fontWeight: '700', marginBottom: 4,
  },
  calCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center', borderRadius: 8,
  },
  calComplete: { backgroundColor: colors.pitch },
  calPartial: { backgroundColor: colors.pitchSoft },
  calDay: { color: colors.ink, fontSize: 13 },
  calDayComplete: { color: '#fff', fontWeight: '700' },
  calDayFuture: { color: colors.inkFaint },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, justifyContent: 'center',
  },
  legendDot: {
    width: 12, height: 12, borderRadius: 4,
    borderWidth: 1, borderColor: colors.line,
  },
  legendText: { color: colors.inkFaint, fontSize: 11, marginRight: 8 },
});
