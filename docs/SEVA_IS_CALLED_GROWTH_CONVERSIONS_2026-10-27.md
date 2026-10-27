# SEVA IS CALLED — Organic Launch and Conversion Operations
Version: 27 October 2026. Owner: SEVA project. Scope: publicly published static web edition only.

## GOAL
Move visitors from a useful idea to a real, measurable first action. No claims of OpenAI partnership, real AI response, synchronized DBRELAY, bank payments, earned sales or Google Play approval.

## The published funnel (IT / EN / ES)
- Landing /discover.html -> /studio.html#goals (user enters first goal and verification criterion locally)
- Landing -> /psdm.html (user compares decisions with documented criteria and manually exports JSON)
- Landing -> /mobile.html (user reads Android Chrome PWA installation steps)
- Landing -> manual email composer for opt-in pilot inquiry; no form submissions, unsolicited outbound messaging or data transfer to third-party analytics
- Landing -> user-clicked system share sheet or clipboard, with transparent organic UTM tags

## Core product truth
- Browser-local drafts are usable today and downloadable as JSON; changes are not cloud-synced.
- Decision Studio is deterministic, not model-generated advice, not evidence that a problem has been solved.
- SEVA AI API, cloud DBRELAY, verified identity, commercial payments and native Play release remain independent acceptance gates (issue #82 and #109).

## Conversion definitions; none yet measured across visitors
| Funnel stage | Definiton | Measurement gate |
| --- | --- | --- |
| Visit | An actual visit to /discover.html by a non-bot browser | FIRST PARTY analytics must be enabled with compliant notice, consent if required, and retention/region review; no current counter |
| Trial click | Human click on Create your first goal | Requires first-party event instrumentation; presently NOT tracked centrally |
| Activated | A valid first goal saved in browser | Requires opt-in aggregate instrumentation, cannot infer from page views |
| Decision engaged | At least one valid decision score computed | Requires consented instrumentation; cannot infer from module file downloads |
| Android install | Install confirmed by browser + real device QA | Server cannot infer from guide pageviews |
| Pilot inquiry | Actual voluntarily received email requesting participation | Manual inbox review and opt-in contact record, not an assumed lead |
| Qualified pilot | Explicit confirmed participant, permission to contact and completed consent | Manual reviewer confirmation |

Do not state conversion rates or ROI until both numerator and denominator are collected on the same legitimate visitor cohort. Zero observed measurements is not zero actual activity.

## Campaign pack
**Italy / educational productivity:**
"SEVA IS CALLED. Hai un obiettivo importante? Trasformalo in un piano verificabile, confronta le alternative e porta con te le tue idee su Android. Prova subito le funzioni locali gratuite. Nessun acquisto automatico."

**International / productivity:**
"SEVA IS CALLED — One goal. One verifiable next step. Plan your next move, compare options with transparent criteria, and keep a backup of your work. Browser-first. Android-friendly. Remote AI services are not yet activated."

**Spain / pilot:**
"SEVA IS CALLED. Define un objetivo, compara opciones y lleva tus avances contigo. La edición web guarda los datos localmente. Participa voluntariamente en la fase piloto."

Organic UTM example: ?utm_source=share&utm_medium=organic&utm_campaign=seva_global. UTM parameters identify traffic origin; they do NOT collect conversions without authorized analytics.

## Recommended 2-week growth experiment (proposal, not scheduled)
- Publish launch to a small opt-in professional audience, avoid mass messaging.
- Run two landing-copy variants only after proper measurement is installed, measure actual activated visitors and opt-in pilot replies.
- Build support FAQ with real Android installation and export/import screenshots only once physically verified.
- Before inviting businesses or universities to share personal records, prepare privacy notices, processing agreement and independent account security tests.
- Do not imply OpenAI sponsorship. Avoid claimed third-party logos, revenue promises, guarantees or paid access until real service activation.

## External blockers and partner pathway
- OpenAI Partner Portal authorization is a login permission, NOT a submission receipt or acceptance. Formal application: https://partners.openai.com/partner-application.
- ChatGPT Enterprise sales: https://openai.com/contact-sales/ (form is official; replies not guaranteed).
- API key credit/exhaustion still needs funded project and private server secret; do not publish the secret on Vercel static assets.
- The existing Github PR #107 for SEPA/AI back-end requires separate code review, backend hosting, legal details and payment verification before the commercial release.

## Rollback
Use the previous verified Vercel production deployment if tests fail. No payment, customer data, or server API migration is part of this marketing landing release.
