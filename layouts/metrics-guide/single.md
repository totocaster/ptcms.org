{{- /* Markdown twin of the Plaintext Metrics companion. The prose is the page's own Markdown;
       each figure becomes a code block or a table, computed from the same data as the HTML page. */ -}}
{{- partial "md-head.md" . -}}
{{- $d := (partial "data.html" .).metrics -}}
{{- $ver := .Params.describes | default "0.2.0" -}}
{{- $base := strings.TrimSuffix "/" site.BaseURL -}}
{{- $spec := printf "%s/metrics/v%s/" $base $ver -}}
{{- $exURL := printf "%sexamples/" $spec -}}
{{- $exDir := printf "static/metrics/v%s/examples/" $ver -}}
{{- $norm := `T(\d\d:\d\d)(Z|[+-])` -}}
{{- $pairRE := `"(?:[^"\\]|\\.)*":(?:"(?:[^"\\]|\\.)*"|-?[0-9][0-9.eE+-]*|true|false|null|\[(?:[^\[\]"]|"(?:[^"\\]|\\.)*")*\]|\{(?:[^{}"\[\]]|"(?:[^"\\]|\\.)*"|\[(?:[^\[\]"]|"(?:[^"\\]|\\.)*")*\])*\})` -}}
{{- $reserved := slice "format" "set" "by" "define" "v" "kind" "unit" "min" "max" "name" "about" "combine" "labels" "levels" "metrics" "parts" "was" "at" "until" "date" "metric" "event" "value" "lat" "lon" "note" "of" "ref" "id" "meta" -}}
{{- $roleName := dict }}{{ range $d.roles.roles }}{{ $roleName = merge $roleName (dict .key .name) }}{{ end -}}
{{- $levels := dict }}{{ range $d.checks }}{{ $levels = merge $levels (dict .name .level) }}{{ end -}}

{{- /* The month, computed as on the HTML page. */ -}}
{{- $m := $d.month -}}
{{- $V := newScratch }}{{ $mdefs := dict }}{{ $dayLines := slice -}}
{{- range $line := $m.lines -}}
  {{- $o := transform.Unmarshal $line -}}
  {{- if isset $o "define" }}{{ $mdefs = merge $mdefs (dict $o.define $o) -}}
  {{- else if isset $o "metric" -}}
    {{- $day := "" }}{{ with $o.date }}{{ $day = . }}{{ else }}{{ $day = substr $o.at 0 10 }}{{ end -}}
    {{- $t := 0 }}{{ with $o.at }}{{ $t = (time (replaceRE $norm "T${1}:00${2}" .)).Unix }}{{ end -}}
    {{- $x := dict "v" $o.value "t" $t -}}
    {{- $V.Add (printf "%s|%s" $o.metric $day) (slice $x) }}{{ $V.Add (printf "%s|all" $o.metric) (slice $x) -}}
    {{- if eq $day $m.day }}{{ $dayLines = $dayLines | append $line }}{{ end -}}
  {{- end -}}
{{- end -}}
{{- $how := dict }}{{ $digits := dict -}}
{{- range $m.metrics -}}
  {{- $def := index $mdefs .name -}}
  {{- $how = merge $how (dict .name ($def.combine | default (cond (in (slice "count" "flag") $def.kind) "sum" "mean"))) -}}
  {{- $digits = merge $digits (dict .name .digits) -}}
{{- end -}}
{{- $jobs := slice -}}
{{- range $m.metrics -}}
  {{- $name := .name -}}
  {{- range $i := seq $m.days }}{{ $k := printf "%s|%s-%02d" $name $m.month $i }}{{ with $V.Get $k }}{{ $jobs = $jobs | append (dict "id" $k "vals" . "how" (index $how $name) "digits" (index $digits $name)) }}{{ end }}{{ end -}}
  {{- $jobs = $jobs | append (dict "id" (printf "%s|month" $name) "vals" ($V.Get (printf "%s|all" $name)) "how" (index $how $name) "digits" (index $digits $name)) -}}
{{- end -}}
{{- range $m.fiveWays }}{{ $name := . }}{{ range slice "sum" "mean" "min" "max" "last" }}{{ $jobs = $jobs | append (dict "id" (printf "five|%s|%s" $name .) "vals" ($V.Get (printf "%s|%s" $name $m.day)) "how" . "digits" (index $digits $name)) }}{{ end }}{{ end -}}
{{- $R := newScratch -}}
{{- range $jobs -}}
  {{- $sum := 0.0 }}{{ $lo := 0.0 }}{{ $hi := 0.0 }}{{ $last := 0.0 }}{{ $lastT := 0 -}}
  {{- range $i, $x := .vals -}}
    {{- $sum = add $sum $x.v -}}
    {{- if or (eq $i 0) (lt $x.v $lo) }}{{ $lo = $x.v }}{{ end -}}
    {{- if or (eq $i 0) (gt $x.v $hi) }}{{ $hi = $x.v }}{{ end -}}
    {{- if or (eq $i 0) (ge $x.t $lastT) }}{{ $lastT = $x.t }}{{ $last = $x.v }}{{ end -}}
  {{- end -}}
  {{- $r := $sum -}}
  {{- if eq .how "mean" }}{{ $r = div $sum (float (len .vals)) }}{{ else if eq .how "min" }}{{ $r = $lo }}{{ else if eq .how "max" }}{{ $r = $hi }}{{ else if eq .how "last" }}{{ $r = $last }}{{ end -}}
  {{- $R.Set .id $r -}}
  {{- $R.Set (printf "%s#" .id) (cond (and (eq .digits 0) (eq (math.Round $r) $r)) (lang.FormatNumber 0 $r) (lang.FormatNumber 1 $r)) -}}
{{- end -}}
{{- $M := newScratch }}{{ $series := dict -}}
{{- range $m.metrics -}}
  {{- $name := .name -}}
  {{- $days := 0 }}{{ $lo := 0.0 }}{{ $hi := 0.0 }}{{ $loK := "" }}{{ $hiK := "" }}{{ $firstK := "" }}{{ $lastK := "" -}}
  {{- range $i := seq $m.days -}}
    {{- $k := printf "%s|%s-%02d" $name $m.month $i -}}
    {{- if $V.Get $k -}}
      {{- $v := $R.Get $k -}}
      {{- if or (eq $days 0) (lt $v $lo) }}{{ $lo = $v }}{{ $loK = $k }}{{ end -}}
      {{- if or (eq $days 0) (gt $v $hi) }}{{ $hi = $v }}{{ $hiK = $k }}{{ end -}}
      {{- if eq $days 0 }}{{ $firstK = $k }}{{ end }}{{ $lastK = $k }}{{ $days = add $days 1 -}}
    {{- end -}}
  {{- end -}}
  {{- $s := dict "name" $name "days" $days "records" (len ($V.Get (printf "%s|all" $name))) "month" ($R.Get (printf "%s|month#" $name))
        "low" ($R.Get (printf "%s#" $loK)) "high" ($R.Get (printf "%s#" $hiK)) "first" ($R.Get (printf "%s#" $firstK)) "last" ($R.Get (printf "%s#" $lastK))
        "how" (index $how $name) "def" (index $mdefs $name) "unit" .unit -}}
  {{- $series = merge $series (dict $name $s) -}}
  {{- range slice "days" "records" "month" "low" "high" "first" "last" }}{{ $M.Set (printf "<!--stat:%s:%s-->" $name .) (printf "%v" (index $s .)) }}{{ end -}}
  {{- $M.Set (printf " <!--spark:%s-->" $name) "" -}}
{{- end -}}
{{- $M.Set "<!--stat:file:lines-->" (printf "%d" (len $m.lines)) -}}
{{- $M.Set "<!--stat:file:dayLabel-->" $m.dayLabel -}}
{{- range $m.fiveWays }}{{ $name := . }}{{ range slice "sum" "mean" "min" "max" "last" }}{{ $M.Set (printf "<!--day:%s:%s-->" $name .) ($R.Get (printf "five|%s|%s#" $name .)) }}{{ end }}{{ end -}}
{{- range slice "valid" "invalid" "tolerated" }}{{ $M.Set (printf "<!--verdict:%s-->" .) (title .) }}{{ end -}}

{{- /* The run. */ -}}
{{- $run := $d.run -}}
{{- $runDefs := dict }}{{ $ev := dict -}}
{{- range $run.lines }}{{ $o := transform.Unmarshal . }}{{ if isset $o "define" }}{{ $runDefs = merge $runDefs (dict $o.define $o) }}{{ end }}{{ if isset $o "event" }}{{ $ev = $o }}{{ end }}{{ end -}}
{{- $t0 := time (replaceRE $norm "T${1}:00${2}" $ev.at) -}}
{{- $runMin := ((time (replaceRE $norm "T${1}:00${2}" $ev.until)).Sub $t0).Minutes -}}
{{- $runDist := 0.0 }}{{ range $run.lines }}{{ $o := transform.Unmarshal . }}{{ if and (eq $o.metric "distance") (eq $o.of $ev.id) }}{{ $runDist = add $runDist $o.value }}{{ end }}{{ end -}}
{{- $M.Set "<!--run:minutes-->" (printf "%.0f" $runMin) -}}
{{- $M.Set "<!--run:distance-->" (lang.FormatNumber 1 $runDist) -}}

{{- $files := dict }}{{ range $d.cases }}{{ $files = merge $files (dict .file (os.ReadFile (printf "%s%s.metrics" $exDir .file))) }}{{ end -}}
{{- $b := $d.builder -}}
{{- $bex := index (where $b.examples "key" $b.default) 0 -}}
{{- $bpre := index (where $b.presets "key" $bex.preset) 0 -}}
{{- $fence := "```" -}}

{{- /* Figures as Markdown. */ -}}
{{- $F := newScratch -}}

{{- $pairs := findRE $pairRE $d.line.line -}}
{{- $t := printf "%sjsonl\n%s\n%s\n\nFig. 1. One record, field by field:\n\n| Field | Role | What it says | Required |\n|---|---|---|---|\n" $fence $d.line.line $fence -}}
{{- range $pairs -}}
  {{- $k := index (index (findRESubmatch `^"([^"]*)":` . 1) 0) 1 -}}
  {{- $f := index $d.line.fields $k -}}
  {{- $t = printf "%s| `%s` | %s | %s | %s |\n" $t $k (index $roleName (index $d.roles.fields $k | default "annot")) $f.says $f.needs -}}
{{- end -}}
{{- $F.Set "line" $t -}}

{{- $keys := dict }}{{ $letters := split "ABCDEFGHIJ" "" }}{{ $nd := 0 -}}
{{- range $d.file.lines }}{{ $o := transform.Unmarshal . }}{{ if isset $o "define" }}{{ $keys = merge $keys (dict (printf "%s|%v" $o.define $o.v) (index $letters $nd)) }}{{ $nd = add $nd 1 }}{{ end }}{{ end -}}
{{- $t = printf "%sjsonl\n%s\n%s\n\nFig. 2. The lines of `%s`, and the definition each record cites:\n\n| Line | Type | Definition |\n|---:|---|---|\n" $fence (delimit $d.file.lines "\n") $fence $d.file.file -}}
{{- range $i, $l := $d.file.lines -}}
  {{- $o := transform.Unmarshal $l -}}
  {{- $type := cond (isset $o "format") "header" (cond (isset $o "define") "definition" "record") -}}
  {{- $what := "" -}}
  {{- if eq $type "definition" }}{{ $what = printf "%s: `%s` v%v" (index $keys (printf "%s|%v" $o.define $o.v)) $o.define $o.v }}{{ else if eq $type "record" }}{{ $what = printf "cites %s" (index $keys (printf "%s|%v" $o.metric $o.v)) }}{{ end -}}
  {{- with index $d.file.notes (string (add $i 1)) }}{{ $what = printf "%s; %s" $what . }}{{ end -}}
  {{- $t = printf "%s| %d | %s | %s |\n" $t (add $i 1) $type $what -}}
{{- end -}}
{{- $F.Set "file" $t -}}

{{- $vd := dict }}{{ range $d.file.lines }}{{ $o := transform.Unmarshal . }}{{ if eq $o.define $d.file.versions }}{{ $vd = merge $vd (dict (printf "%v" $o.v) $o) }}{{ end }}{{ end -}}
{{- $t = printf "Fig. 3. Each `%s` record, read with the version it cites:\n\n| Line | date | Cites | Value | Read as |\n|---:|---|---|---:|---|\n" $d.file.versions -}}
{{- range $i, $l := $d.file.lines -}}
  {{- $o := transform.Unmarshal $l -}}
  {{- if eq $o.metric $d.file.versions }}{{ $def := index $vd (printf "%v" $o.v) }}{{ $t = printf "%s| %d | %s | v%v | %v | %v of %v–%v |\n" $t (add $i 1) $o.date $o.v $o.value $o.value $def.min $def.max }}{{ end -}}
{{- end -}}
{{- $F.Set "versions" $t -}}

{{- $t = printf "Fig. 4. Minutes per day, %s, after each definition's `combine`. A blank cell is a day with no record. Example data.\n\n| Day |" $m.monthLabel -}}
{{- range $m.multiples }}{{ $t = printf "%s `%s` |" $t . }}{{ end }}{{ $t = printf "%s\n|---:|" $t }}{{ range $m.multiples }}{{ $t = printf "%s---:|" $t }}{{ end }}{{ $t = printf "%s\n" $t -}}
{{- range $i := seq $m.days -}}
  {{- $t = printf "%s| %d |" $t $i -}}
  {{- range $m.multiples }}{{ $t = printf "%s %s |" $t ($R.Get (printf "%s|%s-%02d#" . $m.month $i) | default "") }}{{ end -}}
  {{- $t = printf "%s\n" $t -}}
{{- end -}}
{{- $F.Set "multiples" $t -}}

{{- $t = printf "Table 1. The month in one table. Low and high are per day, after `combine`. Example data.\n\n| Metric | Kind | Unit | Combine | Records | Days | %s | Daily low–high |\n|---|---|---|---|---:|---:|---:|---:|\n" $m.monthName -}}
{{- range $m.metrics -}}
  {{- $s := index $series .name -}}
  {{- $t = printf "%s| `%s` | `%s` | %s | `%s`%s | %d | %d | %s%s | %s–%s |\n" $t $s.name $s.def.kind (cond (isset $s.def "unit") (printf "`%v`" $s.def.unit) "none") $s.how (cond (isset $s.def "combine") "" " by default") $s.records $s.days $s.month (cond (eq $s.how "mean") " (mean)" "") $s.low $s.high -}}
{{- end -}}
{{- $F.Set "month-table" $t -}}

{{- $t = printf "%sjsonl\n%s\n%s\n\nFig. 5. %s: one number per metric.\n\n| Metric | Combine | Values that day | One number |\n|---|---|---|---:|\n" $fence (delimit $dayLines "\n") $fence $m.dayLabel -}}
{{- range $m.metrics -}}
  {{- $name := .name }}{{ $dg := .digits }}{{ $vs := slice -}}
  {{- range sort ($V.Get (printf "%s|%s" $name $m.day)) "t" }}{{ $vs = $vs | append (lang.FormatNumber $dg .v) }}{{ end -}}
  {{- $t = printf "%s| `%s` | `%s`%s | %s | %s %s |\n" $t $name (index $how $name) (cond (isset (index $mdefs $name) "combine") "" " by default") (delimit $vs ", ") ($R.Get (printf "%s|%s#" $name $m.day)) .unit -}}
{{- end -}}
{{- $t = printf "%s\nThe same values, five ways (the definition's choice is marked):\n\n| Combine |" $t -}}
{{- range $m.fiveWays }}{{ $t = printf "%s `%s` |" $t . }}{{ end }}{{ $t = printf "%s\n|---|" $t }}{{ range $m.fiveWays }}{{ $t = printf "%s---:|" $t }}{{ end }}{{ $t = printf "%s\n" $t -}}
{{- range $c := slice "sum" "mean" "min" "max" "last" -}}
  {{- $t = printf "%s| `%s` |" $t $c -}}
  {{- range $m.fiveWays }}{{ $t = printf "%s %s%s |" $t ($R.Get (printf "five|%s|%s#" . $c)) (cond (eq (index $how .) $c) " (chosen)" "") }}{{ end -}}
  {{- $t = printf "%s\n" $t -}}
{{- end -}}
{{- $F.Set "combine" $t -}}

{{- $t = printf "%sjsonl\n%s\n%s\n\nFig. 6. The run's records, placed by their own time:\n\n| Metric | From | To | Value | Label |\n|---|---|---|---:|---|\n" $fence (delimit $run.lines "\n") $fence -}}
{{- range $run.lines -}}
  {{- $o := transform.Unmarshal . -}}
  {{- if and (isset $o "metric") (eq $o.of $ev.id) -}}
    {{- $label := "" }}{{ range $k, $v := $o }}{{ if not (in $reserved $k) }}{{ $label = printf "%s: %v" $k $v }}{{ end }}{{ end -}}
    {{- $t = printf "%s| `%s` | %s | %s | %v %s | %s |\n" $t $o.metric (substr $o.at 11 5) (substr ($o.until | default $o.at) 11 5) $o.value (index $runDefs $o.metric).unit $label -}}
  {{- end -}}
{{- end -}}
{{- $F.Set "event" $t -}}

{{- $t = "| File | Verdict | Reports | Rules |\n|---|---|---|---|\n" -}}
{{- $detail := "" -}}
{{- range $c := $d.cases -}}
  {{- $err := 0 }}{{ $warn := 0 }}{{ range $c.checks }}{{ if eq (index $levels .) "error" }}{{ $err = add $err 1 }}{{ else }}{{ $warn = add $warn 1 }}{{ end }}{{ end -}}
  {{- $verdict := cond (gt $err 0) "Invalid" (cond (gt $warn 0) "Tolerated" "Valid") -}}
  {{- $reports := "no problems" }}{{ with $c.checks }}{{ $q := slice }}{{ range . }}{{ $q = $q | append (printf "`%s`" .) }}{{ end }}{{ $reports = delimit $q ", " }}{{ end -}}
  {{- $t = printf "%s| [%s.metrics](%s%s.metrics) | %s | %s | %s |\n" $t $c.file $exURL $c.file $verdict $reports (delimit $c.rules ", ") -}}
  {{- $ls := split (strings.TrimSuffix "\n" (index $files $c.file)) "\n" }}{{ $sel := slice }}{{ $nums := slice -}}
  {{- range $c.lines }}{{ $sel = $sel | append (index $ls (sub .n 1)) }}{{ $nums = $nums | append (printf "%d" .n) }}{{ end -}}
  {{- $detail = printf "%s### %s\n\n%s: %s. Line%s %s of `%s.metrics`:\n\n%sjsonl\n%s\n%s\n\n%s\n\n" $detail (replaceRE "`" "" $c.title) $verdict $reports (cond (gt (len $nums) 1) "s" "") (delimit $nums ", " " and ") $c.file $fence (delimit $sel "\n") $fence $c.gist -}}
{{- end -}}
{{- $F.Set "cases" (printf "%s\n%s" $t (strings.TrimSuffix "\n\n" $detail)) -}}

{{- $t = "The HTML page has a checker that runs in the browser. It reports the checks of §10 with these rules:\n\n| Check | Level | Rules it cites | When |\n|---|---|---|---|\n" -}}
{{- range $d.checks }}{{ $t = printf "%s| `%s` | %s | %s | %s |\n" $t .name .level (delimit .rules ", ") .when }}{{ end -}}
{{- $F.Set "checker" $t -}}

{{- $t = printf "The HTML page has a builder. It opens with this file:\n\n%sjsonl\n%s\n%s\n%s\n%s\n\nand reports:\n\n| Result | Line | Check | Rules | Detail |\n|---|---|---|---|---|\n" $fence (printf `{"format":"plaintext-metrics/%s","set":"%s"}` $ver $b.set) $bpre.line $bex.record $fence -}}
{{- range $b.sampleRows }}{{ $t = printf "%s| %s | %s | `%s` | %s | %s |\n" $t (cond (eq .status "ok") "OK" (title .status)) .part .check (delimit .rules ", ") .detail }}{{ end -}}
{{- $t = printf "%s\nThe examples it can load, and what the checker reports for each:\n\n| Example | Definition | Record | Reports |\n|---|---|---|---|\n" $t -}}
{{- range $b.examples }}{{ $def := .definition }}{{ with .preset }}{{ $def = (index (where $b.presets "key" .) 0).line }}{{ end }}{{ $t = printf "%s| %s | `%s` | `%s` | %s |\n" $t .label $def .record (cond (eq .expect "valid") "no problems" (printf "`%s`" .expect)) }}{{ end -}}
{{- $F.Set "builder" $t -}}

{{- /* Put it together. */ -}}
{{- $s := .RawContent -}}
{{- range $k, $v := $F.Values }}{{ $s = replace $s (printf "<!-- fig:%s -->" $k) (strings.TrimSuffix "\n" $v) }}{{ end -}}
{{- range $k, $v := $M.Values }}{{ $s = replace $s $k $v }}{{ end -}}
{{- $s = replace $s `<span class="m-example">Example data</span>` "**Example data.**" -}}
{{- $s = replaceRE `</?span[^>]*>` "" $s -}}
{{- $s = replace $s "](/" (printf "](%s/" $base) -}}
{{- with .OutputFormats.Get "HTML" }}{{ $s = replace $s "](#" (printf "](%s#" .Permalink) }}{{ end }}
Describes Plaintext Metrics {{ $ver }}: {{ $spec }}index.md. The HTML page also has a file checker and a line builder that run in the browser.

{{ partial "md-clean.html" $s }}
