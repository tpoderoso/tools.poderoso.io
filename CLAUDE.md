# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responda sempre em português do Brasil (pt-BR) nesta sessão, independente do idioma da pergunta.

## What this repo is

Source for **tools.poderoso.io** — a single-page dev-tools (NextJS) app (JSON/XML/SQL formatters, CPF/CNPJ/UUID/password/lorem generators, cURL→fetch converter, Base64/JWT encoders, text diff). The entire app is one file:

- `docs/tools.poderoso.io.dc.html` — template + logic, ~760 lines, no other source files.

There is no build step, package manager, linter, or test runner in this repo. It's a static asset meant to be dropped into a host page. To "run" it, just open/serve the HTML file in a browser — but note it `<script src="./support.js">`, which is **not** part of this repo; it's the DC framework runtime supplied externally by the deployment target. The page won't render standalone without it nearby.

## The "DC" (Declarative Component) format

This file follows a proprietary micro-framework convention, not React/Vue/etc. Understand these pieces before editing:

- **`<x-dc>`**: wraps the entire template. Everything inside it is static HTML with `{{ expr }}` interpolations, evaluated against the object returned by `Component.renderVals()`.
- **`<sc-if value="{{ boolExpr }}" hint-placeholder-val="{{ true|false }}">`**: conditional block. `hint-placeholder-val` is the assumed value before JS hydrates (used for initial paint) — always set it to match the real initial state of that expression.
- **`<sc-for list="{{ arrayExpr }}" as="itemName" hint-placeholder-count="N">`**: loop block, `itemName` is scoped inside for `{{ itemName.field }}` access.
- **`onClick="{{ handlerExpr }}"` / `onChange="{{ handlerExpr }}"`**: bind to functions returned from `renderVals()`.
- **`style-hover="..."` / `style-focus="..."`**: since styles are inline, pseudo-class variants are expressed as separate attributes rather than CSS `:hover`/`:focus`.
- **`<script type="text/x-dc" data-dc-script>`**: contains `class Component extends DCLogic`, the only JS in the file.

### `Component` class shape

- `state = {...}` — plain data (raw inputs, toggles, cached outputs). No computed/derived values live here.
- `componentDidMount()` — runs once; pre-populates outputs (e.g. generates an initial CPF/UUID/password) so panels aren't empty on first load.
- Plain methods — pure logic, one concern each (`genCPF`, `genCNPJ`, `genUUID`, `genPassword`, `loremText`, `fmtJSON`, `fmtXML`, `fmtSQL`, `parseCurl`, `b64Encode`/`b64Decode`, `decodeJWT`, `computeDiff`). These have no framework dependency and are unit-testable in isolation if ever needed.
- `renderVals()` — called every render; recomputes derived values (e.g. `jwt` decode result, `b64_out`, styled nav/toggle states) and returns **the full flat map of every `{{ }}` binding and handler** used in the template. This is the single source of truth for what the template can reference — if a template placeholder isn't a key in this returned object, it's a bug.
- `cl(key)` / `cp(text, key)` — shared "copy to clipboard" helpers; `copiedKey` in state drives the transient "✓ copiado" label via `cl()`.

## Adding a new tool panel

Follow the existing pattern (e.g. look at the `b64`/`jwt` panels as templates):

1. Add a nav `<button>` in the sidebar using the `ni('key')` helper pattern (`bg`/`color`/`run` wired to `setTool`).
2. Add an `<sc-if value="{{ isXxx }}" hint-placeholder-val="{{ false }}">` panel in the body with the tool's UI.
3. Add raw input/output fields to `state`.
4. Add pure logic as a new method on `Component`.
5. Wire `isXxx`, `navXxx`, and any handlers/derived fields into the object returned by `renderVals()`.
6. If the tool needs an initial value on load, seed it in `setTool()` (tab switch) and/or `componentDidMount()` (first load).

## Conventions to preserve

- UI copy is in **pt-BR** (Portuguese) — keep new tool labels/descriptions consistent with the existing tone (`~/format/json`, `formata e valida JSON com indentação`, etc.).
- Color palette is Dracula-inspired (`#50fa7b` green, `#8be9fd` cyan, `#ff79c6` pink, `#bd93f9` purple, `#f1fa8c` yellow, `#ff5555` red) against a `#21222c`/`#191a21` dark background — reuse these hex values rather than introducing new ones.
- No external dependencies beyond: Google Fonts (IBM Plex Mono) and `api.qrserver.com` for QR image generation. Keep it dependency-free otherwise — logic is vanilla JS (`fetch`, `atob`/`btoa`, `TextEncoder`/`TextDecoder`, `crypto`-free UUID via `Math.random`).
- Avoid layout shift: reserve space for dynamic/async content (fixed `min-height`, sized containers) instead of letting elements pop in and push everything else around. Applies to panel switches, async outputs (QR image, format results), and toggled states (`sc-if` blocks) — size the container for the worst case up front, don't let it grow/shrink on data arrival.
