{{- partial "md-head.md" . -}}
{{ partial "md-clean.html" .RawContent }}

## 1 The registry

| Format | Extension | Latest | Status | Address |
|---|---|---|---|---|
{{ range site.Sections.ByWeight }}{{ if .Params.shortname }}{{ $latest := index (where .RegularPages "Type" "spec").ByDate.Reverse 0 -}}
| {{ .Title }} | `{{ .Params.extension }}` | {{ with $latest }}{{ .Params.version }}{{ end }} | {{ .Params.status }} | {{ with $latest }}{{ .Permalink }}{{ end }} |
{{ end }}{{ end }}
## 2 Lifecycle

{{ range (partial "data.html" .).lifecycle -}}
- **{{ .stage }}**: {{ .text }}
{{ end }}
## 3 What makes a Commons format

{{ range $i, $c := (partial "data.html" .).criteria -}}
{{ add $i 1 }}. **{{ $c.title }}** {{ $c.text }}
{{ end }}
## 4 Citing a format

Cite the name, the full version and, when you mean one rule, its ID: "Plaintext Tasks 0.1.1, rule T-10", linked as https://plaintextcommons.org/tasks/v0.1.1/#T-10.
