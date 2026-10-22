# URBAN ONE · Booking.com two-route revenue architecture · 22 Oct 2026

## Difference that unlocks parallel progress
Booking.com has paused onboarding **new Connectivity Providers** at https://connect.booking.com/. Existing approved partners' APIs remain operational. This is NOT a global Booking.com API outage.

**Route A — Accommodation supply operations:** `Booking.com -> approved channel manager/PMS -> property-granted scoped connection -> URBAN ONE hospitality SaaS`. Each real B&B must authorize connectivity, permitted processing and contractual support; no guest PII, live room inventory, booking, check-in/out or partner earnings may be implied from code. URBAN ONE must not double bill existing OTA room charges. Stripe collects URBAN ONE's **separately contracted B2B fees** directly from paying operator.

**Route B — Travel demand / affiliate:** Booking.com offers an **affiliate program** for publishers sending travelers to approved services. An affiliate agreement and tracked, qualifying completed booking may generate affiliate commission according to that program's contract. Such commissions are not a Stripe URBAN ONE charge or a payout from a B&B host. Official program: https://w1.booking.com/affiliate-program/v2/index.it.html . The program points eligible publishers to its official networks, including CJ. Current regional eligibility, approval and commission amounts are NOT assumed.

**Managed Affiliate Demand API:** separate, more technical permission requires acceptance as Managed Affiliate Partner, Partner Centre, signed terms, partner Affiliate ID and server-side token, with sandbox testing before LIVE. Prerequisites: https://developers.booking.com/demand/docs/getting-started/prerequisites . Supported inventory/content varies by account and API. Bookings/payments belong to the provider flows and must be verified; do not expose the token or affiliate identifier publicly. Demand overview: https://developers.booking.com/demand/docs/getting-started/overview . Marketing site https://developers.booking.com/demand describes 'Flights' as coming soon; do not assume live low-cost flight inventory or commissions.

## User-facing 24-hour priority content
Only release **rights-cleared URBAN ONE / authorized partner editorial information** in a true authenticated, opt-in preview window no more than 24 hours before general availability. Equal eligibility criteria and no false scarcity. For any actual flight fares, rooms or bookable offers, use the provider's authorized inventory and enforce booking, cancellation, pricing and attribution terms. Do not copy private/pre-announcement OTA rates or customer data to generate early offers.

The checked-in source policy is `packages/marketing/preview-policy.mjs`; this is a **non-production simulator**, not access control. The public landing is `apps/web/travel-preview.html` and social copy is `press/TRAVEL_24H_SOCIAL_POSTS_2026.md`. No live early-access campaign or Meta account publication is confirmed.

## Revenue ledger — never combine revenue streams
1. `B2B_SAAS`: separately contracted EUR/month software fee, Stripe Billing only after approved recurring price, payment mandate and billing lifecycle webhooks.
2. `B2B_SERVICE`: one-off check-in/out workflow consulting or operational service delivered and paid as agreed through merchant Stripe LIVE checkout; tax and reversal handling separate.
3. `DIRECT_SERVICE_COMMISSION`: direct booking/optional service verified via authorized host/provider plus signed platform fee terms, excluded if unfulfilled/refunded/duplicate/OTA-ineligible.
4. `BOOKING_AFFILIATE_COMMISSION`: paid by the affiliate network / Booking partner under its program only if the tracked booking qualifies and program reports earned/settled funds. DO NOT log a click as earned revenue. Stripe merchant payment link is not a Booking.com affiliate tracker.
5. `AIRLINE_AFFILIATE_COMMISSION`: no active provider verified. Require separate airline/aggregator approved agreement and attribution model before offering rates or payouts.

## To pursue commercial partner status
- Read the official Italian Booking.com affiliate landing and the linked official networks; evaluate regional publisher acceptance/terms.
- **Applicant must personally agree to terms, complete account sign-up or identity/OTP steps**. Do not infer partner acceptance from a general chat authorization.
- Only once access approved, generate official compliant affiliate links; **do not invent one**, create an Affiliate ID, copy an unrelated publisher link or publish undisclosed affiliate commission placements.
- To apply as a Managed Affiliate Demand API customer, ask Booking partner staff about eligibility and access; do not assume the affiliate banner program automatically grants Demand API.
- For a supply-side property, obtain its PMS/channel-manager authorization (Booking.com Extranet Account → Channel Manager where available), then onboarding and test reservations through its provider.
- Marketing to low-cost travelers: public, non-impersonating social/press announcements; no automatic DMs, email blasts, uploaded contacts or Meta Custom Audiences on a blanket 'legitimate interest' claim. Check GDPR/ePrivacy and platform policies.
- Payment payout reconciliation to actual merchant bank account is separate from affiliate-network settlement and B&B host settlement.

## Current evidence
`CONNECTIVITY_NEW_PROVIDER_PAUSED` · `AFFILIATE_PROGRAM_EXISTS` · `BOOKING_AFFILIATE_ACCOUNT_NOT_VERIFIED` · `DEMAND_API_ACCESS_NOT_VERIFIED` · `PMS_PROPERTY_AUTH_PENDING` · `FLIGHT_FEED_NOT_VERIFIED` · `STRIPE_B2B_LINK_LIVE` · `REVENUE_NOT_VERIFIED`.
