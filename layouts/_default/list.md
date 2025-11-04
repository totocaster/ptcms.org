{{- /* Markdown output for section landing pages */ -}}
{{- if .Title -}}
# {{ .Title }}

{{- end -}}
{{ with .RawContent }}
{{ . }}

{{ end }}
{{- if .Pages -}}
## Pages

{{ range .Pages -}}
- [{{ .Title }}]({{ with .OutputFormats.Get "Markdown" }}{{ .RelPermalink }}{{ else }}{{ .RelPermalink }}{{ end }})
{{ end }}

{{- end -}}
