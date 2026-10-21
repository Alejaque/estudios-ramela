import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestFreeStudy } from './_shared.js';
export const maxDuration = 60;
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!req.body?.passageOrTopic && !req.body?.userPrompt) return res.status(400).json({ error: 'Debes proporcionar un pasaje bíblico, tema o consulta.' });
  try { return res.json(await requestFreeStudy(req.body)); }
  catch (error: any) { return res.status(503).json({ error: error.message }); }
}
