# Plaintext Commons

> {{ site.Params.tagline }}

{{ .Params.claim }}

## The three laws

{{ range $i, $l := .Params.laws -}}
{{ add $i 1 }}. **{{ $l.title }}** {{ $l.text }}
{{ end }}
## Formats

{{ range site.Sections.ByWeight }}{{ if .Params.shortname -}}
- [{{ .Title }}]({{ .Permalink }}index.md) (`{{ .Params.extension }}`, latest {{ .Params.latest }}, {{ .Params.status }}): {{ .Params.summary }}
{{ end }}{{ end }}
## Start here

- [Manifesto]({{ "/manifesto/index.md" | absURL }}): the stance, nine principles, three laws, the Plaintext Test.
- [Formats]({{ "/formats/index.md" | absURL }}): the registry of formats and how they mature.
- [Glossary]({{ "/glossary/index.md" | absURL }})

## For tools and agents

- Every page is available as Markdown: add `index.md` to its address.
- Catalogue of formats: {{ "formats.json" | absURL }}
- Entry point for language models: {{ "llms.txt" | absURL }}
