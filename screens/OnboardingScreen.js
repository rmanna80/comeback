import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { PHASES } from '../data/phases';
import { colors } from '../theme';

const INJURIES = ['ACL', 'Ankle', 'Hamstring', 'Meniscus', 'Other'];

export default function OnboardingScreen({ onDone }) {
  const [injury, setInjury] = useState(null);
  const [sport, setSport] = useState('');
  const [daysAgo, setDaysAgo] = useState('');
  const [phase, setPhase] = useState(null);

  const ready = injury && sport.trim() && daysAgo !== '' && phase;

  const submit = () => {
    if (!ready) return;
    const injuryDate = new Date();
    injuryDate.setDate(injuryDate.getDate() - Number(daysAgo || 0));
    onDone({
      injury,
      sport: sport.trim(),
      injuryDate: injuryDate.toISOString(),
      phase,
    });
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.kicker}>The comeback starts now</Text>
      <Text style={styles.title}>Come back better than you left.</Text>

      <Text style={styles.label}>What are you coming back from?</Text>
      <View style={styles.chips}>
        {INJURIES.map((i) => (
          <Pressable
            key={i}
            onPress={() => setInjury(i)}
            style={[styles.chip, injury === i && styles.chipOn]}
          >
            <Text style={[styles.chipText, injury === i && styles.chipTextOn]}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Your sport</Text>
      <TextInput
        style={styles.input}
        placeholder="Soccer"
        placeholderTextColor={colors.inkFaint}
        value={sport}
        onChangeText={setSport}
      />

      <Text style={styles.label}>Days since injury or surgery</Text>
      <TextInput
        style={styles.input}
        placeholder="47"
        placeholderTextColor={colors.inkFaint}
        keyboardType="number-pad"
        value={daysAgo}
        onChangeText={setDaysAgo}
      />

      <Text style={styles.label}>Where are you in rehab?</Text>
      {PHASES.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setPhase(p.id)}
          style={[styles.phaseRow, phase === p.id && styles.phaseRowOn]}
        >
          <View style={[styles.dot, phase === p.id && styles.dotOn]} />
          <Text style={[styles.phaseText, phase === p.id && styles.phaseTextOn]}>
            {p.label}
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={submit}
        style={[styles.cta, !ready && styles.ctaOff]}
      >
        <Text style={styles.ctaText}>Start the comeback</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        Goal templates are starting points, not medical advice. Follow your
        physio's program — attack it harder than anyone.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  kicker: { color: colors.ember, fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 24 },
  label: { color: colors.inkSoft, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.pitch, borderColor: colors.pitch },
  chipText: { color: colors.ink, fontSize: 14 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.ink,
  },
  phaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
    marginBottom: 8,
  },
  phaseRowOn: { borderColor: colors.pitch, backgroundColor: colors.pitchSoft },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.inkFaint },
  dotOn: { borderColor: colors.pitch, backgroundColor: colors.pitch },
  phaseText: { color: colors.ink, fontSize: 15 },
  phaseTextOn: { fontWeight: '600' },
  cta: {
    marginTop: 28, backgroundColor: colors.ember, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaOff: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { color: colors.inkFaint, fontSize: 12, marginTop: 14, marginBottom: 40, lineHeight: 17 },
});
