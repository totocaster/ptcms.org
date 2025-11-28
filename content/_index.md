---
title: "Plaintext Commons — Manifesto"
description: "A design stance for an open corpus: the folder is the platform, the file is the protocol, and writes are previewed and reversible. Tools—including AI models from frontier to local—assist without owning the data."
version: "0.2"
date: 2025-11-28
---

**Premise:** Knowledge should outlast software.  

**Claim:** Today’s models read the same mediums we do—_predominantly text_—and other media (images, audio, video) are readily transcribable into text. The old “human-readable vs machine-readable” trade-off collapses.  

**Consequence:** Store what matters in _plain text (Markdown or .txt)_. Let tools come and go.


## Why now

For decades, computers demanded rigid, app-specific formats. Modern tools (including AI) read and reason over text directly. That enables a different architecture:

- **Data is stable** — files you control.  
- **Tools are interchangeable** — editors, CLIs, and agents operate on those files.  
- **Intelligence is layered** — indexers and agents understand without owning the data.



## Core principles (non-negotiables)

1. **Files over apps.** Your **corpus** (a folder of open files) is the system of record.  
2. **Plain text by default.** Use Markdown or .txt; keep light metadata in _frontmatter_ (or a tiny sidecar file for .txt when necessary).  
3. **Tools assist, they don’t annex.** No tool owns the data or invents a private schema that captures it.  
4. **Writes are previewed and reversible.** Tools propose changes; you review and apply; changes have a clear _provenance trail_.
5. **Composability beats monoliths.** Many small tools on one shared corpus.  
6. **Minimum ceremony.** Conventions only where they pay for themselves (naming, links, frontmatter).  
7. **Portability and durability.** Ten years from now, the files still open and make sense.  
8. **Privacy first.** Local by default; use cloud only with explicit consent.  
9. **No exports. No migrations.** The folder *is* the platform.



## The three laws of the Commons

1. **The folder is the platform.**  
   One _corpus_—a folder of open files—acts as the system of record.

2. **The file is the protocol.**  
   Stable, human-readable _plain text (Markdown or .txt)_ with optional _frontmatter_. No opaque blobs.

3. **Writes are previewed and reviewable.**  
   Tools propose changes; you preview and accept; a simple log/history preserves *why* changes happened, not just *what* changed.



## Multi-tool by design

Different tools specialize and still cooperate because they share the same substrate:

- **Authoring** in any editor.  
- **Browsing & searching** (exploration and retrieval) via tools—indexers, embeddings, and link graphs.  
- **Scripting and automation** with scripts, CLIs or any automation tool.  
- **Organizing chores** (linking, filing, light refactors) delegated to tools or agents—without taking ownership of the data.  
- **Capture & ingestion** from email, PDFs, and transcripts—converted to text with attachments nearby.

_No exports. No migrations._



## Minimal working conventions

Keep it robust without bureaucracy:

- **Shallow corpus.** Let search, links, tags, and tools handle the heavy lifting—including organizing chores.  
- **Note schema is optional.** Zettelkasten, Fleeting/Project/Evergreen, or none—your choice.  
- **Stable filenames.** Use a simple stamp pattern (e.g., `date + slug`) if it helps.  
- **Metadata:**  
  - _Markdown:_ use frontmatter for light metadata.  
  - _.txt_: use a tiny sidecar only when needed.
- **Sync/history:** Git, cloud sync, or both—your call.


## Norms for tools (agents included)

- **Read-only by default; explicit writes.**  
- **Previewable changes with rationale.** Generate human-auditable previews before any write.  
- **Respect corpus rules.** Honor ignore lists, attachment folders, and local settings.  
- **Pipe-friendly I/O.** Text/JSON in and out; compose with other CLIs and tools.  
- **AI and agent-aware.** Expose capabilities in open, automatable ways (e.g., MCP/stdio/HTTP)—no proprietary lock-ins.  
- **No schema capture.** Indexes are caches; they are purgable and never become the source of truth.



## Adoption path (practical, not sacred)

1. **Start a corpus.** Pick a folder. Make it your system of record.  
2. **Choose light conventions.** Naming, links, and minimal front matter; stop when marginal value drops.  
3. **Add an indexer.** Turn on FTS + embeddings + backlinks; let the index come to the files, not the other way around.  
4. **Introduce a tool/agent.** Examples: [Claude Code](https://docs.anthropic.com/claude/docs/claude-code) (CLI), [Claude.ai](https://claude.ai/) or [ChatGPT](https://chatgpt.com/) (app), or [LM Studio](https://lmstudio.ai/) (local). Use open interfaces (CLI, MCP/stdio/HTTP).  
5. **Require previewable writes.** Propose → preview → apply → log.  
6. **Iterate only where it pays.** Improve naming, linking, tagging, and automation gradually.



## The Plaintext Test

Ask this before adopting a tool or workflow:

1. Can I read/edit the files with a basic text editor?  
2. Can I move the folder and keep working—no exports required?  
3. Can the tool propose a human-auditable preview of changes (with rationale) before writing?  
4. Will this still make sense in ten years?

If not, it’s not Commons-compatible.


## Industry note

This is a **design stance**, not a membership. Build tools that keep data open, changes explainable, and the folder first. Everything else is replaceable.


_The initial version of the manifesto is written by [Toto Tvalavadze](https://ttvl.co)._
