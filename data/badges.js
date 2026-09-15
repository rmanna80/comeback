import { PHASES } from './phases';

// Badges are earned from real events: milestones you tapped,
// streaks you kept, benchmarks you beat, phases you advanced.
// Deliberately no volume rewards — consistency and milestones
// bring you back; "extra work" badges would invite re-injury.
export const STREAK_TIERS = [
  { n: 7, label: 'One week strong' },
  { n: 30, label: 'One month machine' },
  { n: 100, label: 'Century club' },
];

export function computeBadges({
  unlockedMilestones, milestones, bestStreak, benchmarks,
  phaseHistory, injuryDate,
}) {
  const dayOf = (iso) =>
    `Day ${Math.max(
      0,
      Math.floor((new Date(iso) - new Date(injuryDate)) / 86400000)
    )}`;

  const earned = [];
  const locked = [];

  milestones.forEach((m) => {
    if (unlockedMilestones[m.id]) {
      earned.push({
        id: `ms-${m.id}`,
        icon: 'flag',
        label: m.title,
        sub: dayOf(unlockedMilestones[m.id]),
      });
    }
  });

  STREAK_TIERS.forEach((t) => {
    const badge = {
      id: `st-${t.n}`,
      icon: 'flame',
      label: t.label,
      sub: `${t.n}-day streak`,
    };
    (bestStreak >= t.n ? earned : locked).push(badge);
  });

  benchmarks.forEach((b) => {
    if (b.target > 0 && b.current >= b.target) {
      earned.push({
        id: `bb-${b.id}`,
        icon: 'trophy',
        label: 'Better than before',
        sub: b.name,
      });
    }
  });

  (phaseHistory || []).forEach((h, i) => {
    const ph = PHASES.find((p) => p.id === h.phase);
    earned.push({
      id: `ph-${i}`,
      icon: 'trending-up',
      label: 'New phase',
      sub: ph ? ph.label.split(' (')[0] : h.phase,
    });
  });

  return { earned, locked };
}
