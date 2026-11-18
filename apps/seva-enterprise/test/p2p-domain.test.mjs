import test from 'node:test';
import assert from 'node:assert/strict';
import {
  P2P_AMOUNT_CENTS, P2P_CURRENCY, SEVA_FEE_CENTS, STUDIO_COST_CENTS,
  transitionBeneficiary, assertBeneficiaryEligible, createP2PPaymentRequest,
  confirmP2PPaymentRequest, validateP2PSettlementEvidence
} from '../p2p-domain.mjs';

const eligible = { userId: 'beneficiary-1', receivingState: 'ACTIVE', verified: true, providerPayoutCapable: true };

test('commercial invariants remain EUR 3.00 net and zero SEVA/Studio cost', () => {
  assert.equal(P2P_AMOUNT_CENTS, 300);
  assert.equal(P2P_CURRENCY, 'EUR');
  assert.equal(SEVA_FEE_CENTS, 0);
  assert.equal(STUDIO_COST_CENTS, 0);
});

test('beneficiary opt-in and revocation transitions are constrained', () => {
  assert.equal(transitionBeneficiary('NOT_ENROLLED', 'PENDING_VERIFICATION'), 'PENDING_VERIFICATION');
  assert.equal(transitionBeneficiary('PENDING_VERIFICATION', 'ACTIVE'), 'ACTIVE');
  assert.equal(transitionBeneficiary('ACTIVE', 'REVOKED'), 'REVOKED');
  assert.throws(() => transitionBeneficiary('REVOKED', 'ACTIVE'), /Invalid beneficiary state transition/);
});

test('only verified active payout-capable beneficiary is eligible', () => {
  assert.equal(assertBeneficiaryEligible(eligible), true);
  assert.throws(() => assertBeneficiaryEligible({ ...eligible, receivingState: 'REVOKED' }));
  assert.throws(() => assertBeneficiaryEligible({ ...eligible, verified: false }));
  assert.throws(() => assertBeneficiaryEligible({ ...eligible, providerPayoutCapable: false }));
});

test('payment request is a single EUR 3.00 request awaiting payer confirmation', () => {
  const request = createP2PPaymentRequest({ payerUserId: 'payer-1', beneficiary: eligible });
  assert.equal(request.amountCents, 300);
  assert.equal(request.beneficiaryNetCents, 300);
  assert.equal(request.sevaFeeCents, 0);
  assert.equal(request.studioCostCents, 0);
  assert.equal(request.status, 'AWAITING_PAYER_CONFIRMATION');
  assert.equal(request.recurring, false);
  assert.throws(() => createP2PPaymentRequest({ payerUserId: 'payer-1', beneficiary: { ...eligible, receivingState: 'REVOKED' } }));
  assert.throws(() => createP2PPaymentRequest({ payerUserId: 'beneficiary-1', beneficiary: eligible }));
});

test('payer confirmation is explicit and requires idempotency key', () => {
  const request = createP2PPaymentRequest({ payerUserId: 'payer-1', beneficiary: eligible });
  assert.throws(() => confirmP2PPaymentRequest(request, { explicitConsent: false, idempotencyKey: 'request-key-000001' }), /Explicit payer confirmation/);
  assert.throws(() => confirmP2PPaymentRequest(request, { explicitConsent: true, idempotencyKey: 'short' }), /idempotency key/);
  const confirmed = confirmP2PPaymentRequest(request, { explicitConsent: true, idempotencyKey: 'request-key-000001' });
  assert.equal(confirmed.status, 'CONFIRMED_FOR_PROVIDER_HANDOFF');
  assert.equal(confirmed.recurring, false);
});

test('settlement evidence must prove EUR 3.00 net and zero SEVA/Studio deductions', () => {
  const proof = { currency: 'EUR', beneficiaryNetCents: 300, sevaFeeCents: 0, studioCostCents: 0, payerProviderFeeCents: 35, providerSettlementReference: 'sandbox-settlement-001' };
  assert.equal(validateP2PSettlementEvidence(proof), true);
  assert.throws(() => validateP2PSettlementEvidence({ ...proof, beneficiaryNetCents: 265 }));
  assert.throws(() => validateP2PSettlementEvidence({ ...proof, studioCostCents: 1 }));
  assert.throws(() => validateP2PSettlementEvidence({ ...proof, providerSettlementReference: '' }));
});
