# SEVA × Meta Pages API — Activation gates
- Use a Meta developer app and an authorized Facebook Page, with permissions reviewed for the requested operation (typically pages_manage_posts and pages_read_engagement, subject to Meta policy).
- Store the Page access token and Page ID only in the server's secret manager: SEVA_META_PAGE_ACCESS_TOKEN, SEVA_META_PAGE_ID.
- No credentials in GitHub, browser JavaScript, logs, or public API output.
- Current implementation supports authenticated status and post preview only. POST /api/v1/meta/pages/publish deliberately returns HTTP 503.
- Before enabling publishing: verify Page ownership/role, Meta app permissions, user approval of full post text and link, idempotency, Graph API version, error handling, audit, retries and removal workflow.
- Only authorized Pages can be posted to. No mass posting to unrelated real-estate groups or Pages.
- No public deployment or Meta permission activation is implied by a GitHub merge.
