# SEVA Amazon owner alignment — 3 November 2026

## Delivered scope

- Canonical public guide: https://seva.karimkatlane0.chatgpt.site/amazon
- Owner setup panel: https://seva.karimkatlane0.chatgpt.site/amazon/setup
- Existing account Payments entry: https://seva.karimkatlane0.chatgpt.site/app?section=billing
- Affiliate ID: `seva0a9-21`, previously confirmed from the owner's Amazon.it welcome email.
- Public GitHub integration baseline: PR #127 merged on 3 November 2026; commit `8f04c4515f5e25c1d6a6457f6df7078e5ea5d6e9`.

The owner panel groups website registration, the public student guide, Amazon payment/tax settings and report interpretation. It uses the existing trusted Sites identity check, permits GET/HEAD only, returns no-store/noindex headers and offers only fixed external links. It does not read or mutate the Amazon account, accept documents or banking details, publish campaigns, or mark setup complete from user checkboxes. Its data labels are explicitly dated. Unavailable clicks, orders, commissions and payouts are shown as unavailable, never as zero.

Amazon affiliate purchases and commission payouts remain separate from Stripe-based SEVA Entry access. No shared checkout, automatic payout routing, academic verification, Amazon account approval or provider partnership is implied.

## Checks and limits

128 automated tests passed on 3 November 2026. The four new tests exercise owner access, unauthorized and anonymous requests, preserved language after sign-in, supported methods, no sensitive reflection, fixed external destinations, clipboard success and fallback, and absence from public discovery. Existing student affiliate links and commercial release gates remain unchanged. The database stub rejects any access by these pages.

The browser had persistent infrastructure timeouts before this change. No new browser visual or hosted owner-login verification is claimed. The clipboard check is a JavaScript DOM stub test, not a real browser run. No Amazon or Stripe transaction was executed.

The dated URBAN ONE catalog read on 3 November still identifies its own release as `2026-10-31-dbrelay-release-readiness` and does not verify provider calls. Its GitHub step is historical. A fresh native GitHub read confirms PR #127 is merged; that is evidence about the repository, not an URBAN ONE provider activation.

## Review of supplied 2 November report

The report is historical: it describes Site v20, 110 tests and private plugin preparation. Native Sites metadata now returned v25 before this change; the report must not be used as the latest release state. Its described TEST payment does not establish receipt of real funds. The SEVA tool invocation works in this conversation, but that is not proof of public-directory approval.

The illustrative arithmetic was independently recalculated: 100 accounts × EUR 50 = EUR 5,000 gross; with assumed 22% VAT, EUR 4,098.36 net of that VAT and EUR 901.64 VAT. Ten million accounts gives EUR 500,000,000 gross and EUR 409,836,065.57 net of that assumed VAT. Five synthetic successes in 100 trials gives a Wilson 95% interval of 2.15%–11.18%. These remain examples, not observed adoption or revenue; 22% is not a verified tax treatment for the service.

## Official references checked

- Student destination format: https://programma-affiliazione.amazon.it/promotion/student
- Website list settings: https://programma-affiliazione.amazon.it/help/node/topic/GFZXAJAUR6K6JHR5
- Account review requirements: https://programma-affiliazione.amazon.it/help/node/topic/G8TW5AE9XL2VX9VM
- Payout methods: https://programma-affiliazione.amazon.it/help/node/topic/GKDG94FQSRXSJCGK
- Tax information: https://programma-affiliazione.amazon.it/help/node/topic/G5UBRBXWA25XWWZB
- Payment timing: https://programma-affiliazione.amazon.it/help/node/topic/G63DR893K4DH55XZ

No current student price, commission rate or trial duration is copied from older promotional documentation. Visitors check the current offer on Amazon. Authentication and any required second factor remain on Amazon's own secure surface.
