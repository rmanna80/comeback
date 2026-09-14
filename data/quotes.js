// Motivation pool. type: 'pro' links out to public videos (no hosted
// clips — rights stay clean). type: 'community' is the layer you'll
// grow with real athlete stories later.
export const QUOTES = [
  {
    type: 'community',
    text: 'Tore my ACL twice. Started both comebacks in this exact phase.',
    who: 'Jordan, D1 midfielder',
    tags: ['acl', 'soccer'],
  },
  {
    type: 'community',
    text: 'The healthy leg I trained during rehab is still my stronger leg.',
    who: 'Sam, college winger',
    tags: ['acl', 'soccer'],
  },
  {
    type: 'pro',
    text: 'Derrick Rose came back from an ACL tear to score 50 against Utah.',
    who: 'Watch: D-Rose 50-point game',
    url: 'https://www.youtube.com/results?search_query=derrick+rose+50+points+utah',
    tags: ['acl', 'basketball'],
  },
  {
    type: 'pro',
    text: 'Zlatan tore his ACL at 35. Scored on his return and said "Lions recover."',
    who: 'Zlatan Ibrahimović',
    tags: ['acl', 'soccer'],
  },
  {
    type: 'community',
    text: 'Every day you check the boxes, someone else is skipping theirs.',
    who: 'The comeback rule',
    tags: [],
  },
];

export function pickQuote(injuryType, sport, dayIndex) {
  const tagged = QUOTES.filter(
    (q) =>
      q.tags.length === 0 ||
      q.tags.includes(injuryType?.toLowerCase()) ||
      q.tags.includes(sport?.toLowerCase())
  );
  const pool = tagged.length ? tagged : QUOTES;
  return pool[dayIndex % pool.length];
}
