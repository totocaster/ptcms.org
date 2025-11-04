{{- /* Markdown output for the home page */ -}}
# {{ .Title }}

{{ if or .Params.version .Params.date }}
> {{ with .Params.version }}Version {{ . }}{{ end }}{{ if and .Params.version .Params.date }} · {{ end }}{{ with .Params.date }}{{ . | time.AsTime | time.Format "2006-01-02" }}{{ end }}

{{ end }}
{{ with .Params.summary }}
{{ . }}

{{ end }}
{{ .RawContent }}
