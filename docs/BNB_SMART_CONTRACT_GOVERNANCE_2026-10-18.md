# URBAN ONE — B&B Smart Contract Gates (off-chain)

Status 2026-10-18: **technical draft / not legally signed / no automatic financial execution**.

## Model

The pure module `packages/bnb/contract-gates.mjs` evaluates four operations: monthly B&B subscription, direct-booking commission, optional service commission, and Network Pass host settlement.

It returns only `BLOCKED` or `READY_FOR_HUMAN_REVIEW`. No payment, provider request, recurring subscription, invoice, card debit, fund transfer, or bank movement is performed.

## Required prior evidence

A private signed agreement, scope-specific property authorization, verified pricing and fee terms, lawful data processing, transparent refund/tax terms, and a server-verified provider or financial event are required as appropriate. Do not place signed agreements, credentials, banking or guest data in public GitHub.

An attestation with `verified:true` is **NOT** self-authenticating. Trusted server components must verify original evidence and provenance before evaluating a gate. Human review remains necessary. All actual Stripe actions require separately approved API calls, signature-verified webhooks, idempotency, reconciled payment and merchant responsibilities.

## Commercial controls

- Suggested EUR 99/month host SaaS is a **non-binding illustration**; Stripe B&B products previously observed inactive and without prices.
- Booking.com/OTA stays are ineligible for **automatic direct-booking commissions**. Avoid charging accommodation already collected by Booking.com or the property.
- Optional upsells require a voluntary purchase, fulfillment and verified payment.
- A Network Pass host settlement additionally requires an explicit `completedStay.status = completed`, a reconciliation bound to the **same reservation** and the **same Stripe Connect recipient**, `settlementAlreadyProcessed = false`, sufficient eligible funds and human review. Missing or mismatched fields block review. Stripe is not an escrow account.
- Each verification must be produced by a trusted server reviewing the underlying events; booleans or references supplied by a guest, host, or browser alone are not proof. The policy is an advisory gate, not an idempotent payment engine.
- The first pilot requires a genuinely authorized host, PMS and operational transaction evidence.
- No costs, charges or transfers without separate specific approval.

## Status and references

Booking.com Connectivity onboarding for new providers is paused; no URBAN ONE live property connection is verified. See https://connect.booking.com/.

No EY, IEEE, Booking.com, Stripe or OpenAI approval/certification is claimed. Review applicable Italian/EU legal, consumer, tax and data protection requirements before signature.

Related: [Issue #24](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/24), [PMS pilot](BOOKING_COM_PMS_READ_ONLY.md), [zero-spend plan](BNB_FIRST_CUSTOMER_ZERO_SPEND_RUNBOOK_2026-10-18.md).
