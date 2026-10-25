// SEVA commercial rule engine — quotes/redemption eligibility only. No payment instructions.
// All amounts are integer euro cents; no external financial side effects.
export const SEVA_MONTHLY_CENTS = 5_000;

function money(value, label, maximum = 100_000_000) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new RangeError(`${label} deve essere un intero in centesimi valido`);
  return value;
}
function count(value, label, max) {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new RangeError(`${label} non valido`);
  return value;
}
function goalFee(goal = { mode: 'free' }) {
  const mode = goal?.mode || 'free';
  if (mode === 'free') return 0;
  if (mode === 'fixed' || mode === 'negotiated') return money(goal.amountCents, 'goal.amountCents');
  if (mode === 'calculated') {
    const achieved = count(goal.verifiedGoals, 'goal.verifiedGoals', 10000);
    const unit = money(goal.amountPerGoalCents, 'goal.amountPerGoalCents');
    const cap = money(goal.capCents, 'goal.capCents');
    return Math.min(achieved * unit, cap);
  }
  throw new RangeError('Modalità G non valida');
}
/** Transparent contractual preview, NOT proof of a commercial offer or payment authorization. */
export function quoteSEVA(input = {}) {
  const months = count(input.months ?? 1, 'months', 120);
  if (months === 0) throw new RangeError('Mesi almeno 1');
  const baseCents = months * SEVA_MONTHLY_CENTS;
  const goalCents = goalFee(input.goal);
  const requestedMarketingCents = money(input.marketingRequestedCents ?? 0, 'marketingRequestedCents');
  const consentedMarketingCents = money(input.marketingConsentedCents ?? 0, 'marketingConsentedCents');
  // Never silently bill an unapproved requested marketing amount.
  const marketingCents = Math.min(requestedMarketingCents, consentedMarketingCents);
  const marketingPendingApprovalCents = requestedMarketingCents - marketingCents;
  const claimedSavingCents = money(input.verifiedSavingCents ?? 0, 'verifiedSavingCents');
  const supportedSaving = Boolean(input.savingEvidenceReference && String(input.savingEvidenceReference).trim());
  const savingCents = supportedSaving ? Math.min(claimedSavingCents, baseCents + goalCents) : 0;
  const subtotalCents = baseCents + goalCents + marketingCents;
  const dueNowCents = subtotalCents - savingCents;
  return {
    currency: 'EUR', months, subscriptionCents: baseCents, goalCents,
    marketingCents, marketingPendingApprovalCents, savingCents,
    unverifiedClaimedSavingCents: supportedSaving ? 0 : claimedSavingCents,
    dueNowCents, refundReceivedCents: 0, netPaidCents: dueNowCents,
    warning: 'Preventivo/simulazione, non un Checkout. Il riscatto futuro non riduce quanto dovuto oggi.'
  };
}
function parseInstant(value, label) {
  if (typeof value !== 'string' || !/\d{4}-\d\d-\d\dT\d\d:\d\d/.test(value) || !/(Z|[+-]\d\d:\d\d)$/.test(value)) throw new RangeError(`${label} richiede ISO 8601 con fuso orario`);
  const t = Date.parse(value);
  if (!Number.isFinite(t)) throw new RangeError(`${label} non valida`);
  return t;
}
/** Eligibility gate: NEVER transfers money, never awards another buyer's marketing budget. */
export function evaluateMarketingRedemption(input = {}) {
  const target = count(input.quorumTarget, 'quorumTarget', 1000000);
  if (target < 1) throw new RangeError('quorumTarget >= 1');
  const actual = count(input.quorumReachedCount ?? 0, 'quorumReachedCount', 1000000);
  const now = parseInstant(input.nowIso, 'nowIso');
  const deadline = parseInstant(input.deadlineIso, 'deadlineIso');
  const paid = money(input.buyerMarketingPaidCents ?? 0, 'buyerMarketingPaidCents');
  const delivered = money(input.verifiedMarketingDeliveredCents ?? 0, 'verifiedMarketingDeliveredCents');
  const funded = money(input.dedicatedRefundReserveCents ?? 0, 'dedicatedRefundReserveCents');
  const match = Boolean(input.buyerId && input.orderBuyerId && input.buyerId === input.orderBuyerId);
  const quorum = actual >= target;
  const early = Boolean(input.earlyRedemptionContracted && input.buyerRequestedEarlyRedemption);
  const atDeadline = now >= deadline && Boolean(input.deadlineRedemptionContracted);
  const trigger = quorum ? 'QUORUM' : early ? 'EARLY_CONTRACTED' : atDeadline ? 'DEADLINE_CONTRACTED' : null;
  const amountCents = Math.min(paid, delivered); // verified first-party buyer expense only
  const detail = {trigger, amountCents, automaticPaymentExecuted: false, buyerIsOwner: match,
    deadlineIso: input.deadlineIso, quorumReachedCount: actual, quorumTarget: target};
  if (!match) return {...detail,status:'BLOCKED_OWNER_MISMATCH',redeemableCents:0};
  if (!trigger) return {...detail,status:'WAITING_TIME_OR_QUORUM',redeemableCents:0};
  if (!input.explicitRefundTermsAccepted) return {...detail,status:'BLOCKED_TERMS',redeemableCents:0};
  if (!input.marketingReceiptsVerified || amountCents===0) return {...detail,status:'BLOCKED_EVIDENCE',redeemableCents:0};
  if (paid !== delivered && input.fullRedemptionOnly) return {...detail,status:'BLOCKED_MARKETING_RECONCILIATION',redeemableCents:0};
  if (funded < amountCents) return {...detail,status:'BLOCKED_UNFUNDED',redeemableCents:0};
  // Production approval needs validated legal classification and payment-provider method.
  if (!input.legalAndTaxApproval || !input.verifiedRefundRail) return {...detail,status:'AWAITING_COMPLIANCE_AND_PROVIDER',redeemableCents:0};
  return {...detail,status:'ELIGIBLE_FOR_PROVIDER_EXECUTION',redeemableCents:amountCents};
}