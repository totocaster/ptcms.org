---
title: "Plaintext Metrics"
type: "format"
eyebrow: "Format F-2"
summary: "A plain-text format for numbers recorded over time: one JSON object per line."
description: "Plaintext Metrics: a plain-text format for numbers recorded over time, with versioned specifications, a companion guide, a JSON Schema and example files."
shortname: "metrics"
extension: ".metrics"
status: "Working draft"
latest: "0.2.0"
updated: 2026-11-27
weight: 20
toc:
  - { id: "versions", title: "Versions" }
  - { id: "read", title: "Read" }
  - { id: "implementations", title: "Implementations" }
  - { id: "addresses", title: "Addresses" }
  - { id: "cite", title: "Cite" }
---

A Plaintext Metrics file keeps numbers recorded over time, such as a room's temperature, pages read or the distance of a run, one fact per line. Each file carries the definitions its numbers cite, so it stays readable on its own: in any editor, with `grep` and `jq`, by a program or by an agent.
