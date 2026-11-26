{{- partial "md-head.md" . -}}
{{- /* hugo.Data replaces site.Data from Hugo 0.156; production still builds with 0.139. */ -}}
{{- $data := dict -}}
{{- if ge hugo.Version "0.156.0" }}{{ $data = hugo.Data }}{{ else }}{{ $data = site.Data }}{{ end -}}
{{- $d := index $data "tasks" "atlas" -}}
{{- $spec := index (where (where .CurrentSection.RegularPages "Type" "spec") "Params.version" .Params.describes) 0 -}}
{{- $S := ($spec.OutputFormats.Get "HTML").Permalink -}}
{{- $Smd := ($spec.OutputFormats.Get "Markdown").Permalink -}}
{{- $html := (.OutputFormats.Get "HTML").Permalink -}}
{{- $guide := false }}{{ with where .CurrentSection.RegularPages "Params.role" "guide" }}{{ $guide = index . 0 }}{{ end -}}
{{- $words := dict "valid" "Canonical" "tolerated" "Tolerated" "invalid" "Invalid" "open" "Open" -}}
{{- $labels := dict -}}
{{- range $g := $d.groups }}{{ range $r := $g.rows }}{{ range $d.columns }}{{ $labels = merge $labels (dict (printf "%s-%s" $r.id .key) (printf "%s · %s · %s" $g.label $r.aspect (lower .word))) }}{{ end }}{{ end }}{{ end -}}
{{- $labels = merge $labels (dict $d.open.id (printf "%s · %s · open" $d.open.label $d.open.aspect)) }}
This page shows [{{ $spec.Parent.Title }} {{ $spec.Params.version }}]({{ $S }}) by example.{{ with $guide }} The [overview]({{ (.OutputFormats.Get "Markdown").Permalink }}) shows the whole format in one file.{{ end }} Rule IDs link to the specification.

## How to read the atlas

Each row is one aspect of one kind of line. **Canonical** is what a canonical writer emits. **Tolerated** is accepted, but isn’t the canonical or recommended form. **Invalid** breaks a rule of {{ $spec.Params.version }}. A tolerant reader may still accept invalid input, as long as it avoids destructive rewrites ([T-55]({{ $S }}#T-55)). A line that starts like a heading, task, metadata line or separator but doesn’t fit that shape is read here as invalid, not as a note, because note lines don’t begin with that syntax ([T-13]({{ $S }}#T-13)).

In the examples, ⏎ separates lines, `·` marks a space, `→` a tab, and `␊` and `␍␊` the line endings. Lines starting with `−` and `+` show a rewrite, as a diff.
{{ range $g := $d.groups }}
## {{ $g.label }}

| Aspect | Verdict | Example | Why | Rules |
|---|---|---|---|---|
{{ range $r := $g.rows }}{{ range $d.columns }}{{ $c := index $r .key -}}
{{- if $c.empty -}}
| {{ $r.aspect }} | {{ .word }} | none | {{ $c.empty }} | |
{{ else -}}
{{- $ex := slice }}{{ range $c.lines }}{{ $t := .t }}{{ with .segs }}{{ $t = "" }}{{ range . }}{{ $t = printf "%s%s" $t .t }}{{ end }}{{ end }}{{ $ex = $ex | append (cond (eq $t "") "(blank)" (printf "`%s`" $t)) }}{{ end -}}
{{- $refs := slice }}{{ range $c.rules }}{{ $refs = $refs | append (printf "[%s](%s#%s)" . $S .) }}{{ end }}{{ range $c.sections }}{{ $refs = $refs | append (printf "[§%s](%s#section-%s)" . $S .) }}{{ end -}}
| {{ $r.aspect }} | {{ .word }} | {{ delimit $ex " ⏎ " }} | {{ $c.reason }} | {{ delimit $refs ", " }} |
{{ end }}{{ end }}{{ end }}{{ end }}
## {{ $d.open.label }}

{{ with $d.open.cell -}}
{{- $ex := slice }}{{ range .lines }}{{ $ex = $ex | append (cond (eq .t "") "(blank)" (printf "`%s`" .t)) }}{{ end -}}
{{- $refs := slice }}{{ range .rules }}{{ $refs = $refs | append (printf "[%s](%s#%s)" . $S .) }}{{ end }}{{ range .sections }}{{ $refs = $refs | append (printf "[§%s](%s#section-%s)" . $S .) }}{{ end -}}
| Aspect | Verdict | Example | Why | Rules |
|---|---|---|---|---|
| {{ $d.open.aspect }} | Open | {{ delimit $ex " ⏎ " }} | {{ .reason }} | {{ delimit $refs ", " }} |
{{- end }}

{{ $d.open.aside | replaceRE `\b(T-[0-9]+)\b` (printf "[$1](%s#$1)" $S) }}

Out of scope for {{ $spec.Params.version }}. {{ $d.out_of_scope }} Later versions may take these up ([§15]({{ $S }}#section-15)).

## Check a file

The HTML page has a checker that runs in the browser: {{ $html }}#check
{{ with index (where $d.checker.samples "key" $d.checker.default) 0 }}
Its default example, “{{ .label }}” (line 8 starts with a tab):

```
{{ .text }}
```
{{ end }}
{{ with $d.example.counts }}{{ .lines }} lines: {{ .invalid }} invalid, {{ .tolerated }} tolerated, {{ .open }} open.{{ end }}

| Line | Verdict | Problem | Rules | Atlas |
|---|---|---|---|---|
{{ range $d.example.problems -}}
{{- $refs := slice }}{{ range .rules }}{{ $refs = $refs | append (printf "[%s](%s#%s)" . $S .) }}{{ end }}{{ range .sections }}{{ $refs = $refs | append (printf "[§%s](%s#section-%s)" . $S .) }}{{ end -}}
| {{ .line }} | {{ index $words .verdict }} | {{ .title }}. {{ .hint }} | {{ delimit $refs ", " }} | {{ with .cell }}[{{ index $labels . }}]({{ $html }}#cell-{{ . }}){{ end }} |
{{ end }}
## See also

{{ with $guide }}- [{{ .Title }}]({{ (.OutputFormats.Get "Markdown").Permalink }}): {{ .Params.summary }}
{{ end }}- [Specification {{ $spec.Params.version }}]({{ $S }}) · Markdown: {{ $Smd }}
