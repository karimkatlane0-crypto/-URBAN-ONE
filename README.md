# URBAN ONE UNIVERSAL — v7.0.0 RC1

Greenfield rebuild. No legacy code is trusted by default.

## Release gates
SOURCE → POLICY → CONSENT → SANITIZE → PROVENANCE → TEST → BUILD → VERIFY → PROVIDER → RECEIPT → EVIDENCE → DEVICE → RELEASE

## Platforms
- Web/PWA: local-first shell
- Android: Capacitor local bundle (no private `server.url` bootstrap)
- iOS: Capacitor local bundle; signing requires Apple toolchain

## Universal Access
Universal means every approved subsystem is reachable through one control plane. It does **not** mean unrestricted access. All privileged actions require RBAC, explicit scopes, consent where applicable, and auditable receipts.

## Security defaults
- deny by default
- no secrets in client bundles
- provider adapters disabled until explicitly configured
- payments/PIS require human approval and provider certification
- PII sanitized before model-provider handoff
