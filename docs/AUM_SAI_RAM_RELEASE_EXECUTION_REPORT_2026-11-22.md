# AUM SAI RAM — Release Execution & Deployment Evidence

**Evidence date:** 22 November 2026  
**Repository:** `karimkatlane0-crypto/-URBAN-ONE`  
**Release decision:** `PREVIEW VERIFIED — PRODUCTION BLOCKED`

## Executive decision

The AUM SAI RAM implementation is merged into the TITANS preview branch and the corresponding Vercel Preview deployment is `READY`. This does **not** constitute a Production release.

Production promotion is withheld because the final accessibility/content review still has open findings, Studio navigation browser acceptance was inconclusive, and the preview branch is substantially diverged from `main-@URBAN-ONE`. The divergence must be reconciled through a reviewed integration PR; no force-push or direct overwrite of main is appropriate.

## Source control

- PR #254: https://github.com/karimkatlane0-crypto/-URBAN-ONE/pull/254
- PR state: merged.
- Merge commit: `4ac2d0c90a036f30b89c95889a7a425bff3b2910`
- Preview/base branch: `feat/titans-live-github-observability-2026-11-19`
- Feature branch: `feat/aum-sai-ram-free-engagement-2026-11-22`
- Feature head at verification: `bd66b0a7da14f11240620207124836b75686c84f`
- Main branch comparison at verification: preview branch was 98 commits ahead and 99 behind `main-@URBAN-ONE`; compare status `diverged`. Do not merge the preview branch wholesale into main without reconciliation.

## Included source files

1. `apps/web/aum-sai-ram.html`
2. `apps/mobile/www/aum-sai-ram.html`
3. `apps/web/titans-enterprise-studio.html`
4. `apps/mobile/www/titans-enterprise-studio.html`
5. `tests/aum-sai-ram-free-engagement.test.mjs`

The Web and Mobile AUM page files were verified byte-identical (blob SHA `472ede57d678c0aefb576c5a9438f88bb09ceadb`). The test file blob SHA was `0fddfec71c9710a03542a9d865d9147150015c53`.

## Automated verification

- CI run [45069089268](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/45069089268): completed successfully; `verify` job passed.
- Android compatibility run [45069089260](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/45069089260): completed successfully.
- Android emulator API 24: passed.
- Android emulator API 36: passed.
- Previously recorded aggregate test output: 358/358 passed.

### Retained CI artifacts

| Evidence | Artifact ID | SHA-256 |
|---|---:|---|
| Evidence ledger | 14772318377 | `3d13ef67f0b4e2010c4322f92527dd09f0b608a6d3b3ed9ede793a0800955740` |
| Android API 24 | 14772547911 | `4362f7ec877f28038912a2fe655b4cab8bc4f7c01695533f2e241a42cd6abda2` |
| Android API 36 | 14773015056 | `9b62f78d5c9d540ecfeda8ae37e0acf1560374badafa25e05009f441a0a17cf3` |

Artifact ZIP downloads:
- [Evidence ledger ZIP](https://api.github.com/repos/karimkatlane0-crypto/-URBAN-ONE/actions/artifacts/14772318377/zip)
- [Android API 24 ZIP](https://api.github.com/repos/karimkatlane0-crypto/-URBAN-ONE/actions/artifacts/14772547911/zip)
- [Android API 36 ZIP](https://api.github.com/repos/karimkatlane0-crypto/-URBAN-ONE/actions/artifacts/14773015056/zip)

GitHub reported these artifacts as unexpired, with expiry 20 February 2027, at the time of verification.

## Vercel deployment

- Project: `titans-enterprise-studio`
- Project ID: `prj_c3nFCtsnHftz5WJP8YF38gS5oBEL`
- Deployment ID: `dpl_4E3EtWGb8bfgM2biqibaUiMtTyVY`
- State: `READY`
- Target: `Preview` (not Production)
- Deployed commit: `4ac2d0c90a036f30b89c95889a7a425bff3b2910`
- Preview URL: https://titans-enterprise-studio-iwm7sonu3-karimkatlane0-7632.vercel.app
- AUM Web page: https://titans-enterprise-studio-git-feat-tit-1f647a-karimkatlane0-7632.vercel.app/apps/web/aum-sai-ram.html
- AUM Mobile page: https://titans-enterprise-studio-git-tit-1f647a-karimkatlane0-7632.vercel.app/apps/mobile/www/aum-sai-ram.html

Vercel project SSO protection is enabled for non-custom-domain deployments. Browser checks previously verified both AUM pages render and the 390px mobile view has no horizontal overflow. Browser acceptance of the Studio navigation itself remains inconclusive.

## Outstanding release gates

1. **Accessibility:** correct the light-mode accent contrast for eyebrow/brand/kicker labels and verify contrast against WCAG requirements.
2. **Language metadata:** visible page copy is predominantly English while the document declares `lang="it"`; either translate the page fully into Italian or set the correct document language and mark any other-language fragments appropriately.
3. **Navigation acceptance:** repeat a browser test on the actual TITANS Studio page and verify the AUM SAI RAM link opens correctly on Web and Mobile.
4. **Branch integration:** reconcile the preview branch with `main-@URBAN-ONE` in a dedicated reviewed PR. The branches are diverged; do not force-push.
5. **Production verification:** build and inspect a Production-targeted deployment, confirm domains/access controls and smoke-test all required routes before promotion.
6. **WordPress:** public programme page is accessible; homepage cache/link replacement remains unverified.
7. **Global communications:** sent institutional messages do not prove forwarding or delivery to every Sai Centre worldwide.

## Published programme terms

- Basic CMS and editorial support for eligible centres/non-profits: USD 0/month.
- Reference value USD 200/month fully waived.
- Default revenue share: 0%.
- Any optional joint fundraising, sponsorship or commerce requires a separate written agreement.
- Donations and centre funds remain under the organisation's direct control.
- Explicit statement that the initiative is independent and not affiliated with or endorsed by SSSIO.

## Release governance

The explicit user authorization to execute RELEASE was received on 22 November 2026. It does not waive the outstanding technical release gates. No Production promotion, production-domain reassignment, force-push, or merge to `main-@URBAN-ONE` was performed.

**Final classification: PREVIEW RELEASE VERIFIED. PRODUCTION RELEASE BLOCKED PENDING ACCESSIBILITY, LANGUAGE, NAVIGATION, AND BRANCH-INTEGRATION VERIFICATION.**

AUM SAI RAM — LOVE ALL · SERVE ALL.
