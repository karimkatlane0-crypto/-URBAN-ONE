/** SEVA Double Flywheel: contractual, fully funded marketing benefit preview.
 * No cash credit, wallet, automatic cashback, Stripe refund, or third-party fund use.
 */
function amount(value,name) {
 if(!Number.isSafeInteger(value)||value<0||value>100_000_000)
  throw new RangeError(name+' must be nonnegative integer EUR cents');
 return value;
}
function contractRef(ref) {return typeof ref==='string'&&/^[A-Za-z0-9_.:@-]{3,120}$/.test(ref);}
export function previewFundedMarketingPurchase(input={}) {
 const purchaseCents=amount(input.purchaseCents??0,'purchaseCents');
 const merchantBudgetCents=amount(input.verifiedMerchantBudgetCents??0,'verifiedMerchantBudgetCents');
 const allocatedCents=amount(input.exclusiveAllocatedCents??0,'exclusiveAllocatedCents');
 const contractCapCents=amount(input.contractCapCents??0,'contractCapCents');
 const ownMoney=amount(input.customerMarketingContributionCents??0,'customerMarketingContributionCents');
 const eligible=input.purchaseCompleted===true&&input.paymentConfirmed===true&&
   input.partnerAgreementActive===true&&input.customerTermsAccepted===true&&
   input.partnerConfirmed===true&&input.deliveryVerified===true&&
   input.refundWindowCleared===true&&input.budgetProvenReserved===true&&
   contractRef(input.partnerAgreementRef)&&contractRef(input.fundingReceiptRef);
 // Only independently verified and EXCLUSIVELY RESERVED partner funds count.
 // Customer's marketing contribution is not an external subsidy.
 const potentialBenefitCents=eligible?Math.min(purchaseCents,merchantBudgetCents,allocatedCents,contractCapCents):0;
 const potentialNetAfterSettlementCents=purchaseCents-potentialBenefitCents;
 return {
  currency:'EUR',purchaseCents,customerMarketingContributionCents:ownMoney,
  independentlyVerifiedFundsCents:merchantBudgetCents,
  // Until a real approved discount or reimbursement settles, the buyer owes the quoted price.
  customerDueAtCheckoutCents:purchaseCents,
  potentialBenefitCents,potentialNetAfterSettlementCents,
  potentiallyZeroNetCostAfterVerifiedSettlement:purchaseCents>0&&potentialNetAfterSettlementCents===0,
  confirmedSavingCents:0,confirmedCashbackPaidCents:0,paymentExecuted:false,
  stripeChargeCreated:false,payoutExecuted:false,guaranteedFreePurchase:false,
  status:!eligible?'BLOCKED_FUNDING_OR_TERMS':potentialBenefitCents?'PREVIEW_CONTRACTUALLY_CAPPED':'NO_PARTNER_BUDGET',
  explanation:'Simulazione subordinata a contratto, fondi partner esclusivi e rimborso effettivo. Non è un acquisto gratuito confermato; nessun trasferimento o sconto automatico.'
 };
}
