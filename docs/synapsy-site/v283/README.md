# SYNAPSY — Sites v283

Public preservation of the selected source changes in Sites version **283**, published on 15 November 2026. This dossier extends the [v282 archive](../v282/README.md) without replacing it.

- Official website: https://seva.karimkatlane0.chatgpt.site
- Public entry: https://seva.karimkatlane0.chatgpt.site/superapp
- European directory: https://seva.karimkatlane0.chatgpt.site/europa
- English directory: https://seva.karimkatlane0.chatgpt.site/europa?lang=en
- Account entry: https://seva.karimkatlane0.chatgpt.site/account
- Exact Sites source commit: `d1c9874fe298fca26d7be11a6fbbd9acbb7be45f`
- Previous Sites source: `82a5b7e86c00c514b7aff2927572ccb2c97147df` (v282)
- GitHub parent: `b56b181b5b98eb83df94e0d4b4691f34bb914dda`

## Contents

- [Public release report](PUBLIC_RELEASE_REPORT.md): changes, verification and limits.
- [Source manifest](source-manifest.json): 19 exact source, build-script and test copies, with original paths, byte sizes, SHA-256 and Git blob hashes.
- [Release evidence](release-evidence.json): bounded facts for the verified Sites revision and deployment.

The source selection covers the complete changed text-file set for this release, excluding the generated `worker/index.js`. Files are copied directly from the exact Sites commit. No source code is redacted or silently transformed.

This is a **selected source delta**, not a standalone checkout or deployment package. It contains imports and build references to unchanged modules that remain in the full Sites project. The previous v282 dossier is also a selected preservation package, not a complete application checkout. Combining the two dossiers alone does not produce a runnable full project.

## Scope and privacy

The account implementation is included as code. Actual account profiles, contact details, bank instructions supplied by users, CRM records, database exports, provider credentials, OAuth material, private reports and raw uploads are excluded. Tests use clearly synthetic profiles and receiving-detail fixtures; they are not customer records or evidence of bank ownership.

The compiled worker and full source archive are excluded. Existing host application files, workflows and the v282 dossier are unchanged. Creating this branch does not deploy the Sites application into GitHub Pages, an app store or another hosting provider.

The account form saves optional user-declared receiving details for an agreed future credit. Saving those fields does not connect a bank, verify ownership, initiate a payment or establish an available balance. The directory links to external organisations without claiming partnerships, admission, financing or current property availability.

## Verification

The Sites release gate reported **2,139 tests: 2,138 passed, 1 skipped, 0 failed**; **153 pages, 21,022 links, 1,715 anchors and 1,495 scripts**, with no failures and no dependency vulnerabilities. The exact deployment completed successfully at `2026-11-15T12:41:04.733108Z`.

The host repository's GitHub Actions are a separate verification scope. Their run results can be consulted in the branch's Actions history and must not be confused with the Sites application gate.

## Rights

The source retains the [project copyright notice preserved with v282](../v282/source/COPYRIGHT.md). This dossier does not relicense the original source, third-party dependencies, logos, datasets or external content. External source links retain their respective terms.
