{{- $p := . -}}
# {{ $p.Params.heading | default $p.Title }}
{{ with $p.Params.subtitle | default $p.Params.summary }}
> {{ . }}
{{ end }}
{{- $meta := slice -}}
{{- with $p.Params.status }}{{ $meta = $meta | append (printf "Status: %s" .) }}{{ end -}}
{{- with $p.Params.version }}{{ $meta = $meta | append (printf "Version: %s" (partial "version-value.html" .)) }}{{ end -}}
{{- if and $p.Params.version (not $p.Date.IsZero) }}{{ $meta = $meta | append (printf "Published: %s" ($p.Date.Format "2006-01-02")) }}{{ end -}}
{{- with $p.Params.extension }}{{ $meta = $meta | append (printf "Extension: `%s`" .) }}{{ end -}}
{{- with $meta }}
{{ delimit . " · " }}
{{ end }}
URL: {{ with $p.OutputFormats.Get "HTML" }}{{ .Permalink }}{{ else }}{{ $p.Permalink }}{{ end }}

