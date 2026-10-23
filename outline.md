# Outline: Building the Norwegian Railway Knowledge Graph

ISWC 2026 Façade-X tutorial, Bari, Sunday 25 October 2026, slot 3, **16:50–17:10 (20 min)**.
Comes right after Martin van Harmelen (TriplyDB) and right before Ivo Velitchkov
("Benefits of Decoupled Graph Construction"). Ivo's talk argues the same point as Part B,
so we end by handing over to him instead of repeating his case.

Style: Matdata (Slidev 52, the look of the Sem4Tra deck: Matdata logo, DIM background on the cover),
presented as "Matdata, with the Bane NOR DIM use case". No Bane NOR template.

Budget: 17 content slides plus a section divider before Part B, about 19½ minutes of talking, 30 seconds of slack.

## Opening (1 min)

| # | Slide | Content | Time |
|---|---|---|---|
| 1 | Title | Building the Norwegian Railway Knowledge Graph. Mathias Vanden Auweele, Matdata, with Bane NOR | 0:15 |
| 2 | Who and what | Matdata (one line), Bane NOR DIM (Digital Infrastructure Model) in one sentence, the take-home message up front: *"triplify the source first, transform in a second step"* | 0:45 |

## Part A: the project, and proof it is in production (8 min)

| # | Slide | Content | Time |
|---|---|---|---|
| 3 | Strategic goal | Silos to one model: reuse the railway-reality light/dark SVGs (domains, then silos, then one KG). One authoritative infrastructure model serving all use cases | 1:15 |
| 4 | PoC, pilot or production? | A maturity ladder with DIM marked at *production*. Railway is slow, processes change slowly, but: ERTMS uses DIM as the starting point for implementing ETCS on the line; DIM is chosen as the successor for supplying construction data to traffic management, traffic planning and timetabling | 1:30 |
| 5 | Who uses it today | Three cards: ERTMS/ETCS, railway undertakings (platform lengths: which trains fit, telling passengers to move forward or back), RINF (EU obligation, first micro-level submission) | 0:45 |
| 6 | What is inside | Key numbers (see question 1), plus one line: "topology-based, every asset positioned on the network graph" | 0:45 |
| 7 | GIF: the data | DIM web: railML files, datasets, key figures, TPS mapping | 1:00 |
| 8 | GIF: the tools | Search builder with Sparnatural, data catalog | 0:45 |
| 9 | REST API | Screenshot of the Swagger page. JSON-LD over a conventional REST API, built from the KG with a bit of backend indexing: people use the KG without knowing SPARQL | 1:00 |
| 10 | RINF Atlas | GIF of rinf-atlas.matdata.eu (open source, shows what is in the RINF KG) | 0:45 |

## Part B: why and how SPARQL Anything (9½ min)

| # | Slide | Content | Time |
|---|---|---|---|
| 11 | Why SPARQL Anything, and which ontology | One language for mapping and querying, team new to KGs. Ontology choice condensed from the paper: railML 3 as backbone, ERA as export target, a 6-row Harvey-ball table (native ontology, RINF compatibility, industrial adoption, asset catalogue, timetabling, ETCS exchange) | 1:30 |
| 12 | What we did first | Source straight into the target shape: the balises CONSTRUCT snippet (CSV via `SERVICE <x-sparql-anything:…>` into railML/RTM) | 1:00 |
| 13 | The mess that followed | Pipeline diagram growing step by step (v-clicks): SQL data patches, spatial SQL views, ~50 post-processing UPDATEs, Python steps (geometry minting, netelement sequences, track building), GeoSPARQL gaps (no linear referencing, no ST_X/ST_Y, engines missing parts of the spec) | 2:00 |
| 14 | Timings | Table from the paper: ingestion 3.5 min, SPARQL Anything 10 min, post-processing 45 min, splitting 1 h 30, railML 15 min, RINF maplib 10 min vs TopBraid 2 h | 1:00 |
| 15 | My advice: two stages | Diagram: sources (CSV, JSON, XML, API, …) → SPARQL Anything → **source-system KG** (mechanical, light provenance: when it was converted) → **SHACL rules** (annotated, real provenance: which rule, which source class) → target KG | 2:00 |
| 16 | What a rule looks like | The PLC → `era:PrimaryLocation` SHACL-AF rule from the RINF export, with rule annotations shown as the provenance hook | 1:00 |

## Closing (1 min)

| # | Slide | Content | Time |
|---|---|---|---|
| 17 | Takeaways and thanks | Three takeaways (production is possible; don't map straight to the target; GeoSPARQL needs linear referencing), hand-over to Ivo, links and QR code to the deck, the paper, DIM and RINF Atlas | 1:00 |

## Cuts (darlings killed)

Kept in the paper and the Sem4Tra deck, out of this talk:

- The topology deep dive: many topology models, graph-based topology, three positioning methods, "why geometry lies". Reduced to one line on slide 6.
- Time and identity complexities.
- The full railML vs ERA feature list; only the 6-row table survives.
- Fuseki staging and hot-swap, Airflow DAGs, AKS sizing.
- Code for splitting queries, the double-switch-node patch and switch-branch azimuth SQL; slide 13 names them, no code.
- History of multi-ontology mapping in post-processing.
- The wish list (validation tooling, dereferencing app, lineage UI). One wish survives in the takeaways: linear referencing in GeoSPARQL.
- The RTM to ERA `NetLinearReference` conversion pain.

## Workflows

- `deploy.yml`: build on push to `main` and deploy to GitHub Pages (same as the other Matdata decks).
- `release.yml`: on a tag, export a PDF and attach it to the release.
