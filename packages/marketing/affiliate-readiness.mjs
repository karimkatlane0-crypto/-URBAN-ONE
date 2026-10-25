// Planning helper only. Provider approval and server-side enforcement remain external.
const DAY = 86_400_000;
const steps = [
  ['network', 'active', 'Verify publisher network access'],
  ['advertiser', 'joined', 'Obtain advertiser approval; do not duplicate a pending application'],
  ['property', 'active', 'Verify the promotional property'],
  ['terms', 'accepted', 'Review and accept applicable advertiser terms'],
  ['channel', 'authorized', 'Verify the intended promotion channel is permitted'],
  ['trackingLink', 'verified', 'Obtain and verify the advertiser-issued tracking link'],
  ['disclosure', 'ready', 'Prepare affiliate disclosure and applicable privacy controls'],
];

export function assessAffiliateReadiness(evidence = {}, {now = Date.now(), maxAgeMs = DAY} = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0)
    throw new TypeError('Finite time and positive evidence age required');
  const blockers = [];
  for (const [gate, required, action] of steps) {
    const record = evidence[gate];
    const observed = typeof record?.observedAt === 'string' ? Date.parse(record.observedAt) : NaN;
    const age = now - observed;
    const fresh = Number.isFinite(age) && age >= 0 && age <= maxAgeMs;
    if (record?.status !== required || !fresh) {
      blockers.push({gate, reason: record?.status !== required ? 'unverified_or_not_ready' : 'stale_or_invalid_evidence', action});
    }
  }
  return {
    readyForPromotion: blockers.length === 0,
    decision: blockers.length ? 'BLOCKED' : 'READY_FOR_PERMITTED_TRACKING_TEST',
    blockers,
    // Separate entitlements must never be inferred from CJ network/advertiser membership.
    demandApi: 'NOT_ASSESSED', connectivityApi: 'NOT_ASSESSED',
    earnings: 'REQUIRE_PROVIDER_TRANSACTIONS', payout: 'REQUIRE_PROVIDER_SETTLEMENT',
  };
}

export function compareAffiliateEvidence(previous = {}, current = {}) {
  return steps.flatMap(([gate]) => {
    const before = previous[gate]?.status ?? 'unknown';
    const after = current[gate]?.status ?? 'unknown';
    return before === after ? [] : [{gate, before, after}];
  });
}
