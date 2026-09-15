import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { milestonesFor, returnEstimateFor } from '../data/milestones';
import { colors } from '../theme';

export default function TrackerScreen({ profile }) {
  const [unlocked, setUnlocked] = useState({});
  const [benchmarks, setBenchmarks] = useState([]);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

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
    (async () => {
      const m = await AsyncStorage.getItem('milestones');
      if (m) setUnlocked(JSON.parse(m));
      const b = await AsyncStorage.getItem('benchmarks');
      if (b) setBenchmarks(JSON.parse(b));
    })();
  }, []);

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
});
