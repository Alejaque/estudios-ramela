import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

// Asistente "Consultar sobre este pasaje" (Estudio personal).
// Solo recibe la referencia del pasaje y la pregunta escrita por el usuario:
// nunca sus apuntes. Clave en GEMINI_API_KEY (entorno del servidor, nunca en el cliente).
const SYSTEM_PROMPT = `Sos una herramienta de consulta para el estudio bíblico personal de un pastor que prepara sus propios sermones expositivos. Respondés preguntas puntuales sobre UN pasaje. Reglas:
- Respondé en español claro y breve (máximo unas 300 palabras), con tono respetuoso.
- Citá solo fuentes reales y verificables, con referencia exacta: obra, capítulo o sección y, si corresponde, URL pública. Fuentes aceptables: el texto bíblico (Reina-Valera 1960), comentarios de dominio público (por ejemplo Matthew Henry), diccionarios bíblicos de dominio público (Easton, ISBE) y atlas bíblicos.
- Si no podés comprobar un dato con una fuente real, decí expresamente "no puedo comprobarlo" en lugar de afirmarlo. Nunca inventes citas, vocablos griegos o hebreos, números de Strong, etimologías ni datos históricos.
- Si traducís una fuente en inglés, aclaralo: "(fuente en inglés, traducción automática)".
- No escribas el sermón por él: ofrecé datos, contexto y referencias para que él saque sus propias conclusiones. No des consejo pastoral sobre personas ni situaciones privadas.
- Las citas bíblicas textuales son breves y en Reina-Valera 1960.
- Cerrá con la lista de fuentes usadas, una por línea: "- Fuente: <obra>, <ubicación exacta> (<URL si aplica>)". Si no usaste ninguna fuente externa, escribí "- Fuente: ninguna fuente externa; respuesta sin verificación independiente".`;

// Tope de cortesía por instancia de servidor. Es memoria efímera (no durable);
// el tope durable real lo impone la cuota del nivel gratuito del proyecto en
// Google AI Studio (verificada en https://aistudio.google.com/rate-limit).
let hitsToday = 0;
let dayStamp = '';
const DAILY_SOFT_CAP = 30;

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

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Pasaje: ${passage}\nPregunta: ${question.trim()}` }],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
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
    const answer = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text || '')
      .join('')
      .trim();
    if (!answer) return res.status(502).json({ error: 'No se obtuvo respuesta. Probá de nuevo.' });
    return res.json({ answer, model });
  } catch {
    return res.status(503).json({ error: 'No se pudo conectar con el servicio de consulta.' });
  }
}
