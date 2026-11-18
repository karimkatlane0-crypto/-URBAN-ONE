# SEVA TITANS — Research, Consent & Calendar Candidate

Date: 2026-11-18
Branch: feat/seva-titans-research-consent-calendar-2026-11-18
Base: main-@URBAN-ONE
Predecessor: PR #191 (People & Browser local prototype), already merged.

## Delivered in this candidate
- Public/professional research handoff from email, published professional phone or professional name/organization to Google or Bing, only after per-query acknowledgement.
- No reverse-lookup API, scraping, private-person identification or automated profiling.
- Local evidence ledger with subject, source URL, user note, timestamp and explicit not-independently-verified state.
- Contact selection for vCard export; existing hub continues to provide local CSV/vCard import and CSV export, with selection support.
- Selective sharing-request drafts for one or more local contacts, chosen fields, recipient and purpose.
- Manual recording of accept/deny only when an external evidence URL is supplied. Acceptance remains unverified and does not transfer any contact data.
- Google Calendar prefilled event handoff with attendee and time; user must review and manually save/send in Google.
- Separate account identities retained; no OAuth credentials, tokens or server-side writes.

## Safety boundaries
- Public availability is not blanket permission to contact or share.
- No email, SMS, contact transmission, calendar API write, event creation or invitation send.
- No contact data is sent to Google/Bing until the user submits the explicitly acknowledged research form.
- Browser localStorage is an unencrypted prototype, not a secure CRM.
- No automatic account merging or synchronization.

## Verification and release gates
1. Run repository CI and real-browser tests on this branch.
2. Test input validation, CSV/vCard parsing, selective export, time-zone behavior, keyboard/screen-reader behavior and storage failure.
3. Build authenticated backend storage with encryption, tenant isolation, RBAC, audit, retention and backup/restore.
4. Obtain separate OAuth consent per Google identity with minimum People API / Calendar scopes; verify identity and revocation.
5. Implement recipient-authenticated share requests, expiry, field-level permission, proof verification, rejection and revocation.
6. Independently review GDPR lawful basis, transparency, minimization, retention and data-subject rights.
7. Production publication requires a separate explicit approval.

## Status
BUILD: candidate committed in a feature branch.
VERIFY: pending CI and browser run.
RELEASE: not authorized.
SCALE: blocked on backend, OAuth, identity, privacy/security review and restore evidence.
