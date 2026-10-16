# EU INSPIRE / European Public Spatial Data — v7.0.0

URBAN ONE uses INSPIRE and data.europa.eu as a public spatial-data discovery layer for real-estate and territorial research. It does not treat cadastral geometry as proof of ownership and it does not use public cadastral services to discover or enrich natural-person identities.

## Official sources

- INSPIRE Directive 2007/2/EC: https://eur-lex.europa.eu/eli/dir/2007/2/oj
- INSPIRE Knowledge Base / themes: https://knowledge-base.inspire.ec.europa.eu/tools/inspire-themes_en
- European Data Portal: https://data.europa.eu/
- European Data Portal Search API: https://data.europa.eu/api/hub/search/
- European Data Portal API documentation: https://dataeuropa.gitlab.io/data-provider-manual/api-documentation/

The former INSPIRE Geoportal entry point currently redirects to data.europa.eu. The portal aggregates national and sectoral catalogues and exposes metadata through search, SPARQL and registry APIs.

## Access model

INSPIRE requires discovery and view services to be available to the public, subject to the Directive's exceptions. Download, invocation and reuse can remain subject to provider-specific licences, restrictions, attribution requirements or charges. URBAN ONE therefore records provider terms as authoritative and never labels every INSPIRE distribution as automatically free for unrestricted reuse.

## 34 INSPIRE themes

All official themes are represented in `packages/geo/inspire.mjs`. The real-estate preset prioritises addresses, administrative units, cadastral parcels, geographical names, hydrography, protected sites, transport, elevation, geology, land cover, orthoimagery, management/restriction zones, buildings, health and safety, land use, natural risks, population, industrial facilities, soil, statistical units and utility/governmental services.

## Privacy and legal guardrail

Public spatial searches are limited to provider-published geospatial metadata and services. The public-data path must not infer or expose owner names, tax/fiscal identifiers, certificate/document identifiers or other natural-person identity fields from cadastral parcels or addresses. Any private identity data remains in the separately governed owner-scoped contact/data layer and is not merged into the public INSPIRE path without a lawful, explicit source and purpose.

## API

`POST /api/public/eu-spatial/search-plan` builds a user-initiated query against the official data.europa.eu Search API and applies the geospatial catalogue facet. It returns the fixed official endpoint, query, selected themes, and privacy/access policy metadata. It does not scrape national cadastral websites or bypass authentication/licensing controls.

`GET /api/public/eu-spatial/policy` returns the public spatial-data policy used by the app.
