import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMessages, getHeaders, MODEL_CANDIDATES, OPENROUTER_API_URL, isRetryable, errorMsg, sleep } from './_shared';

// Vercel serverless timeout máximo en plan free: 10s
// El streaming real no funciona bien en serverless, usamos acumulación y enviamos todo junto como SSE
export const maxDuration = 60; // Pro plan; en free será ignorado pero no rompe

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { passageOrTopic, userPrompt } = req.body;
  if (!passageOrTopic && !userPrompt) {
    return res.status(400).json({ error: 'Debes proporcionar un pasaje bíblico, tema o consulta.' });
  }

  // En serverless, el streaming real es limitado.
  // Llamamos sin stream, acumulamos y enviamos como un único evento SSE.
  // El frontend lo maneja igual porque recibe { text } y luego { done }.
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const chatMessages = buildMessages(req.body);
  let generatedText = '';
  let lastStatus = 500;
  let lastBody: any = {};

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            model,
            messages: chatMessages,
            stream: false,
            temperature: 0.6,
            max_tokens: 4096,
          }),
        });

        lastStatus = response.status;

        if (!response.ok) {
          lastBody = await response.json().catch(() => ({}));
          if (!isRetryable(response.status) || attempt === 1) break;
          await sleep(1000);
          continue;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) { generatedText = text; break; }

      } catch (err: any) {
        if (attempt === 0) { await sleep(1000); continue; }
        break;
      }
    }
    if (generatedText) break;
  }

  if (!generatedText) {
    const msg = errorMsg(lastStatus, lastBody);
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    return res.end();
  }

  // Enviamos el texto completo en un solo evento y luego done
  res.write(`data: ${JSON.stringify({ text: generatedText })}\n\n`);
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  return res.end();
}
