# ADR-002 — Canva integration and internal material studio

## Status
Accepted for a later implementation phase.

## Decision
Moje třída will include an internal visual material workspace and a Canva integration layer.

Canva is an optional downstream editor/export target, not a runtime dependency and not the only way to create teaching materials.

## Product requirement
The later Material Engine must support a teacher workflow for creating and editing visual teaching materials directly inside Moje třída, including at minimum:

- A4/A3 worksheets and handouts,
- cards and flashcards,
- classroom posters,
- presentation slides,
- quizzes and visual assignments,
- branded school/class templates,
- layouts generated from structured lesson/material content,
- print-safe margins and pagination,
- PDF export,
- future DOCX/Google Docs export where appropriate,
- an explicit action to continue editing in Canva when integration capabilities and licensing permit it.

## Internal Studio
The application should provide its own "Studio materiálů" so that basic creation, layout, preview and export remain available even if Canva is unavailable, disconnected, changes API capabilities, or becomes unsuitable for a given tenant.

The Studio must consume structured content from Material Engine instead of embedding arbitrary AI text directly into layout components.

## Canva integration principles

1. Provider abstraction — Canva-specific code must live behind an integration adapter.
2. No Canva credentials or privileged tokens in browser code.
3. No pupil identity data is required for Canva exports.
4. Pseudonymous learner labels should be removed from shared/exported files by default unless the teacher explicitly includes them and the export context is appropriate.
5. Teacher must explicitly initiate external export/open-in-Canva actions.
6. Canva integration must fail closed and never destroy or replace the internal material version.
7. The application remains fully usable for material generation and printing without Canva.
8. API scopes must follow least privilege.
9. Exact available Canva API/export capabilities and licensing must be re-verified immediately before implementation; do not hard-code assumptions from this ADR.

## Architecture placement
This requirement belongs to the later Material Engine / Export layer, after curriculum, planning and lesson structures are stable.

Likely boundary:

`Lesson/Material structured data -> Material Engine -> Internal Studio -> Export service -> {PDF, print, Canva adapter, future providers}`

## Non-goals for Phase 2

Phase 2 must not implement Canva UI, OAuth, API calls or visual-editor code. This ADR only preserves the requirement so it is not lost while the curriculum source-of-truth is completed.