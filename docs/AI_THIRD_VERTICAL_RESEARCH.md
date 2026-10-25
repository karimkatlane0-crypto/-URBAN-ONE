# Phase three — research and development

Published 25 October 2026: https://urban-one-science.karimkatlane0.chatgpt.site/ricerca . The user explicitly selected Research and Development as the third vertical. Navigation now connects hospitality, property and research pages under the same AI Science Pro plan.

Four editable request templates cover testable hypotheses, draft experimental protocols, static code review and analysis of source excerpts supplied by the user. Prompts ask the model to separate observations, assumptions and inference; they must not claim executed tests or experiments, invent scientific citations, or treat an unread URL as an inspected paper. This is AI assistance, not a provisioned HPC cluster, experiment runner, code execution sandbox or autonomous scientific literature database.

The existing EUR29/month price and 50 completed analyses per paid period are shared across all three areas. The Stripe product, price, hosted checkout, portal, webhook and D1 quota/entitlement backend were not modified. Terms describe the shared areas. Sign-in links on the research page request return_to=/ricerca.

## Verification

Production build, all three inline script syntax checks and diff checks passed. Browser QA exercised every research card and verified its prepared prompt, inspected the sign-in return path and navigated to the property area. The production research route was opened successfully.

A real local provider call through the existing authenticated science handler succeeded with gpt-6-luna in 11,172 ms. The synthetic task was static review of `function mean(values) { return values.reduce((sum, n) => sum + n, 0) / values.length; }`, asking for empty-array behavior and three proposed tests without execution claims. The response identified `0 / 0` as `NaN`, proposed normal, empty and single-value tests, and explicitly stated those tests had not been run. No user data or secrets were included in the prompt. This was a local live API check, not an authenticated hosted customer or Stripe payment test, and is not broad evidence of scientific correctness.

Hosted source commit ff21040f609e4fb1fafd9eb5533728026defa26b. Publication v5, deployment appgdep_6ade1d6b6a80819199bb5a3604c39487, returned succeeded; runtime environment revision 2. Complete source: releases/ai-science-computer/research-source-ff21040.tar.gz . SHA-256: a6126fb2a483c03e1d73d196cbe1edf9330e0fa07ae410e762246f2d6ae39a72 . Credentials, dependencies and runtime state are excluded from the archive.

The authenticated customer purchase-to-access acceptance gate remains open, as do the previously documented tax and payout verification limitations. Claude/Gemini/xAI remain unavailable until separately configured. No new customer acquisition, income, provider certification or scientific validation is claimed.
