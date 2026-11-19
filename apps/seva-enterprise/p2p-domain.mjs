// Provider-neutral SEVA TITANS P2P domain contract.
// Deliberately has no network, persistence, payment-provider, or LIVE side effects.
export const P2P_AMOUNT_CENTS = 300;
export const P2P_CURRENCY = 'EUR';
export const SEVA_FEE_CENTS = 0;
export const STUDIO_COST_CENTS = 0;

export const BENEFICIARY_STATES = Object.freeze([
  'NOT_ENROLLED', 'PENDING_VERIFICATION', 'ACTIVE', 'PAUSED', 'REVOKED', 'REJECTED'
]);

const beneficiaryTransitions = Object.freeze({
  NOT_ENROLLED: ['PENDING_VERIFICATION'],
  PENDING_VERIFICATION: ['ACTIVE', 'REJECTED', 'REVOKED'],
  ACTIVE: ['PAUSED', 'REVOKED'],
  PAUSED: ['ACTIVE', 'REVOKED'],
  REVOKED: ['PENDING_VERIFICATION'],
  REJECTED: ['PENDING_VERIFICATION']
});

export function transitionBeneficiary(current, next) {
  if (!BENEFICIARY_STATES.includes(current) || !beneficiaryTransitions[current]?.includes(next)) {
    throw new Error('Invalid beneficiary state transition');
  }
  return next;
}

export function assertBeneficiaryEligible(beneficiary) {
  if (!beneficiary || beneficiary.receivingState !== 'ACTIVE' ||
      beneficiary.verified !== true || beneficiary.providerPayoutCapable !== true) {
    throw new Error('Beneficiary is not verified and payout-eligible');
  }
  return true;
}

export function createP2PPaymentRequest({ payerUserId, beneficiary }) {
  if (typeof payerUserId !== 'string' || !payerUserId.trim()) throw new Error('Authenticated payer required');
  assertBeneficiaryEligible(beneficiary);
  if (typeof beneficiary.userId !== 'string' || !beneficiary.userId.trim() ||
      beneficiary.userId === payerUserId) throw new Error('Valid distinct beneficiary required');
  return Object.freeze({
    payerUserId,
    beneficiaryUserId: beneficiary.userId,
    amountCents: P2P_AMOUNT_CENTS,
    currency: P2P_CURRENCY,
    beneficiaryNetCents: P2P_AMOUNT_CENTS,
    sevaFeeCents: SEVA_FEE_CENTS,
    studioCostCents: STUDIO_COST_CENTS,
    status: 'AWAITING_PAYER_CONFIRMATION',
    recurring: false
  });
}

export function confirmP2PPaymentRequest(request, { explicitConsent, idempotencyKey }) {
  if (!request || request.status !== 'AWAITING_PAYER_CONFIRMATION') throw new Error('Payment request is not confirmable');
  if (explicitConsent !== true) throw new Error('Explicit payer confirmation required');
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    throw new Error('Valid transaction idempotency key required');
  }
  return Object.freeze({ ...request, status: 'CONFIRMED_FOR_PROVIDER_HANDOFF', idempotencyKey });
}

export function validateP2PSettlementEvidence(evidence) {
  if (!evidence || evidence.currency !== P2P_CURRENCY ||
      evidence.beneficiaryNetCents !== P2P_AMOUNT_CENTS ||
      evidence.sevaFeeCents !== SEVA_FEE_CENTS ||
      evidence.studioCostCents !== STUDIO_COST_CENTS ||
      !Number.isSafeInteger(evidence.payerProviderFeeCents) ||
      evidence.payerProviderFeeCents < 0 ||
      evidence.providerSettlementReference === undefined ||
      typeof evidence.providerSettlementReference !== 'string' ||
      !evidence.providerSettlementReference.trim()) {
    throw new Error('Settlement evidence does not satisfy the P2P commercial invariant');
  }
  return true;
}
