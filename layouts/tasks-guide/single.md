{{- partial "md-head.md" . -}}
{{- /* hugo.Data replaces site.Data from Hugo 0.156; production still builds with 0.139. */ -}}
{{- $data := dict -}}
{{- if ge hugo.Version "0.156.0" }}{{ $data = hugo.Data }}{{ else }}{{ $data = site.Data }}{{ end -}}
{{- $d := index $data "tasks" "specimen" -}}
{{- $spec := index (where (where .CurrentSection.RegularPages "Type" "spec") "Params.version" .Params.describes) 0 -}}
{{- $S := ($spec.OutputFormats.Get "HTML").Permalink -}}
{{- $Smd := ($spec.OutputFormats.Get "Markdown").Permalink -}}
{{- $atlas := false }}{{ with where .CurrentSection.RegularPages "Params.role" "atlas" }}{{ $atlas = index . 0 }}{{ end }}
This page describes [{{ $spec.Parent.Title }} {{ $spec.Params.version }}]({{ $S }}).{{ with $atlas }} The [atlas]({{ (.OutputFormats.Get "Markdown").Permalink }}) shows every rule by example.{{ end }} Rule IDs link to the specification.

## The file, annotated

The specification’s quick example ([§6]({{ $S }}#section-6)). The notes below refer to its line numbers.

```
{{ range $d.lines }}{{ .text }}
{{ end }}```

{{ range $d.notes -}}
{{- $refs := slice }}
{{- range .rules }}{{ $refs = $refs | append (printf "[%s](%s#%s)" . $S .) }}{{ end }}
{{- range .sections }}{{ $refs = $refs | append (printf "[§%s](%s#section-%s)" . $S .) }}{{ end -}}
{{ .num }}. **{{ .short }}** ({{ if eq (len .targets) 1 }}line{{ else }}lines{{ end }} {{ delimit .targets ", " }}). {{ .text }}{{ with .open }} *Open question.* {{ . }}{{ end }} Rules: {{ delimit $refs ", " }}.
{{ end }}
## Seven line types

A reader goes through the file top to bottom ([T-36]({{ $S }}#T-36)) and gives each line one of seven types ([§7]({{ $S }}#section-7)). The shape of a line decides its type; its indentation decides where it belongs. A note is defined by what it isn’t: it doesn’t begin with checklist, heading, metadata or separator syntax ([T-13]({{ $S }}#T-13)).

| Type | Shape | Example | Belongs to, or holds | Rules |
|---|---|---|---|---|
{{ range $d.types -}}
{{- $refs := slice }}
{{- range .rules }}{{ $refs = $refs | append (printf "[%s](%s#%s)" . $S .) }}{{ end }}
{{- range .sections }}{{ $refs = $refs | append (printf "[§%s](%s#section-%s)" . $S .) }}{{ end -}}
| {{ .name }} | {{ .shape }} | {{ with .example }}`{{ . }}`{{ else }}(empty){{ end }} | {{ .holds }} | {{ delimit $refs ", " }} |
{{ end }}
## Four states

A task is in one of four states, written as a token between the brackets ([§7.4]({{ $S }}#section-7.4)). Three of them have a recommended companion metadata line ([§10]({{ $S }}#section-10)). The specification doesn’t define moves between states.

| Token | State | Meaning | Companion |
|---|---|---|---|
{{ range $d.states -}}
| `{{ .token }}` | [{{ .name }}]({{ $S }}#section-{{ .section }}) | {{ .meaning }} | {{ with .companion }}`{{ . }}`{{ else }}none{{ end }} |
{{ end }}
## Reading order

Read top to bottom and keep the line order ([T-36]({{ $S }}#T-36), [T-37]({{ $S }}#T-37)). A metadata line attaches to the nearest preceding non-nested task one level up ([T-40]({{ $S }}#T-40)). A note attaches to the nearest preceding heading or task one level up ([T-41]({{ $S }}#T-41)), and a nested task to the nearest preceding task one level up ([T-42]({{ $S }}#T-42)). Subtasks inherit their ancestor’s effective metadata ([T-29]({{ $S }}#T-29)), so writers don’t copy it down ([T-31]({{ $S }}#T-31)).

Everything above the archive separator is active; everything below it is the archive ([§5]({{ $S }}#section-5)), which stays valid Plaintext Tasks ([T-32]({{ $S }}#T-32)). Readers keep blank lines when practical ([T-38]({{ $S }}#T-38)) and preserve unknown metadata keys as written ([T-39]({{ $S }}#T-39)).

Out of scope for {{ $spec.Params.version }}: recurrence, richer date-time values, references between tasks and stricter ID rules ([§15]({{ $S }}#section-15)).

## See also

{{ with $atlas }}- [{{ .Title }}]({{ (.OutputFormats.Get "Markdown").Permalink }}): {{ .Params.summary }}
{{ end }}- [Specification {{ $spec.Params.version }}]({{ $S }}) · Markdown: {{ $Smd }}
