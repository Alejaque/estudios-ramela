import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HENRY_JUAN6 } from './henryJuan6.js';

export const maxDuration = 60;

// Asistente "Consultar sobre este pasaje" (Estudio personal) con RECUPERACIÓN REAL:
// el servidor busca fragmentos de una fuente autorizada (dominio público verificado)
// y el modelo responde ÚNICAMENTE con ese contexto recuperado. Las citas las adjunta
// el servidor desde los metadatos de la fuente; el modelo no genera URLs ni lista
// de fuentes propia. Sin fuente recuperada para el pasaje, no se consulta al modelo:
// se reconoce el límite en vez de improvisar.
// Clave en GEMINI_API_KEY (entorno del servidor, nunca en el cliente).
// Alcance del prototipo: recuperación verificada para Juan 6 (Henry, dominio público). Sin fuente recuperada, responde sin inventar.

const SYSTEM_PROMPT = `Sos una herramienta de consulta para el estudio bíblico personal de un pastor que prepara sus propios sermones expositivos. Recibís FRAGMENTOS RECUPERADOS de una fuente real (comentario de dominio público) y una pregunta sobre un pasaje. Reglas estrictas:
- Respondé en español claro y breve (máximo unas 300 palabras), con tono respetuoso.
- Usá ÚNICAMENTE el contenido de los fragmentos recuperados y el texto bíblico (Reina-Valera 1960). Nada de conocimiento externo ni de otras obras.
- Distinguí explícitamente: "**La fuente dice:**" (contenido del fragmento, traducido del inglés; marcá así: "(fuente en inglés, traducción automática)") y "**Explicación:**" (tu síntesis acotada a esos contenidos).
- Si los fragmentos no cubren la pregunta, decilo: "La fuente recuperada no cubre esa pregunta" y no respondas con otra cosa.
- Prohibido inventar o generar: citas, URLs, nombres de obras, vocablos griegos o hebreos, números de Strong, etimologías, datos históricos, ni la lista de fuentes (la aplicación adjunta las fuentes verificadas por separado).
- Las citas bíblicas textuales son breves y en Reina-Valera 1960.
- No escribas el sermón por él; no des consejo pastoral sobre personas ni situaciones privadas.`;

// Tope de cortesía por instancia de servidor. Es memoria efímera (no durable);
// el tope durable real lo impone la cuota del nivel gratuito del proyecto en
// Google AI Studio (verificada en https://aistudio.google.com/rate-limit).
let hitsToday = 0;
let dayStamp = '';
const DAILY_SOFT_CAP = 30;

const SIN_FUENTE =
  'Todavía no tengo una fuente verificada recuperada para ese pasaje, así que no puedo responder con respaldo comprobable. ' +
  'Por ahora la consulta con fuente verificada cubre Juan 6:1-27 (Comentario de Matthew Henry, dominio público). ' +
  'Para otros pasajes, usá las herramientas de estudio enlazadas arriba.';

function esJuan6(passage: string): boolean {
  return /\bj(?:ua?)?n?\.?\s*6\b/i.test(passage) || /john\s*6/i.test(passage) || /juan\s*6/i.test(passage);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { passage, question } = req.body || {};
  if (!passage || typeof passage !== 'string' || passage.length > 120) {
    return res.status(400).json({ error: 'Falta la referencia del pasaje.' });
  }
  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    return res.status(400).json({ error: 'Escribí una pregunta.' });
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: 'La pregunta es demasiado larga (máximo 1000 caracteres).' });
  }

  // Recuperación server-side: sin fragmentos recuperados, no hay consulta al modelo.
  if (!esJuan6(passage)) {
    return res.json({ answer: SIN_FUENTE, sources: [], retrieved: false });
  }
  const fragmentos = HENRY_JUAN6.fragmentos;

  const today = new Date().toISOString().slice(0, 10);
  if (dayStamp !== today) {
    dayStamp = today;
    hitsToday = 0;
  }
  if (hitsToday >= DAILY_SOFT_CAP) {
    return res.status(429).json({ error: 'Límite diario de consultas alcanzado. Probá mañana.' });
  }
  hitsToday += 1;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'El asistente no está configurado todavía.' });

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contexto = fragmentos
    .map((f) => `### Fragmento ${f.id} (${f.ref} — ${f.titulo_en})\n${f.texto}`)
    .join('\n\n');
  const userContent = `Pasaje del usuario: ${passage}\nPregunta: ${question.trim()}\n\nFRAGMENTOS RECUPERADOS de "${HENRY_JUAN6.fuente.obra}" de ${HENRY_JUAN6.fuente.autor} (${HENRY_JUAN6.fuente.licencia}):\n\n${contexto}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      }),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 429) {
        return res
          .status(429)
          .json({ error: 'Límite del día alcanzado en el servicio gratuito. Probá mañana.' });
      }
      return res
        .status(502)
        .json({ error: `El servicio de consulta respondió con error (${r.status}).` });
    }
    let answer = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text || '')
      .join('')
      .trim();
    if (!answer) return res.status(502).json({ error: 'No se obtuvo respuesta. Probá de nuevo.' });

    // El modelo no puede aportar URLs: se elimina cualquier enlace que haya generado.
    // Las únicas URLs válidas son las de la fuente recuperada, adjuntadas por el servidor.
    answer = answer.replace(/https?:\/\/\S+/g, '(enlace omitido: las fuentes verificadas figuran abajo)');

    const sources = [
      {
        id: fragmentos.map((f) => f.id).join(', '),
        ref: HENRY_JUAN6.cobertura,
        obra: HENRY_JUAN6.fuente.obra,
        autor: HENRY_JUAN6.fuente.autor,
        licencia: HENRY_JUAN6.fuente.licencia,
        url: HENRY_JUAN6.fuente.url,
      },
    ];
    return res.json({ answer, sources, retrieved: true });
  } catch {
    return res.status(503).json({ error: 'No se pudo conectar con el servicio de consulta.' });
  }
}
