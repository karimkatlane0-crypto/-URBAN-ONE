# TITANS — Exchange Rubrica P2P
## Approved TEST specification

**Status:** specification approved; BUILD initiated; VERIFY pending; RELEASE not authorized.  
**Date:** 2026-11-20  
**Scope:** documentation and TEST-only design. This document does not authorize production activation, data import, invitations, payments, deployment, or release.

### 1. Purpose
Define a voluntary peer-to-peer (P2P) connection model for Exchange Rubrica within TITANS. Each participant remains in control of their own account, contacts, data, and sharing decisions.

### 2. Authorized document sources
- The designated GitHub repository is an authorized source for versioned project specifications and implementation evidence.
- Google Drive may be used as an authorized document source only when the relevant account, folder, and permissions are explicitly connected and verified.
- A source being named here does not establish that it is connected, accessible, synchronized, or authorized for every file.
- Repository and Drive copies must retain provenance, version history, and access controls. No implicit synchronization or broad sharing.

### 3. P2P connection rules
- Connections between people are voluntary and initiated by the relevant account holder.
- Private by default; no indiscriminate discovery, harvesting, or sharing of address books.
- Search is limited to the user's own contacts and profiles whose owners have explicitly opted into discoverability.
- No automatic invitations, messages, contact imports, or actions on behalf of another person.
- A connection is not identity proof, legal representation, delegated authority, or consent to unrelated processing.

### 4. Identity and data protection
- Use a unique internal account identifier; do not expose email addresses or phone numbers as public identifiers.
- Keep identity attributes and contact details separated from public/discoverable identifiers.
- Apply least-privilege access, tenant isolation, encryption in transit and at rest, data minimization, and privacy-preserving audit logs.
- Require explicit, purpose-specific consent before connection, import, or sharing.
- Provide revocation and disconnection controls. Handle deletion subject to applicable legal retention duties.
- Never place access tokens, secrets, emails, phone numbers, or sensitive CRM data in URLs or deep links.

### 5. Responsibility and legal limits
- Each participant is responsible for their own actions and for permissions they grant.
- No participant or system component automatically assumes authority or responsibility on behalf of another participant.
- This specification does not waive, exclude, or limit any responsibility that cannot lawfully be excluded, including mandatory statutory duties.
- Any external terms, notices, and liability allocation require review by qualified legal counsel before production use. This document is an operational specification, not legal advice or a validated contract.

### 6. TEST-only financial boundary
- P2P testing must use simulated events and test data only.
- No real-money transfers, wallet activation, payment capture, settlement, or live refunds are authorized by this specification.
- Any test ledger must be isolated from production, idempotent, auditable, and clearly labeled TEST.

### 7. Minimum acceptance tests before VERIFY can pass
1. Account ownership and tenant-isolation tests prevent cross-user contact access.
2. Consent is required independently for connection, import, and each sharing purpose.
3. Revocation immediately blocks subsequent access and sharing; audit evidence records the change.
4. Deletion and retention behavior follows documented legal obligations.
5. Unauthorized access, privilege escalation, duplicate contacts, and identifier enumeration are tested.
6. No automatic invitation, message, contact import, or third-party address-book scan occurs.
7. Deep links reject unknown hosts, open redirects, expired/replayed tokens, and unauthorized destinations.
8. TEST ledger events are idempotent, balanced, simulated, and isolated from LIVE systems.
9. Audit records preserve provenance and do not expose secrets or unnecessary personal data.
10. Repository and Drive permissions are independently checked; Drive integration is not considered verified until an authorized connection and file-level access test succeed.

### 8. Delivery gates
- **BUILD:** implement only in an isolated TEST branch/environment; document code, data flows, permissions, and tests.
- **VERIFY:** independently run security, consent, revocation, tenant-isolation, deletion, deep-link, and TEST-ledger tests; retain reproducible evidence.
- **RELEASE:** requires separate, explicit human authorization after verification. No automatic merge, deployment, publication, or LIVE activation.
- **SCALE:** prohibited until a release is explicitly authorized and independently verified.

### 9. Current execution record
- Specification approved by the user on 2026-11-20.
- Saved to a dedicated GitHub documentation branch; not merged.
- Google Drive write/access was not performed or verified in this execution.
- No production data, personal address books, invitations, payments, or external user records were touched.
- Current gate: **BUILD — documentation saved; implementation not yet verified. VERIFY — pending. RELEASE — blocked/not authorized.**
