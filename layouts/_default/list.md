{{- partial "md-head.md" . -}}
{{ partial "md-clean.html" .RawContent }}
{{- with .Pages }}

## Pages

{{ range . -}}
- [{{ .Title }}]({{ with .OutputFormats.Get "Markdown" }}{{ .Permalink }}{{ else }}{{ .Permalink }}{{ end }}){{ with .Params.summary }}: {{ . }}{{ end }}
{{ end -}}
{{- end }}
