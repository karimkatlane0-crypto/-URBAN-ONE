# Hospitality AI — focused launch

Published 25 October 2026: https://urban-one-science.karimkatlane0.chatgpt.site/ . The initial vertical is B&B and small hotel operators. This is a commercial positioning and guided-request update to the existing AI Science Pro service, not a new Stripe product or new hospitality provider integration.

The page now offers four editable templates: guest reply drafts, stay offers from supplied prices and conditions, translation preserving the original facts, and revenue/cost scenarios with explicit assumptions. Choosing a template only fills the request field; paid access and provider consent remain required for inference. General research examples remain available. No message is sent, room availability read, booking confirmed or guest payment collected by these templates.

The existing offer remains EUR 29/month and 50 completed analyses per paid billing period. The Stripe product, price, portal, webhook, D1 entitlements and fiscal settings were not changed by this update. Existing limitations on tax configuration, hosted purchase-to-access acceptance and unverified income still apply; see AI_SCIENCE_PRO_BILLING.md.

Validation: production build, inline JavaScript syntax and diff checks passed. Browser checks exercised each of the four buttons and verified the corresponding prompt. No backend changes or new AI provider calls were made. Publication v3 returned succeeded; deployment appgdep_6ade179a74e081918810091b71820182, runtime environment revision 2.

Complete source: releases/ai-science-computer/hospitality-source-f8fca73.tar.gz . Source commit f8fca73f4e788f6d271b8ed09c813f6c3258c6a4 . SHA-256: 58bf818b9b119ef30d7b33f427a86eea3b8c44754c31c5397fee6759e05d4d42 . Archive excludes credentials, dependencies and runtime state.

No customer outreach was sent, no prospects were invented and no profit, customer adoption or time saving was claimed as measured. The next commercial evidence is feedback and a complete authorized customer purchase-to-access flow.
