// Milestone paths per injury, roughly in order. Users tap to mark
// them done — the app records the date. Estimates are motivation,
// not medical predictions; the PT's timeline always wins.
export const RETURN_ESTIMATES = {
  ACL: 270,
  Ankle: 56,
  Hamstring: 42,
  Meniscus: 120,
  Other: 180,
};

export const MILESTONES = {
  ACL: [
    { id: 'crutches', title: 'Walking without crutches' },
    { id: 'extension', title: 'Full extension' },
    { id: 'jog', title: 'First jog' },
    { id: 'touches', title: 'First touches on the ball' },
    { id: 'sprint', title: 'First sprint' },
    { id: 'cutting', title: 'Cutting and change of direction' },
    { id: 'training', title: 'First full training session' },
    { id: 'match', title: 'First match back' },
  ],
  Ankle: [
    { id: 'weight', title: 'Full weight bearing' },
    { id: 'rom', title: 'Full range of motion' },
    { id: 'jog', title: 'First jog' },
    { id: 'touches', title: 'First touches on the ball' },
    { id: 'cutting', title: 'Cutting pain-free' },
    { id: 'match', title: 'First match back' },
  ],
  Hamstring: [
    { id: 'walk', title: 'Walking pain-free' },
    { id: 'jog', title: 'First jog' },
    { id: 'stride', title: 'Full stride running' },
    { id: 'sprint', title: 'First max sprint' },
    { id: 'match', title: 'First match back' },
  ],
  Meniscus: [
    { id: 'crutches', title: 'Walking without crutches' },
    { id: 'rom', title: 'Full range of motion' },
    { id: 'jog', title: 'First jog' },
    { id: 'touches', title: 'First touches on the ball' },
    { id: 'cutting', title: 'Cutting and pivoting' },
    { id: 'match', title: 'First match back' },
  ],
  Other: [
    { id: 'pain-free', title: 'Daily life pain-free' },
    { id: 'jog', title: 'First jog' },
    { id: 'sport', title: 'First sport-specific work' },
    { id: 'training', title: 'First full training session' },
    { id: 'match', title: 'First competition back' },
  ],
};

export function milestonesFor(injury) {
  return MILESTONES[injury] || MILESTONES.Other;
}

export function returnEstimateFor(injury) {
  return RETURN_ESTIMATES[injury] || RETURN_ESTIMATES.Other;
}
