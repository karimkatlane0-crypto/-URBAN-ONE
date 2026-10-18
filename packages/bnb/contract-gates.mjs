/**
 * URBAN ONE B&B partner "smart contract": OFF-CHAIN, PURE, FAIL-CLOSED policy.
 *
 * Produces advice for a human-operated, independently authenticated workflow.
 * Does NOT authenticate external systems, sign a legal contract, create a
 * subscription, charge a card, read Booking.com, transfer funds, or use an IBAN.
 * The server MUST verify attestation provenance; client input is not evidence.
 * Never expose external credential/identity data here or treat eligibility as
 * authorization for an automatic payment.
 */
const BPS = 10_000;
const ACTIONS = Object.freeze([
  'monthly_subscription',
  'direct_booking_commission',
  'optional_service_commission',
  'network_pass_host_settlement'
]);

const hasText = value => typeof value === 'string' && value.trim().length > 0;
const intNonNegative = n => Number.isSafeInteger(n) && n >= 0;
const intPositive = n => Number.isSafeInteger(n) && n > 0;
const validBps = n => Number.isInteger(n) && n >= 0 && n <= BPS;
const isTrustedAttestation = (obj, now) => (
  obj?.verified === true &&
  hasText(obj?.reference) &&
  hasText(obj?.source) &&
  hasText(obj?.verifiedAt) &&
  Number.isFinite(Date.parse(obj.verifiedAt)) &&
  Date.parse(obj.verifiedAt) <= Date.parse(now)
);
const result = (action, decision, reason, proposedAmountCents = null) =>
  Object.freeze({action, decision, reason, proposedAmountCents, externalActionPerformed: false});

export const BNB_CONTRACT_ACTIONS = ACTIONS;

/**
 * @param {object} input
 * @param {string} input.action - One of BNB_CONTRACT_ACTIONS.
 * @param {object} input.agreement - Server-verified negotiated terms.
 * @param {object} input.proofs - Trusted-server attestations, NOT guest input.
 * @param {string} [input.now] - Clock for deterministic tests.
 * @returns {{decision:string, reason:string, proposedAmountCents:number|null, externalActionPerformed:false}}
 */
export function evaluateBnbContract(input = {}) {
  const {action, agreement = {}, proofs = {}} = input;
  const now = input.now ?? new Date().toISOString();
  const deny = reason => result(action, 'BLOCKED', reason);
  const ready = (reason, cents = null) => result(action, 'READY_FOR_HUMAN_REVIEW', reason, cents);

  if (!ACTIONS.includes(action)) return deny('UNSUPPORTED_ACTION');
  if (!Number.isFinite(Date.parse(now))) return deny('INVALID_CLOCK');
  if (agreement.currency !== 'EUR') return deny('UNSUPPORTED_CURRENCY');
  if (!hasText(agreement.reference) || !isTrustedAttestation(proofs.signedAgreement, now) ||
      proofs.signedAgreement.reference !== agreement.reference) return deny('SIGNED_AGREEMENT_NOT_VERIFIED');
  if (!agreement.signed || agreement.revoked || agreement.suspended)
    return deny('AGREEMENT_NOT_ACTIVE');
  if (!Array.isArray(agreement.allowedActions) || !agreement.allowedActions.includes(action))
    return deny('ACTION_NOT_CONTRACTED');
  if (!isTrustedAttestation(proofs.authorizedProperty, now))
    return deny('PROPERTY_PERMISSION_MISSING');
  if (!isTrustedAttestation(proofs.taxAndRefundTerms, now))
    return deny('TAX_AND_REFUND_TERMS_MISSING');

  if (action === 'monthly_subscription') {
    if (!intPositive(agreement.monthlyFeeCents)) return deny('RECURRING_PRICE_NOT_AGREED');
    if (!isTrustedAttestation(proofs.customerMandate, now)) return deny('CUSTOMER_AUTOPAY_MANDATE_MISSING');
    if (proofs.customerMandate.agreementReference !== agreement.reference)
      return deny('AUTOPAY_MANDATE_AGREEMENT_MISMATCH');
    if (!isTrustedAttestation(proofs.stripePrice, now) ||
        proofs.stripePrice.currency !== 'EUR' ||
        proofs.stripePrice.interval !== 'month' ||
        proofs.stripePrice.amountCents !== agreement.monthlyFeeCents)
      return deny('STRIPE_RECURRING_PRICE_NOT_VERIFIED');
    return ready('REVIEW_HOSTED_CHECKOUT_AND_SIGNED_WEBHOOK', agreement.monthlyFeeCents);
  }

  if (action === 'direct_booking_commission') {
    if (!validBps(agreement.directCommissionBps)) return deny('COMMISSION_RATE_NOT_AGREED');
    if (!isTrustedAttestation(proofs.reservation, now)) return deny('RESERVATION_NOT_VERIFIED');
    if (proofs.reservation.channel !== 'direct') return deny('OTA_COMMISSION_NOT_AUTHORIZED');
    if (proofs.reservation.cancelled || proofs.reservation.refunded || proofs.reservation.disputed)
      return deny('RESERVATION_NOT_ELIGIBLE');
    if (!intPositive(proofs.reservation.paidAccommodationCents))
      return deny('PAID_AMOUNT_MISSING');
    if (!isTrustedAttestation(proofs.payment, now) ||
        proofs.payment.reference !== proofs.reservation.paymentReference ||
        proofs.payment.status !== 'succeeded')
      return deny('PAYMENT_NOT_VERIFIED');
    if (!isTrustedAttestation(proofs.attribution, now) ||
        proofs.attribution.reservationReference !== proofs.reservation.reference)
      return deny('ATTRIBUTION_NOT_VERIFIED');
    const cents = Math.round(proofs.reservation.paidAccommodationCents *
      agreement.directCommissionBps / BPS);
    if (!intPositive(cents)) return deny('ZERO_COMMISSION');
    return ready('REVIEW_CONTRACTED_FEE_INVOICE_NO_AUTOMATIC_CHARGE', cents);
  }

  if (action === 'optional_service_commission') {
    if (!validBps(agreement.serviceCommissionBps)) return deny('SERVICE_RATE_NOT_AGREED');
    if (!isTrustedAttestation(proofs.service, now) || !proofs.service.fulfilled ||
        !intPositive(proofs.service.paidCents)) return deny('SERVICE_NOT_FULFILLED');
    if (!isTrustedAttestation(proofs.guestPurchaseConsent, now))
      return deny('OPTIONAL_PURCHASE_NOT_AUTHORIZED');
    if (proofs.guestPurchaseConsent.serviceReference !== proofs.service.reference)
      return deny('OPTIONAL_SERVICE_CONSENT_MISMATCH');
    if (!isTrustedAttestation(proofs.payment, now) ||
        proofs.payment.status !== 'succeeded' ||
        proofs.payment.reference !== proofs.service.paymentReference)
      return deny('SERVICE_PAYMENT_NOT_VERIFIED');
    const cents = Math.round(proofs.service.paidCents * agreement.serviceCommissionBps / BPS);
    if (!intPositive(cents)) return deny('ZERO_COMMISSION');
    return ready('REVIEW_SERVICE_FEE_INVOICE_NO_AUTOMATIC_CHARGE', cents);
  }

  // Network Pass host settlement is NOT a transfer API and NOT an escrow account.
  if (!isTrustedAttestation(proofs.reservation, now) ||
      proofs.reservation.channel !== 'network_pass' || proofs.reservation.cancelled)
    return deny('ELIGIBLE_NETWORK_PASS_STAY_MISSING');
  if (!isTrustedAttestation(proofs.memberPayment, now) ||
      proofs.memberPayment.status !== 'succeeded' ||
      proofs.memberPayment.reference !== proofs.reservation.membershipPaymentReference)
    return deny('MEMBERSHIP_PAYMENT_NOT_VERIFIED');
  if (!isTrustedAttestation(proofs.completedStay, now) ||
      proofs.completedStay.reservationReference !== proofs.reservation.reference ||
      proofs.completedStay.status !== 'completed')
    return deny('COMPLETED_STAY_NOT_VERIFIED');
  if (!isTrustedAttestation(proofs.connectRecipient, now) ||
      proofs.connectRecipient.payoutsEnabled !== true ||
      proofs.connectRecipient.propertyReference !== proofs.authorizedProperty.reference)
    return deny('HOST_PAYOUT_RECIPIENT_NOT_VERIFIED');
  // Never reuse another reservation's ledger or another host's funds.
  // Reconciliation is independently signed and verified by the trusted backend.
  if (!isTrustedAttestation(proofs.reconciliation, now) ||
      proofs.reconciliation.reservationReference !== proofs.reservation.reference ||
      proofs.reconciliation.recipientReference !== proofs.connectRecipient.reference ||
      proofs.reconciliation.settlementAlreadyProcessed !== false ||
      proofs.reconciliation.noRefundOrDispute !== true ||
      !intNonNegative(proofs.reconciliation.eligibleFundsCents))
    return deny('SETTLEMENT_RECONCILIATION_MISSING');
  if (!intPositive(agreement.hostSettlementCents) ||
      agreement.hostSettlementCents > proofs.reconciliation.eligibleFundsCents)
    return deny('SETTLEMENT_AMOUNT_EXCEEDS_ELIGIBLE_FUNDS');
  return ready('MANUAL_SETTLEMENT_APPROVAL_REQUIRED_NO_TRANSFER_EXECUTED',
    agreement.hostSettlementCents);
}
