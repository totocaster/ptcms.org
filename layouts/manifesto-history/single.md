{{- partial "md-head.md" . -}}
{{- /* hugo.Data replaces site.Data from Hugo 0.156; production still builds with 0.139. */ -}}
{{- $data := dict -}}
{{- if ge hugo.Version "0.156.0" }}{{ $data = hugo.Data }}{{ else }}{{ $data = site.Data }}{{ end -}}
{{- $h := index $data "manifesto" "history" -}}
{{- $versions := $h.versions -}}
{{- $to := index $versions 0 -}}
{{- $from := index $versions 1 -}}
{{- $sec := 3 -}}

{{- /* Diff lines and counts for each change, from its parallel before/after rows. */ -}}
{{- $items := slice -}}
{{- range $i, $c := $h.changes -}}
  {{- $lines := slice -}}
  {{- $del := 0 -}}
  {{- $add := 0 -}}
  {{- $nb := len $c.before -}}
  {{- $na := len $c.after -}}
  {{- range $k := seq 0 (sub (cond (gt $nb $na) $nb $na) 1) -}}
    {{- $b := "" -}}{{- if lt $k $nb }}{{ $b = index $c.before $k }}{{ end -}}
    {{- $a := "" -}}{{- if lt $k $na }}{{ $a = index $c.after $k }}{{ end -}}
    {{- if and $b $a (eq $b $a) -}}
      {{- $lines = $lines | append (printf " %s" $b) -}}
    {{- else -}}
      {{- with $b }}{{ $lines = $lines | append (printf "-%s" .) }}{{ $del = add $del 1 }}{{ end -}}
      {{- with $a }}{{ $lines = $lines | append (printf "+%s" .) }}{{ $add = add $add 1 }}{{ end -}}
    {{- end -}}
  {{- end -}}
  {{- $items = $items | append (dict "c" $c "n" (printf "%d.%d" $sec (add $i 1)) "lines" $lines "del" $del "add" $add) -}}
{{- end -}}
## 1 Versions

{{ range $v := $versions -}}
- {{ $v.version }} ({{ $v.status }}, {{ $v.date }}){{ with $v.url }}: {{ . | absURL }}{{ end }}{{ with $v.note }}{{ if $v.url }} · {{ else }}: {{ end }}{{ . }}{{ end }}
{{ end }}
The {{ lower $from.version }} and {{ $to.version }} were published {{ div (sub (time $to.date).Unix (time $from.date).Unix) 86400 }} days apart. The address {{ "/manifesto/" | absURL }} always shows the current text.

## 2 The changes at a glance

The changes below cover the manifesto’s core: its opening, the three laws, the principles, the sections and the Plaintext Test. The prose of five other sections (Why now, Multi-tool by design, Minimal working conventions, Norms for tools, Adoption path) was rewritten too, and {{ $to.version }} adds two footnotes and a credit line. Those are not traced here.

{{ range $items -}}
- {{ .n }} {{ .c.short | default .c.title }} ({{ .c.kind }}: {{ .del }} removed, {{ .add }} added): {{ .c.summary }}
{{ end }}
## {{ $sec }} {{ $from.version }} → {{ $to.version }}, line by line

Unchanged lines are shown for context. Lines are quoted without their Markdown emphasis.
{{ range $items }}
### {{ .n }} {{ .c.title }}

```diff
{{ delimit .lines "\n" }}
```

Why: {{ with .c.why }}{{ . }}{{ else }}Reason not yet recorded.{{ end }}
{{ with .c.note }}
{{ . }}
{{ end }}
{{- end }}
