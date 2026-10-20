import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMessages, getHeaders, MODEL_CANDIDATES, OPENROUTER_API_URL, isRetryable, sleep } from './_shared.js';
import { generateTheologicalStudy } from '../src/utils/theologicalEngine.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { passageOrTopic, userPrompt, translationPreference } = req.body;
  if (!passageOrTopic && !userPrompt) {
    return res.status(400).json({ error: 'Debes proporcionar un pasaje bíblico, tema o consulta.' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const send = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  const localFallback = () => {
    send({ text: generateTheologicalStudy(passageOrTopic || userPrompt || 'Efesios 2:8-10', translationPreference) });
    send({ done: true });
    res.end();
  };
  if (!process.env.OPENROUTER_API_KEY) return localFallback();

  // Bound provider waits; leave time to send an honest error before Vercel stops the function.
  const deadline = Date.now() + 50000;
  const chatMessages = buildMessages(req.body);
  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let sentText = false;
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        send({ error: 'El servicio de IA está demorando demasiado. No se completó el estudio. Intentá nuevamente en unos minutos.' });
        return res.end();
      }
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST', headers: getHeaders(), signal: AbortSignal.timeout(remainingMs),
          body: JSON.stringify({ model, messages: chatMessages, stream: true, temperature: 0.6, max_tokens: 4096 }),
        });
        if (!response.ok) {
          await response.body?.cancel();
          if (!isRetryable(response.status) || attempt === 1) break;
          await sleep(1000);
          continue;
        }
        if (!response.body) throw new Error('Respuesta sin cuerpo');
        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completed = false;
        const consumeLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) return;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') { completed = true; return; }
          if (!payload) return;
          const event = JSON.parse(payload);
          if (event.error) throw new Error('Error del proveedor durante la transmisión');
          const choice = event.choices?.[0];
          const text = choice?.delta?.content;
          if (text) { send({ text }); sentText = true; }
          if (choice?.finish_reason === 'length') throw new Error('Salida incompleta');
          if (choice?.finish_reason === 'stop') completed = true;
        };
        while (true) {
          const chunk = await reader.read();
          buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) consumeLine(line);
          if (chunk.done) { if (buffer.trim()) consumeLine(buffer); break; }
        }
        if (!completed || !sentText) throw new Error('Transmisión incompleta');
        send({ done: true });
        return res.end();
      } catch {
        if (Date.now() >= deadline && !sentText) {
          send({ error: 'El servicio de IA está demorando demasiado. No se completó el estudio. Intentá nuevamente en unos minutos.' });
          return res.end();
        }
        if (sentText) {
          // Never append another model's answer to a partial study or pay for a silent restart.
          send({ error: 'La conexión se interrumpió antes de completar el estudio. El texto visible está incompleto; tocá Reintentar para generar el estudio completo.' });
          return res.end();
        }
        if (attempt === 0) { await sleep(1000); continue; }
        break;
      } finally {
        await reader?.cancel().catch(() => {});
      }
    }
  }
  return localFallback();
}
