{{- partial "md-head.md" . -}}
{{ range (partial "data.html" .).glossary -}}
**{{ .term }}** ({{ $.Permalink }}#{{ .id }})
: {{ .definition }}

{{ end }}
