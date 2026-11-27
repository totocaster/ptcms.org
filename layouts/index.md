{{- $d := (partial "data.html" .).home -}}
{{- $manifesto := site.GetPage "/manifesto" -}}
{{- $mver := partial "version-value.html" $manifesto.Params.version -}}
{{- $words := slice "no" "one" "two" "three" "four" "five" "six" "seven" "eight" "nine" "ten" -}}
{{- $md := dict -}}
{{- with $manifesto.OutputFormats.Get "Markdown" }}{{ $md = merge $md (dict "manifesto" .Permalink) }}{{ end -}}
{{- $questions := slice -}}
{{- range $d.figures.laws }}{{ $questions = $questions | append .test }}{{ end -}}
{{- $questions = sort ($questions | append $d.test.fourth) "number" -}}
# {{ site.Title }}

> {{ site.Params.tagline }}

{{ .Params.claim }}

**Problem.** {{ .Params.problem }}

**Consequence.** {{ .Params.consequence }}

## The three laws

{{ replace $d.laws.twin "{manifesto}" $mver }}

{{ range $i, $l := .Params.laws -}}
{{ $f := index $d.figures.laws $i -}}
{{ add $i 1 }}. **{{ $l.title }}** {{ $l.text }}
   - {{ $f.verdict.app }}
   - {{ $f.verdict.commons }}
   - Plaintext Test, question {{ $f.test.number }}: “{{ $f.test.question }}”

{{ end -}}
## The Plaintext Test

Ask this before adopting a tool or workflow{{ with $md.manifesto }} ([manifesto]({{ . }})){{ end }}:

{{ range $questions -}}
{{ .number }}. {{ .question }}
{{ end }}
## Formats

{{ range site.Sections.ByWeight }}{{ if .Params.shortname -}}
{{- $fmt := . -}}
{{- $latest := index (where .RegularPages "Type" "spec").ByDate.Reverse 0 -}}
{{- $status := .Params.status }}{{ with $latest }}{{ with .Params.status }}{{ $status = . }}{{ end }}{{ end -}}
- [{{ .Title }}]({{ with .OutputFormats.Get "Markdown" }}{{ .Permalink }}{{ end }}) (`{{ .Params.extension }}`): {{ .Params.summary }}
{{- with $latest }}
  - Latest: {{ .Params.version }}, {{ $status }}, published {{ .Date.Format "2006-01-02" }}{{ with partial "rules.html" . }}, {{ len . }} rules{{ end }}{{ with .Params.open_rules }} ({{ index $words (len .) }} open: {{ delimit . ", " }}){{ end }}.
  - Specification: {{ with .OutputFormats.Get "Markdown" }}{{ .Permalink }}{{ end }}
{{- end }}
{{- range (where .RegularPages "Params.role" "in" (slice "guide" "atlas" "companion" "history")).ByWeight }}
  - {{ .Params.navTitle | default .Title }}: {{ with .OutputFormats.Get "Markdown" }}{{ .Permalink }}{{ end }}
{{- end }}
{{ end }}{{ end }}
## For programs

- Every page as plain Markdown, next to the page itself: add `index.md` to its address. This page: {{ with .OutputFormats.Get "Markdown" }}{{ .Permalink }}{{ end }}
{{- with .OutputFormats.Get "Formats" }}
- {{ $d.programs.formats }}: {{ .Permalink }}
{{- end }}
{{- with .OutputFormats.Get "Llms" }}
- {{ $d.programs.llms }}: {{ .Permalink }}
{{- end }}
{{- range site.Sections.ByWeight }}{{ if .Params.shortname }}{{ $fmt := . }}
{{- range (where .RegularPages "Type" "spec").ByDate.Reverse }}{{ $sp := . }}
{{- with .OutputFormats.Get "Rules" }}
- {{ replace (replace (replace $d.programs.rules "{n}" (string (len (partial "rules.html" $sp)))) "{format}" $fmt.Title) "{version}" $sp.Params.version }}: {{ .Permalink }}
{{- end }}
{{- end }}
{{- end }}{{ end }}
