# Graph Report - estudios-ramela  (2026-10-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 206 nodes · 377 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93ab46fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PulpitModal.tsx
- App.tsx
- package.json
- study-stream.ts
- compilerOptions
- SavedModal.tsx
- dependencies
- devDependencies
- manifest.json
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `react` - 19 edges
2. `compilerOptions` - 16 edges
3. `App()` - 15 edges
4. `lucide-react` - 15 edges
5. `useModalBackButton()` - 10 edges
6. `ensureOutlineTransition()` - 9 edges
7. `generateTheologicalStudy()` - 9 edges
8. `PulpitModal()` - 8 edges
9. `StudyDisplay()` - 7 edges
10. `PWAInstallButton()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `generateTheologicalStudy()`  [EXTRACTED]
  api/study.ts → src/utils/theologicalEngine.ts
- `handler()` --calls--> `generateTheologicalStudy()`  [EXTRACTED]
  api/study-stream.ts → src/utils/theologicalEngine.ts
- `App()` --calls--> `PulpitModal()`  [EXTRACTED]
  src/App.tsx → src/components/PulpitModal.tsx
- `App()` --calls--> `StudyDisplay()`  [EXTRACTED]
  src/App.tsx → src/components/StudyDisplay.tsx
- `AndroidInstallModal()` --calls--> `useModalBackButton()`  [EXTRACTED]
  src/components/AndroidInstallModal.tsx → src/hooks/useModalBackButton.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "PulpitModal.tsx"
Cohesion: 0.10
Nodes (30): react-markdown, remark-gfm, BibleVerseModal(), BibleVerseModalProps, TRANSLATIONS, PersonalNotesProps, clampTimerScale(), PulpitModal() (+22 more)

### Community 1 - "App.tsx"
Cohesion: 0.13
Nodes (23): lucide-react, react, react-dom, App(), formatUserErrorMessage(), AndroidInstallModal(), AndroidInstallModalProps, CoverHero() (+15 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (26): name, private, scripts, build, dev, lint, preview, type (+18 more)

### Community 3 - "study-stream.ts"
Cohesion: 0.18
Nodes (19): buildMessages(), errorMsg(), getHeaders(), isRetryable(), MODEL_CANDIDATES, OPENROUTER_API_URL, sleep(), THEOLOGICAL_SYSTEM_PROMPT (+11 more)

### Community 4 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 5 - "SavedModal.tsx"
Cohesion: 0.20
Nodes (12): SavedModalProps, CANONICAL_CATEGORIES, COMMON_SUGGESTIONS, StudyInputProps, INITIAL_FEATURED_STUDY, MASTER_CURATED_STUDIES, QUICK_SUGGESTIONS, PersonalNote (+4 more)

### Community 6 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, dotenv, html2canvas, jspdf, lucide-react, motion, react, react-dom (+5 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, sharp, tailwindcss, @types/express, @types/node, @types/react, @types/react-dom (+3 more)

### Community 8 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 9 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, version

## Knowledge Gaps
- **10 isolated node(s):** `autoprefixer`, `dotenv`, `html2canvas`, `motion`, `tailwindcss` (+5 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `PulpitModal.tsx`, `package.json`, `SavedModal.tsx`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `dotenv`, `html2canvas` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PulpitModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09986504723346828 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13109243697478992 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.tsx` to `PulpitModal.tsx`, `package.json`, `SavedModal.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._