# Copernicus / Sentinel satellite layer — URBAN ONE v7

Status: source-ready catalogue integration. This feature builds bounded, user-initiated search plans against the official Copernicus Data Space Ecosystem (CDSE) STAC catalogue. It does not automatically download imagery, run processing jobs, or embed provider credentials.

## Official service

- Copernicus Data Space Ecosystem: https://dataspace.copernicus.eu/
- CDSE API overview: https://documentation.dataspace.copernicus.eu/APIs.html
- STAC catalogue documentation: https://documentation.dataspace.copernicus.eu/APIs/STAC.html
- STAC API: https://stac.dataspace.copernicus.eu/v1/
- STAC Browser: https://browser.stac.dataspace.copernicus.eu/

The implementation uses the documented STAC search endpoint:

`POST https://stac.dataspace.copernicus.eu/v1/search`

## Supported launch collections

The first controlled set is intentionally small:

- `sentinel-1-grd` — Sentinel-1 Ground Range Detected (SAR).
- `sentinel-2-l1c` — Sentinel-2 Level-1C (optical).
- `sentinel-2-l2a` — Sentinel-2 Level-2A (optical; default).

More collections can be added after API and product-level validation.

## URBAN ONE API

### Policy

`GET /api/public/satellite/copernicus/policy`

Returns the provider, supported collections, catalogue/browser endpoints, and usage/privacy rules.

### Search plan

`POST /api/public/satellite/copernicus/search-plan`

Example request:

```json
{
  "collection": "sentinel-2-l2a",
  "bbox": [13.70, 45.60, 13.85, 45.70],
  "start": "2026-09-01",
  "end": "2026-10-17",
  "cloudCoverMax": 15,
  "limit": 10
}
```

The response contains a POST request plan for the official STAC endpoint. Bounding boxes are WGS84 `[west,south,east,north]`, result limits are capped at 100, and optical collections can be filtered by `eo:cloud_cover`.

## Separation from INSPIRE

URBAN ONE keeps two distinct public geospatial paths:

1. **EU INSPIRE / data.europa.eu** — discovery of public territorial datasets, cadastral parcels, buildings, addresses, orthoimagery and other official spatial themes.
2. **Copernicus / Sentinel** — Earth Observation satellite-product discovery through CDSE STAC.

Satellite observations are not cadastral proof, legal title evidence, or a natural-person identity source. The satellite path must not be used to infer property ownership or enrich personal identity.

## Operational gates

- Catalogue discovery is public and user-initiated.
- Product download/processing remains a separate operation and must respect provider quotas and authentication requirements.
- Provider licence, attribution and usage terms remain authoritative.
- No Copernicus credentials or tokens are stored in source code.
- CI tests validate bounding-box controls, supported collection allow-listing, cloud-cover filtering and non-automatic download behavior.
