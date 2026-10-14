import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMessages, getHeaders, MODEL_CANDIDATES, OPENROUTER_API_URL, isRetryable, errorMsg, sleep } from './_shared.js';
import { generateTheologicalStudy } from '../src/utils/theologicalEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { passageOrTopic, userPrompt, translationPreference } = req.body;
  if (!passageOrTopic && !userPrompt) {
    return res.status(400).json({ error: 'Debes proporcionar un pasaje bíblico, tema o consulta.' });
  }

  // If OPENROUTER_API_KEY is not configured, gracefully fallback to the theological engine
  if (!process.env.OPENROUTER_API_KEY) {
    const study = generateTheologicalStudy(passageOrTopic || userPrompt || 'Efesios 2:8-10', translationPreference);
    return res.json({ text: study });
  }

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
    // Graceful fallback to the theological engine if AI endpoint is exhausted or down
    const fallbackStudy = generateTheologicalStudy(passageOrTopic || userPrompt || 'Efesios 2:8-10', translationPreference);
    return res.json({ text: fallbackStudy });
  }

  return res.json({ text: generatedText });
}
