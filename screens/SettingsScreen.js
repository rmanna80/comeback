import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert,
} from 'react-native';
import { PHASES } from '../data/phases';
import {
  DEFAULT_NOTIF_SETTINGS, getNotifSettings, saveNotifSettings,
} from '../notifications';
import { colors } from '../theme';

function formatTime(h, m) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

export default function SettingsScreen({ profile, onReset, onPhaseChange }) {
  const pickPhase = (phaseId) => {
    if (phaseId === profile.phase) return;
    const label = PHASES.find((p) => p.id === phaseId)?.label || phaseId;
    Alert.alert(
      'Change phase',
      `Move to "${label}"? This is a milestone in itself.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch only',
          onPress: () => onPhaseChange(phaseId, false),
        },
        {
          text: 'Switch + add its goals',
          onPress: () => onPhaseChange(phaseId, true),
        },
      ]
    );
  };

  const [settings, setSettings] = useState(DEFAULT_NOTIF_SETTINGS);

  useEffect(() => {
    getNotifSettings().then(setSettings);
  }, []);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveNotifSettings(next, profile);
  };

  const shift = (prefix, delta) => {
    let total =
      settings[`${prefix}Hour`] * 60 + settings[`${prefix}Minute`] + delta;
    total = ((total % 1440) + 1440) % 1440;
    update({
      [`${prefix}Hour`]: Math.floor(total / 60),
      [`${prefix}Minute`]: total % 60,
    });
  };

  const TimeRow = ({ label, sub, prefix }) => (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSub}>{sub}</Text>
        </View>
        <Switch
          value={settings[`${prefix}Enabled`]}
          onValueChange={(v) => update({ [`${prefix}Enabled`]: v })}
          trackColor={{ true: colors.pitch, false: colors.line }}
          thumbColor="#fff"
        />
      </View>
      {settings[`${prefix}Enabled`] ? (
        <View style={styles.timeRow}>
          <Pressable onPress={() => shift(prefix, -30)} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>−30m</Text>
          </Pressable>
          <Text style={styles.timeText}>
            {formatTime(settings[`${prefix}Hour`], settings[`${prefix}Minute`])}
          </Text>
          <Pressable onPress={() => shift(prefix, 30)} style={styles.stepBtn}>
            <Text style={styles.stepBtnText}>+30m</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>Reminders</Text>
      <TimeRow
        label="Morning quote"
        sub="Day count + fuel for the day"
        prefix="morning"
      />
      <TimeRow
        label="Evening nudge"
        sub="Only fires if today's goals aren't done"
        prefix="evening"
      />
      <Text style={styles.hint}>
        Changes apply right away — the next 7 days get rescheduled.
      </Text>

      <Text style={[styles.section, { marginTop: 28 }]}>Rehab phase</Text>
      {PHASES.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => pickPhase(p.id)}
          style={[styles.phaseRow, profile.phase === p.id && styles.phaseRowOn]}
        >
          <View
            style={[styles.dot, profile.phase === p.id && styles.dotOn]}
          />
          <Text
            style={[
              styles.phaseText,
              profile.phase === p.id && styles.phaseTextOn,
            ]}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
      <Text style={styles.hint}>
        Advancing earns a badge. "Switch + add its goals" merges the new
        phase's templates into your program without touching your custom
        goals.
      </Text>

      <Text style={[styles.section, { marginTop: 28 }]}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>
          {profile.injuryName || profile.injury} · {profile.sport}
        </Text>
        <Text style={styles.rowSub}>
          Injured {new Date(profile.injuryDate).toLocaleDateString()}
        </Text>
        <Pressable onPress={onReset} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset profile and start over</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Resetting wipes your goals, streak, milestones, and benchmarks.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 24, fontWeight: '800', marginBottom: 18 },
  section: {
    color: colors.pitch, fontSize: 13, fontWeight: '700',
    letterSpacing: 0.3, marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  rowSub: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 14, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  stepBtn: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bg,
  },
  stepBtnText: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  timeText: {
    color: colors.ink, fontSize: 18, fontWeight: '800', minWidth: 92,
    textAlign: 'center',
  },
  hint: { color: colors.inkFaint, fontSize: 12, lineHeight: 17 },
  resetBtn: {
    marginTop: 12, borderWidth: 1, borderColor: colors.ember,
    borderRadius: 10, paddingVertical: 11, alignItems: 'center',
  },
  resetBtnText: { color: colors.ember, fontSize: 14, fontWeight: '700' },
  phaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
    marginBottom: 8,
  },
  phaseRowOn: { borderColor: colors.pitch, backgroundColor: colors.pitchSoft },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.inkFaint,
  },
  dotOn: { borderColor: colors.pitch, backgroundColor: colors.pitch },
  phaseText: { color: colors.ink, fontSize: 15 },
  phaseTextOn: { fontWeight: '600' },
});
