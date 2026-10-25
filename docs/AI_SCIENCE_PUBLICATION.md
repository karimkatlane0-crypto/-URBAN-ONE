# AI Science Computer — public deployment

Published on 25 October 2026 for Karim Katlane (`karimkatlane0@gmail.com`).

Public URL: https://urban-one-science.karimkatlane0.chatgpt.site/
GitHub: https://github.com/karimkatlane0-crypto/-URBAN-ONE

Sites project: `appgprj_6ade0afad7f88191890f8380a8f36b02`.
Source commit: `6874020c8d2df71d4e0785450e98f9bbd438d5e4`.
Saved version: 1.
Deployment: `appgdep_6ade0bc627e081918d8ddffb7fd867f1`, returned `succeeded`.

## Complete hosted source

The public source archive at `releases/ai-science-computer/source-6874020.tar.gz` contains all 118 tracked files from the published source commit, including the lockfile, application routes, shared handler, layout, Sites build integration and worker. It excludes credentials, environment files, dependencies, Git metadata and local runtime state.

SHA-256: `888a20e361ddff3ddef6bd6b04d7c60d883894b860290c9b7f3f776d461da13e`.

Extract into an empty directory and use the included package scripts with Node 22+ and pnpm. The hosting manifest identifies the existing Site. Reuse its project ID for updates rather than registering a duplicate. Hosted environment secrets are managed separately through Sites.

## Verified evidence

- Hosted production page opened successfully in a browser; research prompt suggestions work.
- Production `/api/science/status` returned HTTP 200 and OpenAI `configured_unverified`.
- Anonymous production `/api/science/run` returned HTTP 401 `OWNER_SIGNIN_REQUIRED`.
- Production build completed successfully.
- Shared application validation: 184 tests passed, GitHub CI succeeded, and a live authenticated local OpenAI handler call completed with `gpt-6-luna`.

## Access and remaining gates

The page is public. Model inference requires ChatGPT sign-in as the owner and server-side authorization. The owner email is checked only after a trusted Sites user identity is present. The browser receives no provider keys or workspace token. Runtime secrets were configured as secrets in Sites, outside source and build archives.

Hosted inference under an authenticated owner session is not yet verified: this browser reached the OpenAI sign-in page. Local inference is not claimed as hosted end-to-end verification. Claude, Gemini and xAI remain unconfigured. There is no public unlimited API-credit access, production multi-tenant billing, autonomous code execution, certified scientific computation or new Android store release.
