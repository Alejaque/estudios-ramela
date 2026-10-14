# Estudios Alejandro Ramela — Guía para agentes

## Knowledge graph (Graphify) — consultar primero

Este repo tiene un knowledge graph generado con
[Graphify](https://github.com/Graphify-Labs/graphify) en `graphify-out/`.
Antes de leer archivos sueltos con grep/Read para preguntas sobre arquitectura,
relaciones entre archivos o "dónde está X", consultá el grafo:

```bash
graphify query "<pregunta>"      # contexto por BFS, ej: "cómo se genera un estudio teológico?"
graphify path "A" "B"            # camino más corto entre dos símbolos, ej: graphify path "App" "generateTheologicalStudy"
graphify explain "X"             # qué es un nodo y sus vecinos, ej: graphify explain "App"
graphify god-nodes --top 10     # hubs arquitectónicos
```

Fuentes de verdad por caso:

- Arquitectura general / revisión amplia → `graphify-out/GRAPH_REPORT.md`
- Pregunta puntual / alcance reducido → `graphify query/path/explain` (preferido sobre leer el reporte entero)
- Visual interactivo → abrir `graphify-out/graph.html` en el browser

## Mantener el grafo fresco

El grafo se genera 100% local (AST, sin LLM, sin API key). Después de cambiar código:

```bash
graphify update .            # re-extrae solo archivos cambiados (gratis, sin API)
graphify cluster-only .      # regenera reporte + HTML si cambiaste estructura
```

Regenerar desde cero:

```bash
graphify extract . --code-only && graphify cluster-only .
```

Si `graphify` no está instalado: `pip install graphifyy` (requiere Python 3.10+).

## Proyecto

- `npm install && npm run dev` — solo frontend (Vite). Para APIs locales usar `vercel dev`.
- `api/` — Vercel serverless functions (`study.ts`, `study-stream.ts`, `_shared.ts`, `health.ts`).
- `src/utils/theologicalEngine.ts` — motor teológico local (fallback sin API).
- No commitear `graphify-out/cache/` (ver `.gitignore`).
