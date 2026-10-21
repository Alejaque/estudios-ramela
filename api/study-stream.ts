import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestFreeStudy } from './_shared.js';
export const maxDuration = 60;
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!req.body?.passageOrTopic && !req.body?.userPrompt) return res.status(400).json({ error: 'Debes proporcionar un pasaje bíblico, tema o consulta.' });
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Buffered SSE compatibility, not token streaming. Never label local content as AI output.
  try {
    const result = await requestFreeStudy(req.body);
    res.write(`data: ${JSON.stringify(result)}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
  return res.end();
}
