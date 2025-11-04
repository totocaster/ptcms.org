{{- /* Markdown output for individual pages */ -}}
{{- if not .Params.hide_title -}}
# {{ .Title }}

{{- end -}}
{{- with .Params.summary -}}
> {{ . }}

{{- end -}}
{{ .RawContent }}
