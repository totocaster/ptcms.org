---
title: "Plaintext Metrics, a companion"
navTitle: "Companion"
crumb: "Companion"
type: "metrics-guide"
role: "companion"
weight: 20
eyebrow: "Format F-2 · Guide"
summary: "One line taken apart, a file built around it, a month read back as charts, a run, the ways a file goes wrong, and a builder for a line of your own."
description: "A companion to the Plaintext Metrics 0.2.0 specification: worked figures, example files with their checker results, and a working line builder."
status: "Working draft"
version: "0.2.0"
describes: "0.2.0"
toc:
  - { id: "a-line", title: "A line" }
  - { id: "a-file", title: "A file" }
  - { id: "a-month", title: "A month" }
  - { id: "events", title: "Events" }
  - { id: "when-things-go-wrong", title: "When things go wrong" }
  - { id: "write-one", title: "Write one" }
  - { id: "for-agents", title: "For agents" }
---

{{< aside >}}
Fields are coloured by role, in the figures, in the code and in the text: <span class="f-time">identity and time</span>, <span class="f-what">what</span>, <span class="f-measure">measurement</span>, <span class="f-prov">provenance</span> and <span class="f-annot">annotation</span>. The colour only repeats what the field's name already says.
{{< /aside >}}

The [specification](/metrics/v0.2.0/) says what a metrics file must be. This companion shows one. It takes a single line apart, builds a file around it, reads a month of lines back as numbers, follows a run, collects the ways a file goes wrong, and ends with a builder for a line of your own. Every rule it touches is cited by its ID and links to the rule itself.

The guide is not normative. Where it and the specification differ, the specification is right.

## A line {#a-line}

{{< aside >}}
Rules: [M-5](/metrics/v0.2.0/#M-5) · [M-42](/metrics/v0.2.0/#M-42) · [M-43](/metrics/v0.2.0/#M-43) · [M-45](/metrics/v0.2.0/#M-45) · [M-48](/metrics/v0.2.0/#M-48) · [M-52](/metrics/v0.2.0/#M-52) · [M-74](/metrics/v0.2.0/#M-74)
{{< /aside >}}

A record is one line: one JSON object on a single line ([M-5](/metrics/v0.2.0/#M-5)), stating one number for one metric at one time. Taken apart, it says when something happened, what was measured and by which definition, how much, how it is labelled, and who says so.

<!-- fig:line -->

{{< aside >}}
There is no `unit` on this line. Version 1 of `reading.time` states a single unit, `min`, so the record doesn't repeat it ([M-50](/metrics/v0.2.0/#M-50)).
{{< /aside >}}

Four things are required: `metric`, `v`, `value`, and a time in `at` or `date` ([M-42](/metrics/v0.2.0/#M-42)). Together, `metric` and `v` cite a definition: this number is reading time as version 1 of its definition describes it. The `value` is a bare number ([M-43](/metrics/v0.2.0/#M-43)): `35`, never `"35"` and never `"35 min"`. What kind of number it is, its unit and how its values combine all live in the definition.

`at` is a moment with its offset from UTC ([M-45](/metrics/v0.2.0/#M-45)), and `until` closes the span that `at` opens ([M-48](/metrics/v0.2.0/#M-48)). `medium` is a label: the definition declares it, and the record writes it as a field of its own ([M-52](/metrics/v0.2.0/#M-52)). `note` is for people. `by` and `ref` say where the line came from, the app that recorded it and the item's identifier there, so that running an import twice adds nothing the second time ([M-58](/metrics/v0.2.0/#M-58)).

The fields come in a fixed order, fact first: the time, the metric and its version, the value, then everything that qualifies it ([M-74](/metrics/v0.2.0/#M-74)). Readers accept the fields in any order ([M-75](/metrics/v0.2.0/#M-75)). The order is for people scanning a file.

## A file {#a-file}

{{< aside >}}
Rules: [M-10](/metrics/v0.2.0/#M-10) · [M-15](/metrics/v0.2.0/#M-15) · [M-16](/metrics/v0.2.0/#M-16) · [M-19](/metrics/v0.2.0/#M-19) · [M-20](/metrics/v0.2.0/#M-20) · [M-23](/metrics/v0.2.0/#M-23) · [M-28](/metrics/v0.2.0/#M-28) · [M-29](/metrics/v0.2.0/#M-29) · [M-30](/metrics/v0.2.0/#M-30)
{{< /aside >}}

A file is a set of lines of four types, each recognised by one field: a header has `format`, a definition has `define`, a record has `metric` and an event has `event` ([M-15](/metrics/v0.2.0/#M-15)). Here is a small file with the first three. Events have [a chapter of their own](#events).

<!-- fig:file -->

The header names the format and the version of the specification the file follows, `plaintext-metrics/0.2.0` ([M-20](/metrics/v0.2.0/#M-20)), and the set of definitions it uses, `ada/journal` ([M-19](/metrics/v0.2.0/#M-19)). A set is one author's vocabulary, named `owner/name` ([M-22](/metrics/v0.2.0/#M-22)). Every line in the file belongs to it ([M-23](/metrics/v0.2.0/#M-23)), and there is exactly one header ([M-16](/metrics/v0.2.0/#M-16)).

### Why the file carries its definitions

A record that says `"metric":"reading.time","v":1` means nothing until something says what version 1 of reading time is. If that lived in an app's settings, the file would stop making sense the day the app was gone. So the file carries every definition its records cite ([M-10](/metrics/v0.2.0/#M-10)), and each definition says everything needed to read its numbers: the kind of number, its unit or bounds, its labels, how its values combine and what it measures ([M-32](/metrics/v0.2.0/#M-32)).

{{< aside >}}
A file may hold definitions and nothing else: a catalog that other files copy from ([M-11](/metrics/v0.2.0/#M-11)). The definitions on this page that share a name with the specification's own `ada/journal` examples are copied from them exactly.
{{< /aside >}}

Several files of one set may each carry the same definition. That is the price of being self-contained, and it is small: a definition is one line, and every copy within a set must be identical ([M-12](/metrics/v0.2.0/#M-12)). Lines are an unordered set, so the header needn't be first ([M-18](/metrics/v0.2.0/#M-18)), although a writer should put it there ([M-17](/metrics/v0.2.0/#M-17)).

### Two versions of one definition

Definitions change. Ada rated books from 1 to 5 until the summer, and from 1 to 10 after it. A definition is never edited once a line cites it ([M-28](/metrics/v0.2.0/#M-28)): the change is a new definition line with a higher `v` ([M-29](/metrics/v0.2.0/#M-29)). Both versions stay in the file, and each record says which one it was written against.

<!-- fig:versions -->

A reader interprets each value with the version its line cites ([M-30](/metrics/v0.2.0/#M-30)). Line 9 was added in July, for a book finished in March. It says `"v":1`, so its 5 is five out of five, and where it sits in the file changes nothing ([M-8](/metrics/v0.2.0/#M-8)). A view across both versions shows them under the newest version's name ([M-31](/metrics/v0.2.0/#M-31)).

## A month {#a-month}

{{< aside >}}
<span class="m-example">Example data</span> Every number in this chapter is computed from an invented file: one month of Ada's journal, <!--stat:file:lines--> lines.

Rules: [M-37](/metrics/v0.2.0/#M-37) · [M-38](/metrics/v0.2.0/#M-38) · [M-39](/metrics/v0.2.0/#M-39) · [M-47](/metrics/v0.2.0/#M-47) · [M-49](/metrics/v0.2.0/#M-49) · [M-78](/metrics/v0.2.0/#M-78)
{{< /aside >}}

Read back, a month of lines becomes a month of numbers. In October Ada read on <!--stat:reading.time:days--> days <!--spark:reading.time--> for <!--stat:reading.time:month--> minutes in all, walked <!--spark:walk.time--> for <!--stat:walk.time:month--> minutes, and practised the piano <!--spark:piano.practice--> on <!--stat:piano.practice:days--> days. Her study <!--spark:room.temperature--> cooled from <!--stat:room.temperature:first--> °C on the first to <!--stat:room.temperature:last--> °C on the last, and she read <!--stat:reading.pages:month--> pages <!--spark:reading.pages-->.

{{< aside >}}
The clocks went back on 25 October. From that morning the lines carry `+01:00` instead of `+02:00`, the offset of the place where they happened ([M-46](/metrics/v0.2.0/#M-46)). Each line's day is still the date written in it.
{{< /aside >}}

To get there, a reader groups records by metric and version, then by day. A record's day is its `date` when it has one, and otherwise the date written in its `at`, read as written, with no conversion to another time zone ([M-49](/metrics/v0.2.0/#M-49)). One session on 17 October ran past midnight; it carries `"date":"2026-10-17"` and counts toward the evening it belongs to.

<!-- fig:multiples -->

Three metrics in the same unit sit side by side at one scale, so a bar of a given height means the same number of minutes in every panel. They are never stacked or added together: reading and walking are different metrics, and a reader never adds different metrics ([M-39](/metrics/v0.2.0/#M-39)).

<!-- fig:month-table -->

### One number per day

{{< aside >}}
`last` means latest in time. Lines have no order ([M-8](/metrics/v0.2.0/#M-8)), so the last line in the file means nothing.
{{< /aside >}}

Most days hold several values of one metric: two walks, three temperature readings. The definition's `combine` says how they become one number: `sum`, `mean`, `min`, `max` or `last` ([M-37](/metrics/v0.2.0/#M-37)). Here is <!--stat:file:dayLabel--> as it sits in the file, and what each definition makes of it.

<!-- fig:combine -->

`reading.pages` states no `combine`. It is a count, so a reader adds its values up: a count or a flag is summed and a score is averaged ([M-38](/metrics/v0.2.0/#M-38)). A quantity has no default, and must say ([M-78](/metrics/v0.2.0/#M-78)): some quantities add up and others average. A mean suits a temperature, but it would turn <!--day:walk.time:sum--> minutes of walking into <!--day:walk.time:mean-->.

A month total can also be written directly, as one record with `"date":"2026-10"` ([M-47](/metrics/v0.2.0/#M-47)). Don't write it beside the daily records it totals: nothing yet stops a sum from counting both ([§12](/metrics/v0.2.0/#section-12), question 2).

## Events {#events}

{{< aside >}}
Rules: [M-61](/metrics/v0.2.0/#M-61) · [M-62](/metrics/v0.2.0/#M-62) · [M-63](/metrics/v0.2.0/#M-63) · [M-64](/metrics/v0.2.0/#M-64) · [M-65](/metrics/v0.2.0/#M-65) · [M-66](/metrics/v0.2.0/#M-66) · [M-67](/metrics/v0.2.0/#M-67)
{{< /aside >}}

Some numbers belong to one occasion, such as the distance and the average heart rate of a run. An event line stands for the occasion itself. It has a type, a time and an `id`, and no value of its own ([M-61](/metrics/v0.2.0/#M-61), [M-62](/metrics/v0.2.0/#M-62)). Records join it by naming that `id` in `of`.

<!-- fig:event -->

The event holds what is true of the whole run: its span, its surface, where it started and a note. The run lasted <!--run:minutes--> minutes, which follows from its span and is not stored again. The distance is three records with a `segment` label, and the run's distance is their plain sum, <!--run:distance--> km. The heart rate is another metric, so it is never added to the distance ([M-39](/metrics/v0.2.0/#M-39)).

{{< aside >}}
An event can be part of a larger one. A triathlon's swim, ride and run are events whose `of` names the triathlon ([§8.3](/metrics/v0.2.0/#section-8.3)).
{{< /aside >}}

Each record keeps its own `at`, so it still reads correctly without the event line. If `of` names an `id` that no event line has, a reader ignores that `of` and keeps the record ([M-65](/metrics/v0.2.0/#M-65)), and a checker warns with `missing_event`. Sharing a value in `of` doesn't make lines a group; the event line has to exist ([M-66](/metrics/v0.2.0/#M-66)). The run's definition has the kind `event`, which a record may never cite ([M-63](/metrics/v0.2.0/#M-63)), and it lists the metrics a run normally holds ([M-67](/metrics/v0.2.0/#M-67)).

## When things go wrong {#when-things-go-wrong}

{{< aside >}}
Three verdicts, each with a mark and a word. <!--verdict:valid-->: no problems. <!--verdict:invalid-->: at least one error, and readers leave each line in error out of every result. <!--verdict:tolerated-->: warnings only, and every line is still used.
{{< /aside >}}

Each cell below is one of the published [example files](/metrics/v0.2.0/examples/README.md), cut to the lines that matter, with the verdict a checker gives and the names it reports. The names are the ones in [§10](/metrics/v0.2.0/#section-10), which every tool uses ([M-77](/metrics/v0.2.0/#M-77)). A reader ignores a line with an error, leaving it out of every result, and keeps reading the rest of the file ([M-76](/metrics/v0.2.0/#M-76)). A line with only a warning is still used.

<!-- fig:cases -->

### Check a file

Paste a file, or load one of the examples. The checker runs in your browser. It reports every problem by line, with its name from §10 and the rule behind it, and says which lines a reader would leave out.

<!-- fig:checker -->

## Write one {#write-one}

{{< aside >}}
Rules: [M-24](/metrics/v0.2.0/#M-24) · [M-33](/metrics/v0.2.0/#M-33) · [M-78](/metrics/v0.2.0/#M-78) · [M-34](/metrics/v0.2.0/#M-34) · [M-35](/metrics/v0.2.0/#M-35) · [M-42](/metrics/v0.2.0/#M-42) · [M-44](/metrics/v0.2.0/#M-44) · [M-51](/metrics/v0.2.0/#M-51) · [M-53](/metrics/v0.2.0/#M-53) · [M-74](/metrics/v0.2.0/#M-74)
{{< /aside >}}

Start from a definition or type your own, then fill in a record. The builder writes the three-line file they make, with the record in the order of [M-74](/metrics/v0.2.0/#M-74), and checks it as you type. Each check shows the name a tool would report and the rule behind it.

<!-- fig:builder -->

## For agents {#for-agents}

{{< aside >}}
Rules: [M-3](/metrics/v0.2.0/#M-3) · [M-28](/metrics/v0.2.0/#M-28) · [M-29](/metrics/v0.2.0/#M-29) · [M-33](/metrics/v0.2.0/#M-33) · [M-78](/metrics/v0.2.0/#M-78) · [M-58](/metrics/v0.2.0/#M-58) · [M-68](/metrics/v0.2.0/#M-68) · [M-69](/metrics/v0.2.0/#M-69) · [M-70](/metrics/v0.2.0/#M-70) · [M-71](/metrics/v0.2.0/#M-71) · [M-72](/metrics/v0.2.0/#M-72) · [M-73](/metrics/v0.2.0/#M-73)
{{< /aside >}}

An agent writes to a metrics file the way a careful person would. It reads the definitions first, shows the line it means to add, and appends only once that is approved.

1. **Read the definitions.** Find the metric, cite the version whose meaning you are recording (normally the newest), and read its `about` before you write.
2. **Define before you record.** If no definition fits, append one with a new name, `"v":1`, what its kind requires (a quantity needs a `unit` and a `combine`) and a plain `about`. Never edit a definition that a line already cites: publish a new version instead ([M-28](/metrics/v0.2.0/#M-28), [M-29](/metrics/v0.2.0/#M-29)).
3. **Write one compact line**, fact first ([M-74](/metrics/v0.2.0/#M-74)), with no spaces outside strings ([M-73](/metrics/v0.2.0/#M-73)), ending in a line feed ([M-3](/metrics/v0.2.0/#M-3)).
4. **Append it** at the end of the file ([M-68](/metrics/v0.2.0/#M-68)), with `>>`, never `>`.
5. **Import without doubling.** Put the source in `by` and its identifier in `ref`. If the pair is already in the file, add nothing ([M-58](/metrics/v0.2.0/#M-58)).

```sh
# 1. Show the line
line='{"at":"2026-11-26T21:40+01:00","until":"2026-11-26T22:10+01:00","metric":"reading.time","v":1,"value":30,"medium":"audio","note":"Two chapters before bed"}'
printf '%s\n' "$line"

# 2. Once approved, append it. >> adds a line; > would replace the whole file.
printf '%s\n' "$line" >> journal.metrics
```

{{< aside >}}
`printf '%s\n'` writes the line exactly as given and ends it with a line feed. `echo` can treat backslashes differently from one shell to the next.
{{< /aside >}}

An import checks for its `by` and `ref` before it writes, so a second run finds the pair and adds nothing:

```sh
jq -e 'select(.by == "timer-app" and .ref == "s-2207")' journal.metrics > /dev/null \
  || printf '%s\n' "$line" >> journal.metrics
```

Reading needs only the day rule of [M-49](/metrics/v0.2.0/#M-49): a record's day is its `date`, or else the date written in its `at`.

```sh
# Minutes read on 26 November
jq -s '[.[] | select(.metric == "reading.time" and .v == 1)
            | select((.date // .at[0:10]) == "2026-11-26") | .value] | add' journal.metrics
```

### Correcting a line

A wrong line is fixed where it stands. Replace exactly that one line, or delete it, and leave every other line as it was, byte for byte and in the same order ([M-69](/metrics/v0.2.0/#M-69), [M-71](/metrics/v0.2.0/#M-71)). Never append a line whose purpose is to replace or withdraw another ([M-70](/metrics/v0.2.0/#M-70)): the file would then say two things, and every plain sum would be wrong. Version control or the sync system keeps what the line used to say.

```diff
- {"at":"2026-11-26T07:30+01:00","until":"2026-11-26T08:05+01:00","metric":"reading.time","v":1,"value":350,"medium":"paper","note":"Before breakfast","by":"timer-app","ref":"s-2207"}
+ {"at":"2026-11-26T07:30+01:00","until":"2026-11-26T08:05+01:00","metric":"reading.time","v":1,"value":35,"medium":"paper","note":"Before breakfast","by":"timer-app","ref":"s-2207"}
```

Find the line by what it says, not by where it was: another writer may have appended since you last looked. `grep -n '"ref":"s-2207"' journal.metrics` gives its current line number. A tool that rewrites a line writes back every field it doesn't understand, unchanged ([M-72](/metrics/v0.2.0/#M-72)).
