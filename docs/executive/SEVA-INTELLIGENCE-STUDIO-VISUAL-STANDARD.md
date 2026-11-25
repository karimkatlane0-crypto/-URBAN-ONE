# SEVA Intelligence Studio — Executive Visual Standard

**Versione:** 1.0 · **Data:** 25 novembre 2026  
**Ambito:** sito, Advanced Insights, dashboard, report e dossier CEO  
**Stato:** proposta implementata in branch isolato; non integrata né pubblicata.

## Direzione creativa
- Posizionamento: Global Executive / Institutional Premium.
- Palette: grafite profondo, superfici ardesia, avorio, platino e champagne.
- Tipografia: serif editoriale per titoli strategici; sans-serif ad alta leggibilità per dati e controlli.
- Layout: griglia modulare, spaziatura generosa, bordi sottili, ombre contenute, nessun effetto decorativo che riduca la leggibilità.
- Responsive: desktop, tablet e smartphone; navigazione accessibile e focus visibile.
- Accessibilità: contrasto, semantica HTML, tabelle scorribili su mobile, rispetto di prefers-reduced-motion.

## Sistema informativo
Ogni KPI deve esporre: definizione, formula, fonte, periodo, timezone, owner, frequenza di aggiornamento, denominatore, data ultimo refresh e stato di qualità. I valori non disponibili devono apparire come “—”, mai come zero.

## Classificazione obbligatoria
- **VERIFIED:** evidenza ispezionabile, attribuita alla versione e riconciliata.
- **DEMO / SYNTHETIC:** valori simulati, chiaramente etichettati.
- **ESTIMATE:** risultato derivato da assunzioni esplicite.
- **NOT VERIFIED / BLOCKED:** fonte, runtime o integrazione non collaudati.
- **LIVE:** consentito solo con prova di produzione e autorizzazione esplicita.

## Componenti previsti
1. CEO overview: revenue netto, conversione, clienti attivi, commissioni creator.
2. Performance: trend, funnel, retention e coorti.
3. Data sources: CRM, Power BI/Power Query, commerce/Stripe, Amazon/Awin.
4. Governance: qualità dati, provenienza, sicurezza, accessi e gate release.
5. Dossier: copertina executive, indice, KPI dictionary, data lineage, evidenze, rischi, decisioni e appendice tecnica.

## Regole di pubblicazione
Questa proposta è un prototipo visuale isolato. Non sostituisce il backend, non collega fonti, non abilita pagamenti e non autorizza deploy, merge o rilascio. La pagina pubblica e il dossier ufficiale si aggiornano solo dopo test, revisione indipendente e approvazione specifica.

## Evidenze e limiti correnti
La documentazione recuperata il 25 novembre descrive un pacchetto Power BI del 4 novembre con query M e CSV, ma senza collaudo nel runtime Microsoft o refresh di workspace. I report del 5–6 novembre descrivono dati AURA/Insights sintetici e non dimostrano ricavi reali, conversioni reali o pagamenti-to-entitlement. Queste condizioni devono restare esplicite finché non esistono prove più recenti.
