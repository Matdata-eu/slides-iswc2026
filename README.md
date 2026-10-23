# Building the Norwegian Railway Knowledge Graph

Slides for the talk at the [ISWC 2026 Façade-X tutorial](https://w3c-facade-x.github.io/iswc2026-tutorial/)
(Bari, 25 October 2026, 16:50–17:10).

**Live deck:** <https://iswc2026.matdata.eu/>

The talk presents the Bane NOR Digital Infrastructure Model (DIM), a railway infrastructure
knowledge graph built with SPARQL Anything that runs in production, and the main lesson from
building it: use SPARQL Anything to triplify the source system, and transform to the target
model in a second step with annotated (SHACL) rules.

Background and numbers come from the Sem4Tra 2026 paper:
[Matdata-eu/paper-sem4tra2026](https://github.com/Matdata-eu/paper-sem4tra2026).

## Structure

| Part | Slides |
|---|---|
| Opening | title, who and what |
| The project | strategic goal, production status, users, key figures, portal, REST API, RINF Atlas |
| SPARQL Anything | why and which ontology, direct mapping, the mess, timings, two-stage advice, rule example |
| Closing | takeaways and links |

[outline.md](outline.md) has the timing per slide and the list of cut topics. Speaker notes with
timings are in [slides.md](slides.md).

## Run locally

```bash
npm install
npm run dev
```

Export to PDF with `npm run export` (needs `playwright-chromium`).

## Screen recordings

The recordings in `public/assets` are made with Playwright:

- `node capture/rinf-atlas.mjs` records [RINF Atlas](https://rinf-atlas.matdata.eu/).
- `node capture/dim-portal.mjs [--only=dim-data,dim-tps,dim-tools,dim-api]` records the DIM portal,
  including a scripted TPS mapping demo (zoom, select, hover in both maps). It opens a browser window to sign in
  first, because most portal pages need a Bane NOR account.

## Publishing

- `deploy.yml` builds the deck on every push to `main` and deploys it to GitHub Pages, served on
  `iswc2026.matdata.eu` (see `public/CNAME`).
- `release.yml` exports a PDF on a `v*` tag and attaches it to the GitHub release.

## License

Code under MIT, content under CC BY 4.0. See [LICENSE](LICENSE).
