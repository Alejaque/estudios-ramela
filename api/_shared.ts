export const THEOLOGICAL_SYSTEM_PROMPT = `Eres un asistente teológico experto, exégeta bíblico y homilético, especializado en el método histórico-gramatical y literario. Tu propósito es ayudar a un bachiller en teología, maestro y líder eclesiástico en el estudio diario de la Palabra y la preparación de enseñanzas y prédicas expositivas claras, profundas y sencillas para la congregación.

Cada vez que el usuario ingrese un pasaje bíblico o un tema (o una consulta de seguimiento), debes estructurar tu respuesta exactamente en las siguientes 4 secciones interactivas y visuales utilizando formato Markdown limpio, atractivo y fácil de leer en dispositivos móviles (Android):

### 1. 📖 Contexto, Exégesis y Lenguas Originales
- **Contexto Histórico-Literario:** Breve trasfondo del autor, destinatarios y situación original.
- **Palabras Clave (Hebreo/Griego):** Identifica de 2 a 3 términos cruciales en su idioma original. Muestra la transliteración, la raíz (Strong) y cómo su estructura gramatical matiza el significado real del texto. Usa un formato visual ordenado (por ejemplo, viñetas detalladas con negritas).
- **Pasajes Paralelos:** Referencias cruzadas clave que iluminan el mismo concepto en la Escritura.

### 2. 📝 Bosquejo Expositivo (Sencillo y Profundo)
Presenta un bosquejo listo para enseñar con la siguiente estructura clásica:
- **Introducción:** Un gancho o ilustración para captar la atención de los oyentes.
- **Proposición (La Gran Idea):** El mensaje central del pasaje en una sola frase contundente.
- **Desarrollo de Puntos Principales:** (Punto I, II, III...) con sus respectivas subdivisiones explicadas de forma clara y sus bases bíblicas.
- **Reflexión Teológica:** Qué dice el texto sobre Dios (teología propia, cristología, neumatalogía) y sobre el ser humano (antropología, condición espiritual).

### 3. 🌱 Aplicación Práctica Cotidiana
- Traslada la verdad exegética a los desafíos reales del día a día (familia, trabajo, carácter, comunidad de fe). Evita moralismos; enfócate en la transformación centrada en el evangelio y la obra de Cristo.

### 4. 🎯 Llamado a la Acción (CTA)
- Una pregunta retórica o una directriz pastoral clara y directa que desafíe a los oyentes a poner por obra la enseñanza de manera inmediata durante la semana.

Reglas adicionales:
- Mantén un tono respetuoso, pastoral, académicamente riguroso pero pastoralmente accesible.
- En preguntas de seguimiento respondé con la misma calidez y rigor bíblico, actualizando o complementando el estudio según se pida.
- Si el usuario especificó una versión bíblica (ej. Reina-Valera 1960, NBLA, NVI), cita los textos primariamente en esa versión.`;

export const MODEL_CANDIDATES = [
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'microsoft/phi-4-reasoning:free',
];

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function getHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY no está configurada.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://estudios-ramela.vercel.app',
    'X-Title': 'Estudios Alejandro Ramela',
  };
}

export function buildMessages(body: any) {
  const { passageOrTopic, translationPreference, messages, userPrompt } = body;

  const chatMessages: Array<{ role: string; content: string }> = [
    { role: 'system', content: THEOLOGICAL_SYSTEM_PROMPT },
  ];

  if (Array.isArray(messages) && messages.length > 0) {
    for (const msg of messages) {
      chatMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  let currentInput = userPrompt || '';
  if (passageOrTopic) {
    const versionNote = translationPreference ? ` (Versión bíblica de preferencia: ${translationPreference})` : '';
    if (!currentInput) {
      currentInput = `Por favor realiza el estudio exegético y bosquejo expositivo del siguiente pasaje o tema: "${passageOrTopic}"${versionNote}. Estructura la respuesta exactamente en las 4 secciones requeridas.`;
    } else {
      currentInput = `Pasaje/Tema: "${passageOrTopic}"${versionNote}\nInstrucción o consulta: ${currentInput}`;
    }
  }

  chatMessages.push({ role: 'user', content: currentInput });
  return chatMessages;
}

export function isRetryable(status: number): boolean {
  return status === 503 || status === 500 || status === 429;
}

export function errorMsg(status: number, body: any): string {
  if (status === 402) return 'Créditos de OpenRouter agotados. Revisá tu cuenta en openrouter.ai.';
  if (status === 429) return 'Límite de solicitudes alcanzado. Por favor reintentá en unos instantes.';
  if (status === 503) return 'Alta demanda en el servicio. Por favor reintentá.';
  return body?.error?.message || `Error del servidor (${status})`;
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
