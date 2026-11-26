{{- partial "md-head.md" . -}}
This version is frozen. Rules are marked `> **ID · STRENGTH · applies to**` and keep their IDs across versions. Machine-readable rules: {{ with .OutputFormats.Get "Rules" }}{{ .Permalink }}{{ end }}

{{ partial "md-clean.html" .RawContent }}
