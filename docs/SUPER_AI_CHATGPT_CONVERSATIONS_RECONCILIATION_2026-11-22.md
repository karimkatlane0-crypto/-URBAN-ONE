# SUPER.AI — ChatGPT Conversations & Rooms Reconciliation
**Date:** 2026-11-22  
**Status:** ACCESS BOUNDARY CONFIRMED / COMPLETE CHAT EXPORT NOT YET PROVIDED  
**Branch:** `feat/super-ai-unified-platform-20261122`

## 1. Scope extension
The universal archive scope explicitly includes:
- ChatGPT conversations and message history;
- ChatGPT Projects, Rooms/workspaces and their conversations;
- Codex conversations, tasks, code reviews and handoff material where an export or authorized connector exposes them;
- attachments and files referenced by conversations;
- decisions, requirements, architecture, code snippets, issue/PR references, tests, delivery records and superseded alternatives.

This scope extension does not imply that the current session has account-wide access to private ChatGPT history.

## 2. Access evidence and limits
A prior access review (2026-11-03) established that uploaded materials did not contain a complete ChatGPT transcript. Shared links were not equivalent to transcript access. Available Library/project reports could be reviewed, but this was not a live audit of all private conversations.

The repository's `CONNECTORS_AND_PRIVACY.md` also states that Sign in with ChatGPT may provide identity, but does not provide access to a user's ChatGPT conversations.

In this session, the Library semantic search found project artifacts and references to earlier ChatGPT conversations, but did not return a complete export such as `conversations.json` or `chat.html`. Prior context summaries and the current conversation are useful evidence, but are not a substitute for the full account history.

Therefore:
- Full account chat history: NOT ACCESSIBLE from current connected tools.
- ChatGPT Projects/Rooms: NOT exhaustively enumerated or read.
- Codex conversations/tasks: NOT exhaustively enumerated or read.
- Library files and repository records: PARTIALLY SEARCHED; reconciliation remains in progress.
- No access-control bypass, private API scraping, session-cookie reuse or unauthorized export is permitted.

## 3. Complete-history ingestion procedure
To include the full user-owned ChatGPT history, the user must obtain the official account export through ChatGPT Settings → Data Controls → Export Data, then provide the resulting archive in this workspace or Library.

Once an export is available:
1. Preserve the original archive read-only and record filename, size, timestamp and SHA-256.
2. Inspect archive manifest and file structure before extraction.
3. Parse conversation metadata, message trees, timestamps, titles, project/room identifiers where present, attachments and references.
4. Preserve message ordering, branching, edits, deleted/omitted indicators where represented, and source IDs; never flatten away provenance.
5. De-duplicate by stable source identifiers and content hashes while preserving all references and version history.
6. Exclude credentials, access tokens, private keys and unrelated sensitive data from indexing and downstream model context.
7. Classify content by project/domain and extract decisions, requirements, deliverables, code, tests, dependencies, unresolved issues and release claims.
8. Link every extracted claim to its originating conversation/message and attachment.
9. Reconcile each claim with Library files, GitHub commits/PRs, CI results and external provider evidence.
10. Produce a searchable conversation index, project timeline, decision ledger, contradiction register and evidence matrix.
11. Keep source archive and raw parsed records access-controlled; use tenant/project isolation and retention controls.

For Business/Enterprise workspaces, organization-managed export and administrator access may be required; do not assume a personal export includes organization-controlled records.

## 4. Conversation/Room index design
Create one navigation index without merging project data domains:
- SUPER.AI — Universal Command & Decision Log
- TITANS Enterprise Studio / GO ENTERPRISE GLOBAL
- INSIGHTS.ai / INSIDERS Financial Insights
- SEVA Intelligence Studio / SEVA CRM
- SYNAPSY
- KKUBERA Discovery / AI Match
- URBAN ONE Workspace / Universal 36
- GITA.IA
- Maps Europa
- Partner Onboarding / CRM / Marketing
- Codex Engineering / DevOps / Release Evidence

Each indexed conversation should carry: conversation ID, title, project/room, created/updated timestamps, source archive path, message IDs, attachments, canonical repository/branch/PR, decision status, evidence status, privacy classification and supersession links. This is a target schema, not a claim that all source records are currently available.

## 5. Governance
- Conversation content is source material, not automatically an approved current requirement.
- Resolve contradictions by timestamp, explicit user decision, source provenance and current verified implementation; preserve the losing alternatives as superseded history.
- Do not treat assistant claims in old chats as independent evidence.
- Do not export conversations or attachments to external services without explicit authorization and data minimization.
- Keep all source conversations immutable; derive searchable indexes and normalized records separately.
- No merge, deployment, public release, live payment operation or marketing activation is authorized by this indexing task.

## 6. Non-claims
This document does not claim that all ChatGPT conversations, Projects, Rooms, Codex sessions or messages have been accessed, exported, indexed or reconciled. Completion requires the official export or another explicitly authorized and technically available complete data source, followed by integrity and coverage verification.
