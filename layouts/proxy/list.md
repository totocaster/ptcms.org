{{- $source := site.GetPage (.Params.proxy_source | default "/manifesto") -}}
# Manifesto {{ partial "version-value.html" .Params.version }}

> Frozen copy. This text never changes.

Version: {{ partial "version-value.html" .Params.version }} · Published: {{ .Date.Format "2006-01-02" }}

URL: {{ with .OutputFormats.Get "HTML" }}{{ .Permalink }}{{ end }}

{{ $source.RawContent }}
