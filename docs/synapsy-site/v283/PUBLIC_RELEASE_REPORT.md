# SYNAPSY v283 — Public release report

Published: 15 November 2026. Official origin: `https://seva.karimkatlane0.chatgpt.site`.

## What changed

### A clearer public entry

The homepage presents four starting points: sign in or register, property applications, European resources, and content creation. Existing work areas and service information remain available in expandable sections. The established logo, destinations and old anchors are preserved. Service details remain accessible before agreed payment, including a language-aware service link on the new directory.

### A private account profile

The authenticated account can save contact information, optional organisation and location fields, and optional receiving details for euro credits. Account sign-in remains managed by ChatGPT; SYNAPSY does not collect the sign-in password.

Receiving details are self-declared. Validation checks supported country, format, length and checksum; it does not verify ownership, account currency, bank participation or an available credit. Saving the profile does not connect a bank, execute a transfer, create a payout or enrol the person in marketing, Premium listings or a public contact directory.

Bank details are masked in the interface. Revealing them or exporting a profile revalidates the current session and profile. Revision and profile-generation checks reject stale writes and deletes, including after a profile is deleted and recreated. Profile data remains account-scoped. The public dossier contains implementation and synthetic tests only.

### A European directory

`/europa` and `/europa?lang=en` provide 36 selected references for students, housing, real-estate associations, commercial networks and support programmes. Links, descriptions, categories and dated source references are rendered before JavaScript. Local filters combine words, country and category without sending searches to the listed organisations or storing them.

The directory identifies ARDiS FVG as the current student-support body for the historical ERDISU/ARDiSS pathway. Users must check eligibility, deadlines, terms and availability with each source. Inclusion does not establish a SYNAPSY partnership, professional authorisation, benefit entitlement, funding approval or property availability.

### Consistent public indexing metadata

The sitemap contains 97 public URLs, adding the homepage and European directory in Italian and English. Existing Studio languages are preserved. Each listed location has a fixed-origin canonical, language alternatives and one `og:url`; personal query fields and untrusted request hosts cannot change those values.

Private account, Premium, API, checkout and operational paths remain outside the sitemap. Private responses retain `noindex` directives. Authentication continues to protect account data; robots directives are not an access-control mechanism. The new `/registration` alias opens the existing account page and preserves only the selected language.

The verified platform URL remains canonical. No unverified custom domain, DNS record or search-engine ownership claim is introduced by this release. Sitemap publication does not guarantee indexing, rank, traffic or an indexing deadline.

## Verification evidence

| Check | Recorded result |
| --- | --- |
| Exact Sites source | `d1c9874fe298fca26d7be11a6fbbd9acbb7be45f` |
| Saved Sites version | 283 |
| Deployment | Succeeded at 2026-11-15T12:41:04.733108Z |
| Application tests | 2,139 total; 2,138 pass; 1 skip; 0 fail |
| Public/navigation validation | 153 pages, 21,022 links, 1,715 anchors, 1,495 scripts; 0 failures |
| Dependency audit | 0 vulnerabilities reported |
| Sitemap runtime coverage | All 97 URLs returned 200, the declared language and one matching canonical; no provider fetch while rendering |
| Commercial navigation | All 97 sitemap URLs expose exactly one marked service-details link in the applicable language |
| Source preservation | 19 exact changed source/test files, individually hashed |

The test and link counts describe the recorded release gate, not a guarantee against every possible future defect. GitHub host CI, device compatibility, provider availability, bank verification, external indexing and app-store distribution have separate scopes.

## Preservation and exclusions

The dedicated v283 branch starts from the preserved v282 GitHub commit. Changes are confined to the new `docs/synapsy-site/v283/` prefix. Existing application files, workflows, all previous dossier files and the default branch are retained.

This report excludes account exports, CRM data, customer records, user-provided bank details, private correspondence, OAuth material, secrets and private operational receipts. The selected source files contain only implementation and synthetic test fixtures. The 22 MB compiled worker, raw uploads and the complete private source archive are not part of this public preservation package.

## Next dependencies

1. Use a verified, authorised Search Console or Bing Webmaster property before any explicit indexing submission. The sitemap is already discoverable at the official URL.
2. Establish custom-domain ownership and successful HTTPS deployment before changing canonical URLs or moving traffic.
3. Continue to verify external eligibility, housing availability and association requirements at their sources.
4. Treat any bank integration, payouts, charges or commercial subscription as a separate authorised provider workflow with its own prerequisites and tests.

## Official indexing references

- Google property verification: https://support.google.com/webmasters/answer/9008080?hl=en
- Google crawling and indexing: https://developers.google.com/search/help/crawling-index-faq
- Google sitemap report: https://support.google.com/webmasters/answer/7451001
- Bing site verification: https://www2.bing.com/webmasters/help/add-and-verify-site-12184f8b
- Bing sitemaps: https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed
