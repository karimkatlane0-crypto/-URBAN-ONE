# SEVA — Mobile Omnichannel / Opt-in Notifications / WhatsApp · BLACK BOX

**Deployment status:** source candidate, not a production deployment or a new APK.

## Product behavior and costs
1. **PWA web mobile**: installable when the verified origin supports HTTPS and the PWA manifest/service worker. The source runs over web; Android offline v2.4.2 is a separate limited binary.
2. **In-app inbox**: signed-in SEVA users explicitly enable notices. Default disabled. When a goal is marked `done` or `blocked`, only that account receives a generic inbox notice. The message omits goal titles and personal data. Each user may mark read or erase all notices and revoke opt-in. Retains latest 50 per user.
3. **Browser/device notifications:** only optional permission for foreground UI while app is open. The center's browser toggle records preference but **this implementation does NOT send remote push**, schedule background notifications or register a push subscription. Native permission is requested only on user tap. No claim of universal Android/Chrome support.
4. **WhatsApp:** manual `wa.me/?text=...` tap point opens a composer with **only the text the user typed**; user selects recipient and sends. No message automatically delivered, no WhatsApp Cloud API/Business access, no promise of free bulk automated messaging or WhatsApp template eligibility. Click-to-chat is a user-initiated link, not a delivery guarantee.
5. **Omnichannel taps:** same-origin goals/store/simulator links, no unapproved data syndication to partners. Stripe remains sales-disabled until a real webhook and entitlement test.
6. **Financial integrity:** no commission accrues on abandoned carts; Double Flywheel is an evidence-dependent preview, NOT a funded free purchase or payout. Linked legal/contract acceptance remains separate.

## Security/consent
- Authenticated owner-scoped SQLite tables; session cookie required. Mutating API uses same-origin protection.
- Preferences `GET/PUT /api/notifications/preferences`, messages `GET/DELETE /api/notifications`, read status `POST /api/notifications/read`.
- No authenticated endpoint to message another user or send a WhatsApp message. Backend never calls third-party messaging services.
- Clear preferences and inbox using `DELETE /api/notifications`; default all off.
- Minimize content and never cache `/api/` in the service worker. No private inbox in `localStorage` or offline PWA cache.

## Proof gates
- CI requires unit and HTTP tests, including opt-in, cross-tenant denial, revocation and UI asset.
- Web deployment must return HTTP 200 to `/health`, `/`, and `/notifications-ui.js`, support distinct user accounts and durable SQLite.
- A physical Android/Chrome PWA test with HTTPS origin and system permission must precede claiming a working device notification. Genuine **background push** requires user subscription, VAPID/server dispatcher, HTTPS/SW event and provider receipts, which are NOT included.
- Any automated WhatsApp outbound messaging needs separate recipient opt-in, provider agreements, templates and cost/compliance controls. Not activated.
- App-store monetization of digital goods may require Google Play Billing/approved EEA alternative billing program; Stripe alone doesn't prove compliance.

References: WhatsApp Help Center https://faq.whatsapp.com/5913398998672934 ; Google Play https://support.google.com/googleplay/android-developer/answer/10281818 ; SEVA release issue #82.
