// Daily goal templates per rehab phase.
// lane: rehab | gym | technical
// These are starting templates — users will eventually customize with
// their physio's actual program. Not medical advice.
export const PHASES = [
  { id: 'postop', label: 'Post-op (weeks 0–2)' },
  { id: 'early', label: 'Early rehab (weeks 2–6)' },
  { id: 'strength', label: 'Strength (months 2–4)' },
  { id: 'ball', label: 'Return to ball (months 4–7)' },
  { id: 'full', label: 'Full training (month 7+)' },
];

export const GOAL_TEMPLATES = {
  postop: [
    { lane: 'rehab', title: 'Quad sets — 3 × 15' },
    { lane: 'rehab', title: 'Heel slides — 3 × 10' },
    { lane: 'rehab', title: 'Ankle pumps — every hour' },
    { lane: 'gym', title: 'Upper body — seated press + rows' },
    { lane: 'technical', title: 'Film study — 15 min' },
  ],
  early: [
    { lane: 'rehab', title: 'Straight leg raises — 3 × 12' },
    { lane: 'rehab', title: 'Stationary bike — 10 min easy' },
    { lane: 'gym', title: 'Upper push day' },
    { lane: 'gym', title: 'Healthy-leg calf raises — 3 × 15' },
    { lane: 'technical', title: 'Seated wall passes — 10 min' },
  ],
  strength: [
    { lane: 'rehab', title: 'Leg press (light) — 3 × 12' },
    { lane: 'rehab', title: 'Balance board — 5 min' },
    { lane: 'gym', title: 'Core circuit — 20 min' },
    { lane: 'gym', title: 'Pull day' },
    { lane: 'technical', title: 'Stationary juggling — 100 touches' },
  ],
  ball: [
    { lane: 'rehab', title: 'Single-leg hops — pain-free only' },
    { lane: 'gym', title: 'Lower strength — squat progression' },
    { lane: 'technical', title: 'Passing patterns — 20 min' },
    { lane: 'technical', title: 'Light dribbling — cones, no cuts' },
  ],
  full: [
    { lane: 'gym', title: 'Full lift — track vs pre-injury numbers' },
    { lane: 'technical', title: 'Full training session' },
    { lane: 'technical', title: 'Sprint work — beat your benchmark' },
    { lane: 'rehab', title: 'Prehab — nordics + balance' },
  ],
};
