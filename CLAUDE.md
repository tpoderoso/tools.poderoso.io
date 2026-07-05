# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responda sempre em português do Brasil (pt-BR) nesta sessão, independente do idioma da pergunta.

## What this repo is

Source for **tools.poderoso.io** — a single-page dev-tools app (JSON/XML/SQL formatters, CPF/CNPJ/UUID/password/lorem generators, cURL→fetch converter, Base64/JWT encoders, text diff, QR code). It's a real **Next.js 16 (App Router) + React 19 + TypeScript** app, not a static file:

- `app/` — `layout.tsx` (root HTML shell, IBM Plex Mono font), `page.tsx` (renders `ToolsApp`), `globals.css` (theme variables + shared primitive classes).
- `components/tools/` — one component per tool panel (`JsonFormatter.tsx`, `CpfGenerator.tsx`, `UuidGenerator.tsx`, etc.) plus `ToolsApp.tsx`, which owns the active-tool state and mounts every panel.
- `components/layout/` — `Header.tsx`, `Sidebar.tsx`, `NavButton.tsx`.
- `components/ui/` — shared primitives reused across tool panels: `ToolPanel`, `SplitPane`, `TextAreaField`, `OutputPane`, `GeneratorResult`, `CenteredColumn`, `ToggleButton`, `PrimaryButton`, `CopyButton`.
- `lib/tools/` — pure, framework-free logic, one file per tool (`cpf.ts`, `cnpj.ts`, `uuid.ts`, `password.ts`, `lorem.ts`, `json.ts`, `xml.ts`, `sql.ts`, `curl.ts`, `base64.ts`, `jwt.ts`, `diff.ts`, `random.ts`). Unit-testable in isolation, no React imports.
- `lib/nav.ts` — `ToolId` union, `NAV_GROUPS` (sidebar structure), `DEFAULT_TOOL`.
- `lib/hooks/useOnActivate.ts` — runs a callback exactly once when a `active` prop flips `false → true` (used to regenerate a value the first time a tab is opened, without a `useEffect`).

Standard Next.js tooling applies: `npm run dev` / `build` / `start` / `lint` (ESLint via `eslint.config.mjs`), `tsconfig.json`, no test runner configured. Deployed via Docker (`Dockerfile`, multi-stage build → `next build` with `output: "standalone"` in `next.config.ts`; `docker-compose.yml` runs it on port 3000).

`docs/tools.poderoso.io.html` is a **legacy static artifact** from before the Next.js rewrite — it is not built, served, or referenced by the app. Don't treat it as source of truth; prefer deleting it if it's confirmed dead weight.

## Architecture: how tool panels stay alive across tab switches

`ToolsApp.tsx` renders **every** tool panel simultaneously inside a `Slot` wrapper that toggles `display: contents | none` — panels are never unmounted when you switch tabs, only hidden. This is why state (e.g. a generated password) survives a round trip through other tabs, and why `useOnActivate` works: each panel receives an `active` boolean, and the hook fires its callback the moment that boolean flips to `true` (i.e., the tab was just opened), regenerating output lazily instead of on every render.

Format/convert tools (JSON, XML, SQL, cURL, Base64 text) don't need `active`/`useOnActivate` — they compute their initial output eagerly via `useState(() => ...)` and recompute on button click.

## Adding a new tool panel

1. Add the id to the `ToolId` union and a `NavItem` entry in the right `NAV_GROUPS` group in [lib/nav.ts](lib/nav.ts).
2. Add pure logic as a new file in `lib/tools/` (no React, no DOM globals beyond what's already used: `fetch`, `atob`/`btoa`, `TextEncoder`/`TextDecoder`, `crypto.getRandomValues`/`crypto.subtle`).
3. Add `components/tools/NewTool.tsx` following an existing panel as a template — a generator (`CpfGenerator.tsx`, uses `useOnActivate`) or a format/convert tool (`JsonFormatter.tsx`, uses `SplitPane` + `TextAreaField` + `OutputPane`). Reuse `components/ui/` primitives instead of hand-rolling markup.
4. Wire it into `ToolsApp.tsx`: import the component and add a `<Slot active={tool === "newid"}>` entry.

## Conventions to preserve

- UI copy is in **pt-BR** (Portuguese) — keep new tool labels/descriptions consistent with the existing tone (`~/format/json`, `formata e valida JSON com indentação`, etc.).
- Color palette is Dracula-inspired, defined as CSS custom properties in `app/globals.css` (`--color-primary` `#50fa7b`, `--color-accent-cyan` `#8be9fd`, `--color-accent-pink` `#ff79c6`, `--color-secondary` `#bd93f9`, `--color-accent-yellow` `#f1fa8c`, `--color-danger` `#ff5555`, background `--color-bg` `#21222c` / `--color-bg-alt` `#191a21`). Reference the CSS variables (`var(--color-*)`) in components rather than hardcoding new hex values.
- Shared styling rule in `globals.css`: a class only belongs there if 2+ components use it; styling for a single component goes inline in that component (see the comment above `/* primitivos compartilhados */`). `:hover` and `@keyframes` are the sanctioned exceptions since they can't be expressed as inline styles.
- Dependencies are intentionally minimal: `next`, `react`/`react-dom`, `lucide-react` (icons), `sql-formatter` (SQL formatting only). Don't add a new dependency for something a few lines of vanilla JS/TS already covers in `lib/tools/`.
- Avoid layout shift: reserve space for dynamic/async content (fixed `min-height`, sized containers) instead of letting elements pop in and push everything else around. Applies to panel switches, async outputs (QR image, format results), and conditionally rendered blocks.
