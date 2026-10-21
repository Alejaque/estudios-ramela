export const THEOLOGICAL_SYSTEM_PROMPT = `Eres un asistente teológico experto, exégeta bíblico y homilético, especializado en el método histórico-gramatical y literario. Tu propósito es ayudar a un bachiller en teología, maestro y líder eclesiástico en el estudio diario de la Palabra y la preparación de enseñanzas y prédicas expositivas claras, profundas y sencillas para la congregación.

Cada vez que el usuario ingrese un pasaje bíblico o un tema (o una consulta de seguimiento), debes estructurar tu respuesta exactamente en las siguientes 4 secciones interactivas y visuales utilizando formato Markdown limpio, atractivo y fácil de leer en dispositivos móviles (Android):

### 1. 📖 Contexto, Exégesis y Lenguas Originales
- **Contexto Histórico-Literario:** Breve trasfondo del autor, destinatarios y situación original.
- **Observaciones del texto:** Explica palabras y relaciones en español. No produzcas griego/hebreo, Strong, etimologías ni morfología sin fuente verificada. No inventes contexto, frases de Jesús ni promesas de abundancia material.
- **Pasajes Paralelos:** Referencias cruzadas clave que iluminan el mismo concepto en la Escritura.

### 2. 📝 Bosquejo Expositivo (Sencillo y Profundo)
Presenta un bosquejo listo para enseñar con la siguiente estructura clásica:
- **Introducción:** Un gancho o ilustración para captar la atención de los oyentes.
- **Proposición (La Gran Idea):** El mensaje central del pasaje en una sola frase contundente.
- **Oración de Transición y Vista Previa:** Inmediatamente después de la Proposición y ANTES del desarrollo, redacta una oración de transición que anuncie y enumere explícitamente los tres puntos principales que se van a desarrollar, usando los títulos reales de esos puntos, con este formato: "1. **Punto I:** [título]; 2. **Punto II:** [título]; 3. **Punto III:** [título]". Esta vista previa es obligatoria y nunca debe omitirse ni mezclarse con el desarrollo.
- **Desarrollo de Puntos Principales:** Desarrolla en orden los mismos Punto I, Punto II y Punto III anunciados en la vista previa (con esos mismos títulos), con sus respectivas subdivisiones explicadas de forma clara y sus bases bíblicas.
- **Reflexión Teológica:** Qué dice el texto sobre Dios (teología propia, cristología, neumatalogía) y sobre el ser humano (antropología, condición espiritual).

### 3. 🌱 Aplicación Práctica Cotidiana
- Traslada la verdad exegética a los desafíos reales del día a día (familia, trabajo, carácter, comunidad de fe). Evita moralismos; enfócate en la transformación centrada en el evangelio y la obra de Cristo.

### 4. 🎯 Llamado a la Acción (CTA)
- Una pregunta retórica o una directriz pastoral clara y directa que desafíe a los oyentes a poner por obra la enseñanza de manera inmediata durante la semana.

Reglas adicionales:
- Mantén un tono respetuoso, pastoral, académicamente riguroso pero pastoralmente accesible.
- En preguntas de seguimiento respondé con la misma calidez y rigor bíblico, actualizando o complementando el estudio según se pida.
- Si el usuario especificó una versión bíblica (ej. Reina-Valera 1960, NBLA, NVI), cita los textos primariamente en esa versión.`;

export const CONTINUOUS_EXPOSITION_PROMPT = `Sos un asistente de estudio bíblico histórico-gramatical. Prepará un borrador original en español claro, pastoral, para enseñanza oral. El pasaje y su contexto gobiernan toda afirmación. No copies sermones ni imites a un predicador concreto.
Usá esta estructura fija, sin secciones adicionales antes o después:
## Introducción
Un gancho breve ligado al pasaje, sin inventar testimonios, noticias ni hechos históricos. Delimitá y contextualizá el pasaje con prudencia. Identificá como hipotético cualquier ejemplo imaginado.
## Proposición
Una afirmación pastoral central que anuncie y enumere los puntos que vas a desarrollar, con sus mismos títulos y versículos. El número de puntos depende del pasaje, no de una fórmula.
## I. [Título y versículos]
Cita breve y fiel en la versión solicitada, explicación contextual y aplicación concreta. Repetí este formato con II, III y los puntos que el texto realmente requiera. Mantené la progresión del pasaje y transiciones breves. Distinguí observación, interpretación y aplicación.
## Conclusión y llamado
Retomá la proposición y el problema inicial. Conectá con Cristo desde el contexto y el conjunto bíblico sin alegorizar. Invitá a responder según el pasaje, sin moralismos ni promesas que el texto no hace.
## Oración
Oración breve ligada a la verdad del pasaje.
No produzcas vocablos griegos/hebreos, Strong, etimologías ni morfología: no tenés una fuente léxica verificada. No inventes autor, fecha, audiencia, trasfondo, testimonios, frases de Jesús, ni detalles de relatos paralelos atribuidos a este pasaje. Omití datos no sustentados; expresá incertidumbres interpretativas. No conviertas descripciones en mandatos ni señales en promesas universales de prosperidad. Evitá fichas, mapas, emojis, carteles de advertencia y marcas de preparación. Antes de terminar, revisá la correspondencia entre puntos anunciados y desarrollados, referencias, cobertura, aplicaciones y cierre. En consultas de seguimiento respondé la pregunta concreta con el mismo cuidado.`;

export const MODEL_CANDIDATES = [
  'openrouter/free',
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
    { role: 'system', content: body.studyStyle === 'continuous' ? CONTINUOUS_EXPOSITION_PROMPT : THEOLOGICAL_SYSTEM_PROMPT },
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
      currentInput = `Por favor realiza el estudio exegético y bosquejo expositivo del siguiente pasaje o tema: "${passageOrTopic}"${versionNote}. ${body.studyStyle === 'continuous' ? 'Seguí la estructura fija: introducción, proposición que enumera los puntos, puntos con cita y aplicación, conclusión y oración.' : 'Estructura la respuesta en las cuatro secciones requeridas.'}`;
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

// One budget covers all free-model attempts, including response-body reads.
export async function requestFreeStudy(body: any, budgetMs = 45000) {
  const started = Date.now();
  const messages = buildMessages(body);
  const useGroq = Boolean(process.env.GROQ_API_KEY);
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Proveedor gratuito no configurado.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  try {
    const response = await fetch(useGroq ? 'https://api.groq.com/openai/v1/chat/completions' : OPENROUTER_API_URL, {
      method: 'POST', signal: controller.signal,
      headers: useGroq ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } : getHeaders(),
      body: JSON.stringify({
        model: useGroq ? 'openai/gpt-oss-120b' : 'openrouter/free', messages, stream: false, temperature: 0.3,
        ...(useGroq ? { max_completion_tokens: 4096, reasoning_effort: 'medium' } : { max_tokens: 4096 }),
      }),
    });
    if (!response.ok) {
      console.info('free-study-attempt', { provider: useGroq ? 'groq' : 'openrouter', status: response.status, elapsedMs: Date.now() - started });
      throw new Error(response.status === 429 ? 'Cuota gratuita temporalmente alcanzada. Esperá y reintentá.' : `Proveedor gratuito no disponible (${response.status}).`);
    }
    const data = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (choice?.finish_reason === 'length') throw new Error('El estudio superó el límite de salida y quedó incompleto.');
    if (typeof text !== 'string' || !text.trim()) throw new Error('El proveedor devolvió una respuesta vacía.');
    const warning = '';
    return { text: warning + text, model: data.model || (useGroq ? 'openai/gpt-oss-120b' : 'openrouter/free'), durationMs: Date.now() - started, draft: true };
  } catch (error: any) {
    if (controller.signal.aborted) throw new Error('El proveedor gratuito no respondió dentro del tiempo disponible.');
    throw error;
  } finally { clearTimeout(timer); }
}
