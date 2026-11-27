---
title: "How formats mature"
eyebrow: "Formats · Process"
summary: "How a format is proposed, how it matures, and how its versions are addressed."
description: "The Plaintext Commons format lifecycle, URL and versioning rules, and how to propose a format."
weight: 90
---

Formats are how tools agree without owning your data. A format moves forward by being used, not by the calendar, and every version keeps its own address so a citation never changes meaning.

## Lifecycle {#section-1}

{{< aside >}}
<span class="status status--working-draft">Working draft</span> <span class="status status--draft">Draft</span> <span class="status status--candidate">Candidate</span> <span class="status status--stable">Stable</span>

The label on a version gets heavier as the format settles.
{{< /aside >}}

**Working draft.** Written in the open. Anything can still change.

**Draft.** Published at a versioned address. Open for comment and trial implementations.

**Candidate.** Complete. Changes only fix problems that implementers find.

**Stable.** Settled. Implementations can rely on it; any change in meaning needs a new version.

**Superseded.** Replaced by a newer version, which it links to. Still served, never deleted.

What moves a format from one stage to the next, such as how many independent implementations a Candidate needs, is still being decided.

## Versions and addresses {#section-2}

> **U-1** Each format has one short name, taken from its file extension (`tasks` for `.tasks.md`). It is used in the format's address, its rule IDs and its citation key.

> **U-2** A version lives at `/{name}/v{major}.{minor}.{patch}/`, and its text never changes. Errata are added as notes; changing a rule means publishing a new version.

> **U-3** Status is a property of a version, shown on its page and in `/formats.json`, never part of the address.

> **U-4** Frozen version pages are canonical. Moving addresses such as `/tasks/latest/` and `/tasks/v0/` redirect to them.

> **U-5** Guides are not normative. They live beside the specification, follow the latest version and say which version they describe.

> **U-6** Every section and every rule has a stable anchor, such as `#section-7.5` and `#T-10`. A rule ID is never reused.

> **U-7** Every page has a Markdown twin at `index.md` beside it. Machine-readable files, such as `rules.json`, sit inside the version they describe.

> **U-8** A published address never breaks. Old addresses become redirects.

## Proposing a format {#section-3}

A proposal starts with real files, not a grammar. It should say:

- the format's name and file extension;
- the problem it solves, and why an existing format does not;
- examples first: a few complete files, as they would be written by hand;
- the rules for writers and for readers, each one testable;
- what is deliberately out of scope;
- how a file passes the [Plaintext Test](/manifesto/#the-plaintext-test).

Open an issue in the [Plaintext Commons repository](https://github.com/totocaster/plaintext-commons) with the proposal and its example files. Discussion happens in public, and a Working draft is published once the examples hold up.

## Implementations {#implementations}

If you build an app, library or agent tool that reads or writes a format, open an issue with a link and a sentence about what it does. Implementations are listed on the format's page.
