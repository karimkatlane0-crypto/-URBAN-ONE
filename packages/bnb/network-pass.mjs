const BPS = 10_000;

export const DEFAULT_NETWORK_PASS = Object.freeze({
  currency: 'EUR',
  annualFeeCents: 100_000,
  hostSettlementPoolBps: 7_200,
  platformGrossBps: 1_800,
  riskReserveBps: 500,
  paymentAndOpsBps: 500,
  standardNightSettlementCents: 12_000,
  expectedRedeemedNights: 4.2,
  membershipMonths: 12,
  modelVersion: '1.0.0'
});

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${name}_MUST_BE_POSITIVE_INTEGER`);
}

function assertBps(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > BPS) throw new TypeError(`${name}_MUST_BE_BPS`);
}

function centsAtBps(cents, bps) {
  return Math.round((cents * bps) / BPS);
}

export function networkPassPolicy(overrides = {}) {
  const config = { ...DEFAULT_NETWORK_PASS, ...overrides };
  assertPositiveInteger(config.annualFeeCents, 'ANNUAL_FEE_CENTS');
  assertPositiveInteger(config.standardNightSettlementCents, 'STANDARD_NIGHT_SETTLEMENT_CENTS');
  assertBps(config.hostSettlementPoolBps, 'HOST_SETTLEMENT_POOL_BPS');
  assertBps(config.platformGrossBps, 'PLATFORM_GROSS_BPS');
  assertBps(config.riskReserveBps, 'RISK_RESERVE_BPS');
  assertBps(config.paymentAndOpsBps, 'PAYMENT_AND_OPS_BPS');
  const allocationBps = config.hostSettlementPoolBps + config.platformGrossBps + config.riskReserveBps + config.paymentAndOpsBps;
  if (allocationBps !== BPS) throw new RangeError('NETWORK_PASS_ALLOCATIONS_MUST_TOTAL_100_PERCENT');

  const hostSettlementPoolCents = centsAtBps(config.annualFeeCents, config.hostSettlementPoolBps);
  const maxStandardNightCredits = Math.floor(hostSettlementPoolCents / config.standardNightSettlementCents);

  return {
    ...config,
    allocationBps,
    hostSettlementPoolCents,
    platformGrossAllocationCents: centsAtBps(config.annualFeeCents, config.platformGrossBps),
    riskReserveCents: centsAtBps(config.annualFeeCents, config.riskReserveBps),
    paymentAndOpsCents: centsAtBps(config.annualFeeCents, config.paymentAndOpsBps),
    maxStandardNightCredits,
    userPromise: {
      zeroAtStayWithinCredits: true,
      unlimitedNights: false,
      availabilityRequired: true,
      localTaxesAndOptionalExtrasExcluded: true,
      peakDatesMayConsumeMoreThanOneCredit: true
    },
    hostPromise: {
      propertyOwnershipTransferred: false,
      propertySaleRequired: false,
      participationReversible: true,
      settlementTriggeredByEligibleStay: true,
      percentageTermsNegotiableBeforeLaunch: true
    }
  };
}

export function quoteNetworkPass(input = {}) {
  const expectedRedeemedNights = Number(input.expectedRedeemedNights ?? DEFAULT_NETWORK_PASS.expectedRedeemedNights);
  if (!Number.isFinite(expectedRedeemedNights) || expectedRedeemedNights < 0) throw new TypeError('EXPECTED_REDEEMED_NIGHTS_MUST_BE_NON_NEGATIVE');

  const policy = networkPassPolicy(input);
  const expectedHostSettlementCents = Math.round(expectedRedeemedNights * policy.standardNightSettlementCents);
  const contributionBeforeFixedCostsCents = policy.annualFeeCents - expectedHostSettlementCents - policy.riskReserveCents - policy.paymentAndOpsCents;
  const contributionMarginBps = Math.round((contributionBeforeFixedCostsCents * BPS) / policy.annualFeeCents);
  const effectiveMemberCostPerRedeemedNightCents = expectedRedeemedNights > 0 ? Math.round(policy.annualFeeCents / expectedRedeemedNights) : null;

  return {
    modelVersion: policy.modelVersion,
    currency: policy.currency,
    annualFeeCents: policy.annualFeeCents,
    expectedRedeemedNights,
    maxStandardNightCredits: policy.maxStandardNightCredits,
    includedCapacityExceeded: expectedRedeemedNights > policy.maxStandardNightCredits,
    expectedHostSettlementCents,
    contributionBeforeFixedCostsCents,
    contributionMarginBps,
    effectiveMemberCostPerRedeemedNightCents,
    allocations: {
      hostSettlementPoolCents: policy.hostSettlementPoolCents,
      platformGrossAllocationCents: policy.platformGrossAllocationCents,
      riskReserveCents: policy.riskReserveCents,
      paymentAndOpsCents: policy.paymentAndOpsCents
    },
    policy
  };
}
