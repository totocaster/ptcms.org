# Manifesto

> {{ .Params.description }}

Version: {{ partial "version-value.html" .Params.version }} · Published: {{ .Date.Format "2006-01-02" }}

URL: {{ with .OutputFormats.Get "HTML" }}{{ .Permalink }}{{ end }}

{{ .RawContent }}
