import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    provider: 'OpenRouter',
    hasApiKey: Boolean(process.env.OPENROUTER_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
