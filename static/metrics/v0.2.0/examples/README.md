# Examples for Plaintext Metrics 0.2.0

Each file was run through a checker written from the specification. "Expected" is what a checker reports.

## Valid

| File | Expected | Why it is here |
|---|---|---|
| `valid.metrics` | no problems | A complete file: every kind of definition, two versions of one metric, labels, a list of units, a run event with records, place, and an import with `by` and `ref`. |

## Invalid

| File | Expected | Why it is invalid |
|---|---|---|
| `invalid-undefined-version.metrics` | `undefined` | A record cites version 2 of a metric, and the file defines only version 1. |
| `invalid-out-of-range.metrics` | `out_of_range` | A score of 8 is recorded against a definition whose highest value is 5. |
| `invalid-missing-header.metrics` | `header` | The file has no header line. |
| `invalid-unit.metrics` | `unit_mismatch` twice | The definition lists two units; one record states none, and another states a unit that is not on the list. |
| `invalid-two-kinds-of-line.metrics` | `bad_line` | One line has both `event` and `metric`, so it is neither an event nor a record. |
| `invalid-span.metrics` | `bad_span` | `until` is earlier than `at`. |
| `invalid-quantity-without-combine.metrics` | `missing_field` | A quantity is defined without `combine`, so nothing says whether its values add up or average. |
| `invalid-conflicting-definitions.metrics` | `definition_conflict` | The same name and version is defined twice with different units. |

## Edge cases

| File | Expected | What it shows |
|---|---|---|
| `edge-any-order.metrics` | no problems | The record comes first and the header last. Order has no meaning. |
| `edge-late-entry.metrics` | no problems | A record added after version 2 exists still cites version 1, and is read with version 1. |
| `edge-definitions-only.metrics` | no problems | A header and definitions with no records: a catalog that other files copy from. |
| `edge-day-after-midnight.metrics` | no problems | A record carries both `at` and `date`: it happened after midnight and counts toward the previous day. |
| `edge-missing-event.metrics` | warning `missing_event` | `of` names an event that is not in the file. A reader ignores the `of` and uses the record. |
| `edge-undeclared-label.metrics` | warning `undeclared_label` | A record carries a field its definition does not declare. The field is kept. |
