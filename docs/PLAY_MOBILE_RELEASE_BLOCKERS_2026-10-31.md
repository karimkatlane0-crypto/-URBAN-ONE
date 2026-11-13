# URBAN ONE mobile — release blockers and candidate evidence

Reviewed: 2026-10-31. Package: `com.urbanone.universal`.

## Verified baseline, separate from this source change

The inspected baseline is commit `9fbf423ac0443fef05e6768fd939df43aeadf139` and [Android run 41030890608](https://github.com/karimkatlane0-crypto/-URBAN-ONE/actions/runs/41030890608).

- GitHub artifact `12965991081` ZIP SHA-256: `18ce705024c7411b4745390005db3aa2d42daffc6a3ba699cef26a5cfbf9be6f`.
- Unsigned AAB SHA-256: `4988dd646d0a99056eed9cd6c9051b75facd3062362d945b652a9ab5a038e220`.
- Existing signed candidate SHA-256: `0b2aad7b44edca52f79ff828b4d89239a9807cd51934e5baaa03b243032a3434`.
- All 453 payload entries in the signed candidate match the unsigned AAB, excluding the three signing entries under top-level `META-INF/`.
- All 10 tracked `apps/mobile/www` assets match their bundled copies byte for byte.
- Manifest: versionName `7.0.0`, versionCode `7000001`, minSdk 24, targetSdk 36.
- The bundle contains no `.so` libraries. This observation does not replace device testing.
- Requested manifest permissions are `android.permission.INTERNET` and the app-specific signature-protected dynamic-receiver permission.
- `jarsigner -verify -certs` returned exit 0 and `jar verified`. With `-strict`, it returned exit 4 for a self-signed certificate and a chain not trusted by the local truststore. The missing timestamp is a warning. This is not a strict PASS or proof of Play certificate acceptance.
- The certificate SHA-256 is `11:A6:DE:0C:D4:C0:F7:16:48:85:12:03:D2:D3:C9:B1:BB:0B:B8:1F:88:B2:D4:73:17:CC:26:CC:7D:47:72:7D`. Comparison with the registered Play upload certificate remains required.

No `bundletool validate` execution, physical-device acceptance, Play upload acceptance, review submission or production publication is established by this audit.

## Scope of this source change

The Android discovery page presents the three AI areas as an informational preview. It removes the EUR 29/month offer and links to the external paid AI service. Both workspace navigation links now open the existing local `science.html` screen, which explicitly states that AI analyses are unavailable in this mobile version. Existing modules, forms and scripts are retained.

This change does not activate an AI backend, purchases, billing, or user accounts. The existing signed candidate predates these edits. Once the intended source is finalized, freeze its new commit and release identity, rebuild and sign a new candidate, record its new checksum, and repeat validation. Do not describe the baseline AAB as containing this patch.

## Open gates

1. **Mobile privacy policy.** No dedicated policy page or link was found in the inspected mobile assets. The policy contained in `releases/ai-science-computer/research-source-ff21040.tar.gz`, `public/privacy.html`, describes the separate AI Science Pro service: ChatGPT login, Stripe subscriptions, Cloudflare records and provider calls. It does not cover this local mobile shell accurately. Do not reuse it as the mobile policy without a reviewed, accurate scope. A mobile policy and a reachable public URL remain required; controller details, retention and legal bases must not be invented.
2. **Runtime and declarations.** The embedded Capacitor configuration has no `server.url`; its plugin registry is empty. Relative `/api/science/*`, `/api/public/discovery/search` and `/api/integrations/readiness` requests do not configure a remote backend. Review actual device traffic, SDK behavior, external Maps/catalogue links, data handling, app access and any account flows before completing Data safety.
3. **GPS claim.** The local LAB contains `navigator.geolocation.watchPosition`, but the inspected manifest does not request location permissions. Verify behavior on a physical device and ensure product claims match it.
4. **Store policy.** Complete accurate Financial features, ads, content-rating, target-audience and reviewer-access declarations; review payment policy before restoring paid-service navigation. The absence of a purchase button alone does not close these gates.
5. **Console prerequisites.** Verify developer account identity/type/eligibility, package registration, available tracks, Play App Signing, registered upload certificate and versionCode availability. Follow any applicable closed-testing requirement.
6. **Candidate acceptance.** Validate the final bundle structure and manifest, checksum, signer and full asset provenance. Test the exact candidate on a representative physical device, resolve Console errors, and retain actual review-submission evidence.

## Validation of the source patch

Static checks confirm that local file targets and fragment links resolve, the seven existing HTML modules remain present, and no link to the external AI Science paid-service origin remains in the mobile assets. Inline script bodies are unchanged. These checks do not demonstrate runtime backend operation or store compliance.

Tracking: [issue #125](https://github.com/karimkatlane0-crypto/-URBAN-ONE/issues/125).
