# Phase two — second vertical: real-estate work

Published 25 October 2026 at https://urban-one-science.karimkatlane0.chatgpt.site/immobiliare . The user selected a second vertical for phase two. The app now provides distinct hospitality and real-estate pages under one AI Science Pro subscription.

The real-estate page has four editable request templates: authorized-data listing drafts, replies to property inquiries, comparisons of user-supplied costs and informational visit checklists. The user must supply and verify inputs. No property catalog is queried, no title/document/conformity check is performed, and no visit, transaction or outbound message is executed. The independent KKUBERA app and its commercial model are not modified.

The existing EUR29/month plan and 50-analysis allowance are shared across both areas. Price, subscription product, payment link, portal, webhook, entitlement logic and quota backend were not changed. Terms now describe the shared areas. Authentication links on the property page request return_to=/immobiliare; completed Stripe checkout still returns to the shared root, from which both areas are available through navigation.

Validation: production build and both inline JavaScript syntax checks passed. Browser QA exercised all four property cards and verified each prepared prompt, the property sign-in return URL and navigation back to hospitality. The published property route was opened in a browser. No new backend code or AI provider calls were introduced, and existing billing tests were not repeated without a code change. Authenticated purchase-to-access acceptance is still not verified by this UI work.

Hosted publication: version 4, deployment appgdep_6ade1a8dd55081918609ba41b2f17b84, returned succeeded, environment revision 2.
Source commit: a2fe7fd2f8b9575f886de1074873ee6f02620808.
Complete source: releases/ai-science-computer/property-source-a2fe7fd.tar.gz .
SHA-256: 85a951e0dba3a59744eb81ec8cfdcdd275f6aa7531bb5b77f65d3eec17c9fb88 .

No customer acquisition, income, professional certification, legal valuation, automated booking or brokerage capability is claimed. Existing Stripe Tax and commercial verification limitations remain as documented in AI_SCIENCE_PRO_BILLING.md.
