{{- partial "md-head.md" . -}}
{{ partial "md-clean.html" .RawContent }}

## Versions

{{ range (where .RegularPages "Type" "spec").ByDate.Reverse -}}
- {{ .Params.version }} ({{ .Params.status }}, {{ .Date.Format "2006-01-02" }}): {{ .Permalink }} · Markdown: {{ .Permalink }}index.md{{ with .OutputFormats.Get "Rules" }} · Rules: {{ .Permalink }}{{ end }}
{{ end }}
## Read

{{ range (where .RegularPages "Params.role" "in" (slice "guide" "atlas" "companion" "history")).ByWeight -}}
- [{{ .Params.navTitle | default .Title }}]({{ .Permalink }}index.md){{ with .Params.summary }}: {{ . }}{{ end }}
{{ end }}
