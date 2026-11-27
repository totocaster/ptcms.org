# plaintextcommons.org

The Plaintext Commons site: the manifesto, and the versioned plain-text formats that follow from it. Hugo, static, no build step beyond `hugo`.

```sh
make dev     # live preview at http://localhost:1313
make build   # production build into ./public
```

Production builds on DigitalOcean with Hugo 0.164 (extended), set by `HUGO_VERSION` in the app spec. Every push to `main` deploys, so build locally with the same Hugo version first; a failed build leaves the previous deploy live.

## How the content is organised

| Address | Source | Layout |
|---|---|---|
| `/` | `content/_index.md` | `layouts/index.html` (front door) |
| `/manifesto/` | `MANIFESTO.md` from the `plaintext-commons` Hugo module | `layouts/manifesto/list.html` |
| `/manifesto/v0.2.0/` | `content/manifesto/v0.2.0/_index.md` (frozen copy) | `layouts/proxy/list.html` |
| `/manifesto/history/` | `content/manifesto/history.md` + `data/manifesto/history.yaml` | `layouts/manifesto-history/` |
| `/formats/` | `content/formats/_index.md` + `data/lifecycle.yaml`, `data/criteria.yaml` | `layouts/formats/list.html` (registry) |
| `/{format}/` | `content/{format}/_index.md` (`type: format`) | `layouts/format/list.html` (landing) |
| `/{format}/v{x.y.z}/` | `content/{format}/v{x.y.z}.md` (`type: spec`) | `layouts/spec/single.html` (reference) |
| `/{format}/history/` | `content/{format}/history.md` (`type: history`) | `layouts/history/single.html` |
| `/glossary/` | `data/glossary.yaml` | `layouts/glossary/list.html` |

Every page also renders as Markdown at `index.md` beside it. The home page adds `/formats.json`, `/llms.txt` and `/search.json`; every spec version adds `rules.json`.

## Writing a specification

- Number sections with anchors: `## Line types {#section-7}`, `### Task line {#section-7.4}`. They render as `§7`, and the Markdown twin prints `## 7 Line types`.
- Write each rule as a one-line quote: `> **T-10 · MUST · writers** Metadata lines must be …`. Strength (`MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`) and who it applies to are optional. The rule renders with its ID in the margin, appears in "Rules at a glance" and in `rules.json`, and gets the anchor `#T-10`. Never reuse an ID.
- Margin notes: `{{< note >}}…{{< /note >}}` inline, `{{< aside >}}…{{< /aside >}}` for a block placed before the paragraph it annotates.
- A published version is frozen. To change a rule, add a new version file and move the moving aliases (`/{format}/latest/`, `/{format}/v{major}/`, `/{format}/v{major}.{minor}/`) from the old version's front matter to the new one.

## Adding a format

1. `content/{shortname}/_index.md` with `type: format`, `shortname` (the stem of the file extension), `extension`, `status`, `latest`, `summary`, `weight`.
2. `content/{shortname}/v{x.y.z}.md` with `type: spec`, `version`, `status`, `date`, `url: /{shortname}/v{x.y.z}/`, the moving aliases and `outputs: ["HTML", "Markdown", "Rules"]`.
3. `content/{shortname}/history.md` with `type: history`, `role: history` and its `changes`.
4. Guides use `role: guide`, `role: atlas` or `role: companion`, which places them in the registry, the landing page and `/formats.json`.

Colour: the site chrome is black and white with the red asterisk. The Commons inks in `assets/css/plaintext.scss` are for documentation only: figures, interactive tools, code, verdicts and information types named in the text.
