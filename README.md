# Estudios Alejandro Ramela — Vercel Serverless

## Deploy en Vercel

1. Subí esta carpeta a GitHub
2. Importala en https://vercel.com/new
3. En **Environment Variables** agregá:
   - `OPENROUTER_API_KEY` → tu key de https://openrouter.ai/keys
4. Click en **Deploy** ✅

## Desarrollo local

```bash
npm install
npm run dev        # solo frontend (Vite)
```

Para probar las funciones API localmente necesitás Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

## Knowledge graph (Graphify)

El repo incluye un grafo de conocimiento generado con
[Graphify](https://github.com/Graphify-Labs/graphify) en `graphify-out/`:

- `graph.html` → abrir en el browser: visual interactivo del código
- `GRAPH_REPORT.md` → resumen: hubs, comunidades, conexiones
- `graph.json` → grafo completo consultable

```bash
pip install graphifyy                       # instalar CLI (Python 3.10+)
graphify query "cómo se genera un estudio?" # preguntar al grafo
graphify path "App" "generateTheologicalStudy"
graphify explain "App"
graphify update . && graphify cluster-only .  # regenerar tras cambios
```

Ver `AGENTS.md` para la guía de uso con asistentes de IA.

## Estructura del proyecto

```
api/
  _shared.ts        ← prompt teológico + helpers compartidos
  health.ts         ← GET /api/health
  study.ts          ← POST /api/study (JSON)
  study-stream.ts   ← POST /api/study/stream (SSE)
src/                ← Frontend React (sin cambios)
vercel.json         ← Configuración de rutas y funciones
```
