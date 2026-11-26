# EU-27 × INSPIRE 34-theme source inventory

**Status:** inventory scaffold; all country/theme cells are `NOT_ASSESSED`. This is not evidence that a dataset exists, is accessible, is complete, or is reusable.
**Snapshot date:** 2026-11-26  
**Coverage:** 27 EU Member States × 34 INSPIRE themes = **918 assessment cells**.  
**Scope convention:** `country_iso2` uses ISO 3166-1 alpha-2 (Greece = GR); `eu_country_code` records the EU institutional code (Greece = EL).

## Purpose

The companion CSV is a normalized assessment matrix. It deliberately does not pre-populate dataset names, licence grants, service endpoints, CRS, coverage or freshness. Those values must be verified against the authoritative metadata record and publisher terms before ingestion or republication.

## Discovery order

1. Search the European Data Portal for INSPIRE and other public-sector geospatial records: https://data.europa.eu/
2. Resolve country-level governance and authoritative national contact points using the European Commission INSPIRE National Contact Points directory: https://knowledge-base.inspire.ec.europa.eu/national-contact-points_en
3. Consult the INSPIRE country implementation pages for country-specific context: https://knowledge-base.inspire.ec.europa.eu/tools/inspire-your-country_en
4. Resolve theme identifiers and controlled vocabulary against the EU Vocabularies INSPIRE theme register: https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdataset%2Finspire-theme
5. Prefer GeoDCAT-AP/ DCAT-AP metadata and documented national catalogue endpoints where available. For Italy, the RNDT GeoDCAT-AP endpoint documents conversion of national geospatial metadata to RDF/XML or JSON-LD: https://geodati.gov.it/geoportale/eng/strumenti-en/geodcat-ap-endpoint

## Important 2026 service transition

The European Data Portal announced that, from 1 July 2026, INSPIRE datasets are searchable and accessible through data.europa.eu; INSPIRE Registry content moved to EU Vocabularies and the former INSPIRE Geoportal was retired. The central INSPIRE Reference Validator was discontinued on 1 April 2026; open-source validator software may still be deployed and maintained independently. Do not design new workflows around the retired central services.

## Matrix status vocabulary

- `NOT_ASSESSED`: no country/theme source assessment has been completed.
- `DISCOVERED`: candidate record found; identity still requires validation.
- `METADATA_VERIFIED`: authoritative metadata record and publisher confirmed.
- `LICENCE_VERIFIED`: licence/terms and intended purpose reviewed and recorded.
- `ACCESS_TESTED`: documented access method successfully tested.
- `INGESTION_VALIDATED`: controlled test import passed schema, CRS, geometry and provenance checks.
- `APPROVED_FOR_USE`: named owner approved the intended use; this is not a blanket republication permission.
- `BLOCKED`: legal, technical, privacy, quality or provenance issue prevents use.
- `RETIRED`: source or dataset is no longer maintained/available.

## Mandatory acceptance before ingestion

For every dataset, record the authoritative publisher, metadata identifier and URL, dataset landing page, licence URI and text, commercial-use and redistribution conditions, access method, endpoint, CRS/axis order, geographic and temporal coverage, update cadence, personal-data classification, retention constraints, retrieval timestamp, checksum, adapter version and validation receipt.

A public catalogue record or open endpoint is not by itself a licence grant. Public discovery, access, download and reuse are distinct. Do not ingest, cache beyond permitted terms, transform for redistribution, expose an API, or send source content to an AI provider until the applicable rights and purpose have been reviewed.

## Theme taxonomy

The 34 theme labels and Annex assignments follow the INSPIRE theme register and Directive annex structure: 9 Annex I, 4 Annex II and 21 Annex III. Functional-sector labels in the CSV are internal navigation groupings, not legal classifications and not additional INSPIRE themes.

## Evidence sources

- European Commission, National Contact Points: https://knowledge-base.inspire.ec.europa.eu/national-contact-points_en
- European Commission, INSPIRE in your Country: https://knowledge-base.inspire.ec.europa.eu/tools/inspire-your-country_en
- European Data Portal, INSPIRE datasets move to the European Data Portal (22 June 2026): https://data.europa.eu/en/news-events/news/inspire-datasets-move-european-data-portal
- European Commission INSPIRE transition notice (1 July 2026): https://knowledge-base.inspire.ec.europa.eu/news-and-publications/news/european-commission-transitioning-inspire-infrastructure-eu-horizontal-services-ensure-long-term-2026-07-01_en
- EU Vocabularies, INSPIRE theme register: https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdataset%2Finspire-theme
- Italy RNDT GeoDCAT-AP endpoint: https://geodati.gov.it/geoportale/eng/strumenti-en/geodcat-ap-endpoint
- Directive 2007/2/EC (consolidated text): https://eur-lex.europa.eu/eli/dir/2007/2/oj/eng

## Release rule

This inventory is documentation only. It does not authorize bulk harvesting, external sharing, production deployment, paid data acquisition or publication. Every dataset must pass the source-and-licence gate and the programme's exact-head CI, security, privacy, data-quality and explicit release-authorization gates.
