# SEVA — Partner Microcommission Programme · Agreement Draft (NOT EXECUTED)
**Prepared 26 October 2026. This is a negotiation template, not accepted Terms & Conditions, a payment mandate, or legal/tax advice.**

## 1. Parties and authority
SEVA (the contracted service provider/platform) and an identified, duly authorized third-party merchant or affiliate network must sign their own programme-specific agreement. The names, legal entities, country, applicable law, programme ID and counterparty signature must be verified separately. Stripe API access does **not** establish any contractual entitlement to a partner's sales or right to use partner data.

## 2. Qualifying transaction and fee
A commission may only be claimed if every criterion holds:
- the partner has expressly permitted SEVA to refer/attribute the conversion under a current, applicable signed agreement;
- the purchase has been completed and successfully paid, delivered/fulfilled as defined in the agreement, recorded as an eligible transaction by the partner with a verifiable partner receipt, and is not refunded/disputed/canceled;
- any contractual validation/cooling-off/return period has elapsed or the contract otherwise expressly defines the eligibility timing;
- the commission amount/formula, taxes, platform processing fees, time limits, threshold and liable payer are agreed in writing;
- data sharing/attribution complies with the relevant privacy and marketing requirements, including choice, transparency, lawful basis and withdrawal rights.

**No earnings for incomplete baskets, started checkout or unconfirmed payments.** A voluntary unfinished-cart recovery service may be sold only with a *distinct* and lawful B2B contract and appropriate consumer transparency. Never charge the end customer for an unfinished order unless there is a separately authorized charge for a disclosed service.

## 3. Referral programme vs Connect marketplace
- **Affiliate/referral:** the partner/network determines qualifying conversions and pays SEVA only according to its signed referral terms and reporting. The bank payout method is that actually verified by the payer; Stripe's ability to accept SEVA's own subscription fees is **not** authority to take the partner's money.
- **Stripe Connect:** if SEVA facilitates the partner's checkout as a platform, a separately onboarded authorized Stripe connected account, correct merchant-of-record / fees / refund-dispute obligations, capability checks and a signed fee agreement are required. Stripe `application_fee_amount` is not a free-standing referral commission.
- Absent those requirements the platform records **candidate evidence only**, does not send transfers, create Stripe fees or credit a spendable wallet.

## 4. Verification, reversal, accounting
Reference each partner conversion by an opaque ID. No personal payment-card data, identity documents or secret keys are stored in GitHub. Deduplicate events; give refunds/disputes a reversal state and never pay out before reconciliation. Use tax/legal review of invoicing, VAT, affiliate disclosures, customer rights and marketing consent before activation. Resolve returns, chargebacks, canceled subscriptions and complaints in the partner contract.

## 5. Consumer and marketing treatment
The customer must knowingly accept any paid product and see clear final prices/recurring terms. Do not interpret a product view, quote or abandoned cart as a contract to pay. Marketing email/cart recovery requires a documented lawful basis consistent with the Italian data protection framework, data minimization and a usable unsubscribe/objection mechanism. Affiliate content must be recognizably disclosed.

## 6. Acceptance gate
This draft remains **NOT ACCEPTED / NOT SIGNED** until the identified partner terms are reviewed by an authorized representative, agreed in writing, and legal/tax/privacy controls pass. An instruction such as `ALL ALLOW` cannot provide third-party acceptance, merchant consent, card authorization or bank mandate.

## 7. Release (BLACK BOX)
| Goal | Required evidence | Status at drafting |
| --- | --- | --- |
| Contract | Identified counterparty, signed schedule, rate/basis, attribution, reversals and payer | BLOCKED |
| Data | Minimal lawful tracking + source receipt | NON VERIFICATO |
| Candidate ledger | Owner-scoped replay/reversal tests in CI | CI pending |
| Settlement | Contractually approved provider-confirmed conversion and reconciliation | NON VERIFICATO |
| Money movement | Authorized settlement rails/Connect payout after KYC and business review | DISABLED |
| Hosting | SEVA HTTPS Node database, persistence, offsite restore, real webhook | BLOCKED |
| Live sales | Stripe TEST E2E → role-scope → mobile QA → legal/tax review | NO-GO |

References: https://docs.stripe.com/connect/marketplace/tasks/app-fees ; https://docs.stripe.com/webhooks ; https://www.garanteprivacy.it/ ; https://www.agcm.it/
