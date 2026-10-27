# SEVA — PSDM Decision Studio + ChatGPT Sites access gate (27 October 2026)

## Scope and provenance

- Input: owner-provided Android screenshot showing an account chooser on https://auth.openai.com for "SEVA — Intenti, obiettivi e valore". The screenshot contains no visible authentication error or successful post-login callback. Do not embed personal account information or OAuth redirect/query strings in issue comments/logs.
- The live https://seva.karimkatlane0.chatgpt.site/ is a **separately hosted ChatGPT Site**. Its identity gate and sharing settings are administered in Sites; apps/seva-enterprise is a separate Node application with email/password and HttpOnly cookie sessions. A GitHub commit does not publish changes to the Site.
- A successful ChatGPT account chooser or sign-in alone does not grant access to connected apps, Stripe payments, OpenAI API inference, an SEVA Enterprise account, or a published Android release.
- OpenAI sign-in reference: https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt
- ChatGPT Sites sharing/access: https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites

## PSDM module implementation (source branch only)

PSDM = Problem Solving & Decision Making (decision support, **not** PSD2 bank permission).
- A self-contained, mobile-responsive /psdm.html with up to five alternatives, four weighted criteria, user-assigned 0–5 scores, evidence notes, tie handling and manual JSON export.
- psdm-engine.js calculates transparent weighted rankings with declared input validation and **no remote AI, browser storage, purchases, payments, or claimed proof of outcome**.
- Accessible from Enterprise Command Center after its existing SEVA login; standalone route itself is local-only and does not persist customer data to backend.
- Test suite covers deterministic scoring, tied top options, missing evidence, invalid inputs, and route/static asset presence. CI must run before merging.

## Access acceptance gates (NO fake completion)

1. On a phone, open the exact hosted SEVA URL. Select the authorized ChatGPT account on the official account chooser, review permissions and complete the UI flow (owner action).
2. Confirm browser returns to the **same intended SEVA host** without a blank page, repeated login, access denial, or untrusted redirect. Do not copy or share authorization code, state, cookies, authorization headers or the entire callback URL.
3. Inside Sites, confirm Share > Who has access includes the selected ChatGPT account or allowed workspace; avoid making private customer data public to work around a login failure.
4. Test a visitor session: GET /api/student is owner-scoped; a second authorized test account must not see account A's profile. A service authentication header is not visitor identity.
5. Independently deploy and test Enterprise Node if needed: origin/HTTPS, account registration, HttpOnly cookie, CSRF, DBRELAY isolation after restart, safe expiry/logout, no cross-tenant data. Never infer Enterprise login success from Sites login.
6. Confirm PSDM source tests and mobile usability. Publishing to Sites requires a separate authorized Sites update and external acceptance test.
7. Stripe LIVE / autonomous purchases remain OFF; OpenAI provider credit_balance_exhausted from 26 October remains an independent blocker until retested.

## Diagnostic classification

- **Observed:** ChatGPT sign-in account picker presented by https://auth.openai.com, and the hosted SEVA title.
- **Not observed:** submitted consent, return redirect, valid application session, authenticated student profile, resolved hosting/Stripe/AI blockers.
- **Corrective work prepared:** deterministic PSDM decision UI as isolated Enterprise code change and repeatable end-to-end access checklist.
- **GO/NO-GO:** source-only feature until CI review; commercial SEVA remains **NO-GO**.

Do not use sign-in alone to assert OpenAI partnership, payment permissions, production availability, or public sales readiness.
