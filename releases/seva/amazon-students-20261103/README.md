# SEVA Amazon student guide — 3 November 2026

Public route: https://seva.karimkatlane0.chatgpt.site/amazon

## Delivered

Italian and English student guide, homepage and campus entry points, RSS announcement, sitemap discovery, affiliate disclosure, privacy/cookie explanations, and a shareable SEVA URL. The Amazon destination uses the public tag `seva0a9-21`, verified in the owner's official Amazon.it welcome email dated 2 November 2026. No mailbox content, password, identity document, bank identifier or private student record is included in this release.

The student link uses Amazon's documented dedicated landing page. No price, trial length, commission amount, eligibility result or conversion is promised. The page does not integrate Amazon Seller Central, an Amazon checkout or academic verification. No external ML training uses Amazon program content.

The fixed link carries no visitor identifiers. It is marked `sponsored nofollow noopener`; its referrer policy allows only the SEVA origin on cross-origin navigation. There are no Amazon scripts, pixels or automatic redirects. TXT exports and share controls link back to the SEVA guide; the affiliate CTA is hidden in print.

## Validation

- Build and ESM artifact validation succeeded; 115 automated tests passed, 0 failed on 3 November.
- Added regression coverage for immutable affiliate destination, query/identity non-reflection, public-page database isolation, private-route protection, offline exports, RSS and discovery.
- Browser preview verified homepage English toggle and localized guide navigation, Italian/English content, disclosure and destination attributes, and copy-link fallback on local HTTP.
- Two real SEVA plugin calls succeeded: dated payment readiness and a synthetic 5/100 Wilson conversion calculation. This is not evidence of real sales or customer conversion.

## Unresolved provider checks

Amazon rejected the cloud-browser session before login, including one reload. Therefore the account's registered website list, payout bank account, tax status, commissions and final application review were not verified or modified. The welcome email states that the website review follows three qualifying sales; registration is not proof of completed review or payouts.

The intended site to verify in the Amazon account is `https://seva.karimkatlane0.chatgpt.site`. No bank details were inferred from documents or installed in SEVA. Amazon affiliate payouts and SEVA customer payments are separate flows.

Stripe exposes TEST and LIVE contexts. The SEVA payment-readiness tool returns a dated 2 November assessment: LIVE merchant capabilities were enabled at that check, while commercial SEVA checkout remains disabled and payout destination remains unverified. No fresh Stripe account-capability result or LIVE transaction was obtained during this release.

Publication on the site and RSS is the completed promotion scope. No external outreach, paid advertising, purchases or synthetic commission-generating clicks were executed. No claim of EY certification, university partnership or guaranteed revenue is made.

## Primary references

- https://programma-affiliazione.amazon.it/promotion/student
- https://programma-affiliazione.amazon.it/help/node/topic/GHQNZAU6669EZS98
- https://programma-affiliazione.amazon.it/help/operating/linking
- https://programma-affiliazione.amazon.it/help/operating/agreement/

Current conditions remain authoritative on Amazon. The Amazon consumer destination could not be fetched in this environment; destination format was checked against Amazon's affiliate documentation and rendered link attributes, not by completing enrolment.

## Published evidence

Native Sites version 23 was published successfully on 3 November 2026 at 08:26:07 UTC (09:26 Europe/Rome), source commit `de3e91e0c684b0e1317c1a844ac6ac528365fad2`. The public Italian guide was opened in production and the copy-link button returned “Link copiato.”

The accompanying source archive contains 78 versioned code, test, build, migration and release-document files. Historical screenshots, unrelated release reports and runtime data were excluded. SHA-256: `3525cd76955429dc61b6569fecb806c5c1cd8029151d3a568c148dcc983777bd`.

To reproduce: extract the archive into an empty folder, use Node with `node:sqlite` support, then run `npm run build`, `npm test`, and `npm run validate`. This is the native Sites Worker source; the separate SEVA Enterprise Node application is not deployed by this archive.
