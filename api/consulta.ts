import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HENRY_JUAN6 } from './henryJuan6.js';

export const maxDuration = 60;

// Asistente "Consultar sobre este pasaje" (Estudio personal) con RECUPERACIÓN REAL:
// el servidor busca fragmentos de una fuente autorizada (dominio público verificado)
// y el modelo responde ÚNICAMENTE con ese contexto recuperado.
// Fuente comprobable = cada afirmación atribuida a la fuente trae el ID del fragmento
// y una CITA LITERAL breve copiada del fragmento; el SERVIDOR valida que la cita sea
// un substring exacto del fragmento con ese ID y rechaza lo que no coincide.
// La síntesis del asistente va separada y etiquetada (no se garantiza la interpretación).
// El modelo no genera URLs ni lista de fuentes: las adjunta el servidor.
// Sin fuente recuperada para el pasaje, no se consulta al modelo: se reconoce el límite.
// Clave en GEMINI_API_KEY (entorno del servidor, nunca en el cliente).
// Alcance del prototipo: extractos de Juan 6 (Henry, dominio público), cobertura limitada.

const SYSTEM_PROMPT = `Sos una herramienta de consulta para el estudio bíblico personal de un pastor que prepara sus propios sermones expositivos. Recibís FRAGMENTOS RECUPERADOS de una fuente real (comentario de dominio público, en inglés) y una pregunta en español sobre un pasaje.

Respondé SOLO con un JSON válido, sin markdown ni texto fuera del JSON, con esta forma exacta:
{
  "seccion_fuente": [
    { "afirmacion": "...", "fuente_id": "henry-jn6-1-14", "cita_literal": "..." }
  ],
  "sintesis": "..."
}

Reglas estrictas:
- "seccion_fuente": lista corta (1 a 5) de afirmaciones en español que salen DIRECTAMENTE de un fragmento. Cada una con:
  - "afirmacion": una afirmación breve y concreta en español (traducción fiel del sentido del fragmento).
  - "fuente_id": el ID EXACTO del fragmento de donde sale (uno de los IDs dados).
  - "cita_literal": una cita breve (6 a 25 palabras) COPIADA TEXTUALMENTE del fragmento, en inglés, sin cambiar ni una palabra. Sirve como comprobante: si no podés copiarla textual, NO incluyas la afirmación.
- "sintesis": tu explicación breve (máximo 150 palabras, en español) acotada a esos contenidos. Acá podés parafrasear; va separada porque no es cita literal.
- Si los fragmentos no cubren la pregunta, respondé: {"seccion_fuente": [], "sintesis": "La fuente recuperada no cubre esa pregunta."} y nada más.
- Prohibido: conocimiento externo u otras obras; inventar citas, IDs, URLs, nombres de obras, vocablos griegos o hebreos, números de Strong, etimologías, datos históricos. Prohibido escribir URLs.
- Las citas bíblicas textuales (si hacen falta) son breves y en Reina-Valera 1960.
- No escribas el sermón por él; no des consejo pastoral sobre personas ni situaciones privadas.`;

// Tope de cortesía por instancia de servidor. Es memoria efímera (no durable);
// el tope durable real lo impone la cuota del nivel gratuito del proyecto en
// Google AI Studio (verificada en https://aistudio.google.com/rate-limit).
let hitsToday = 0;
let dayStamp = '';
const DAILY_SOFT_CAP = 30;

const SIN_FUENTE =
  'Todavía no tengo una fuente verificada recuperada para ese pasaje, así que no puedo responder con respaldo comprobable. ' +
  'Por ahora la consulta con fuente verificada tiene extractos de Juan 6 (Comentario de Matthew Henry, dominio público), con cobertura limitada: Juan 6:1-27 y 6:28-29 parcial. ' +
  'Para otros pasajes, usá las herramientas de estudio enlazadas arriba.';

function esJuan6(passage: string): boolean {
  return /\bj(?:ua?)?n?\.?\s*6\b/i.test(passage) || /john\s*6/i.test(passage) || /juan\s*6/i.test(passage);
}

function normalizar(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

interface Cita {
  afirmacion: string;
  fuente_id: string;
  cita_literal: string;
}

// Valida la procedencia de la cita, no que la afirmación esté implicada por ella.
// El ID debe existir entre los fragmentos recuperados
// y la cita literal debe ser un substring exacto de ESE fragmento.
function validarCitas(items: any[], fragmentos: typeof HENRY_JUAN6.fragmentos) {
  const validas: Cita[] = [];
  let rechazadas = 0;
  for (const it of items || []) {
    if (!it || typeof it !== 'object') {
      rechazadas += 1;
      continue;
    }
    const frag = fragmentos.find((f) => f.id === it.fuente_id);
    const afirmacion = typeof it.afirmacion === 'string' ? it.afirmacion.trim() : '';
    const cita = typeof it.cita_literal === 'string' ? normalizar(it.cita_literal) : '';
    if (
      frag &&
      afirmacion.length >= 8 &&
      cita.length >= 20 &&
      normalizar(frag.texto).includes(cita)
    ) {
      validas.push({ afirmacion, fuente_id: frag.id, cita_literal: cita });
    } else {
      rechazadas += 1;
    }
  }
  return { validas, rechazadas };
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
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
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
    const raw = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text || '')
      .join('')
      .trim();
    if (!raw) return res.status(502).json({ error: 'No se obtuvo respuesta. Probá de nuevo.' });

    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, '').trim());
    } catch {
      return res
        .status(502)
        .json({ error: 'La respuesta del modelo no respetó el formato comprobable. Probá de nuevo.' });
    }

    // Validación server-side: ID + cita literal exacta (substring del fragmento).
    const { validas, rechazadas } = validarCitas(parsed?.seccion_fuente, fragmentos);
    const sintesis = typeof parsed?.sintesis === 'string' ? parsed.sintesis.trim() : '';

    // Si no queda nada verificable, se reconoce el límite en vez de improvisar.
    if (validas.length === 0) {
      const answer =
        sintesis === 'La fuente recuperada no cubre esa pregunta.'
          ? sintesis
          : 'No pude verificar ninguna afirmación contra los fragmentos recuperados, así que prefiero no responder. Probá reformular la pregunta.';
      return res.json({ answer, sources: [], retrieved: true, rejected: rechazadas });
    }

    const partes: string[] = [];
    if (validas.length > 0) {
      partes.push('**Según el comentario recuperado** (fuente en inglés, traducción automática):');
      for (const v of validas) {
        partes.push(`- ${v.afirmacion}\n  Comprobante [${v.fuente_id}]: "${v.cita_literal}"`);
      }
    }
    if (sintesis && sintesis !== 'La fuente recuperada no cubre esa pregunta.') {
      // El modelo no puede aportar URLs: se elimina cualquier enlace que haya generado.
      const limpia = sintesis.replace(
        /https?:\/\/\S+/g,
        '(enlace omitido: las fuentes verificadas figuran abajo)'
      );
      partes.push(
        `**Síntesis del asistente** (parafraseada; NO está garantizada: comprobala contra los comprobantes y el fragmento):\n${limpia}`
      );
    }
    let answer = partes.join('\n\n');
    if (rechazadas > 0) {
      answer += `\n\n_Aviso: se descartaron ${rechazadas} afirmación(es) cuya cita no coincidía textualmente con el fragmento recuperado._`;
    }

    const sources = [
      {
        id: fragmentos.map((f) => f.id).join(', '),
        ref: HENRY_JUAN6.cobertura,
        obra: HENRY_JUAN6.fuente.obra,
        autor: HENRY_JUAN6.fuente.autor,
        licencia: HENRY_JUAN6.fuente.licencia,
        url: HENRY_JUAN6.fuente.url,
        fragmentos: fragmentos.map((f) => ({
          id: f.id,
          ref: f.ref,
          titulo_en: f.titulo_en,
          texto: f.texto,
        })),
      },
    ];
    return res.json({ answer, sources, retrieved: true, rejected: rechazadas });
  } catch {
    return res.status(503).json({ error: 'No se pudo conectar con el servicio de consulta.' });
  }
}
