{{- partial "md-head.md" . -}}
## Versions

{{ range (where .Parent.RegularPages "Type" "spec").ByDate.Reverse -}}
- {{ .Params.version }} ({{ .Params.status }}, {{ .Date.Format "2006-01-02" }}): {{ .Permalink }}
{{ end }}
## Changes

{{ range .Params.changes -}}
### {{ .version }} ({{ time.Format "2006-01-02" .date }})

{{ .summary }}

Why: {{ .why | default "Reason not yet recorded." }}

{{ end }}
