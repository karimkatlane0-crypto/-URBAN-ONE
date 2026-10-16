# Architecture

Control plane: Web/PWA + Mobile local shell.

Security plane: authenticated user → RBAC scope → consent → sanitization → provenance hash → provider adapter.

Data plane: DB + evidence receipts + provider receipts. No provider is enabled by source code alone.

Finance: AIS/PIS adapters are separate. PIS execution requires human approval, SCA receipt and certified provider runtime.

Relay: disabled until gateway URL, token and owner mapping are present.
