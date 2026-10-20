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

export const CONTINUOUS_EXPOSITION_PROMPT = THEOLOGICAL_SYSTEM_PROMPT.slice(0, THEOLOGICAL_SYSTEM_PROMPT.indexOf('### 2.')) + `### 2. 📝 Bosquejo Expositivo (Exposición continua)
- **Título:** frase corta centrada en Cristo o en la verdad central del texto.
- **Ubicación en el libro:** qué precede al pasaje y cómo encaja en el argumento del autor.
- **Introducción:** una necesidad humana o cultural actual que el texto responde; no inventes anécdotas reales.
- **Proposición (La Gran Idea):** una frase derivada del pasaje.
- **Oración de Transición y Vista Previa:** inmediatamente después de la Proposición, anuncia tres puntos con sus títulos reales: 1. **Punto I:** [título]; 2. **Punto II:** [título]; 3. **Punto III:** [título].
- **Diagrama del texto:** esquema jerárquico con listas anidadas que muestre las unidades del pasaje, sus versículos y su relación con la gran idea. No presentes un diagrama sintáctico griego sin haberlo verificado.
- **Desarrollo de Puntos Principales:** sigue el orden de los versículos. Cada Punto I, II y III debe ser una afirmación del texto, no una etiqueta. En cada punto explica los versículos que lo sustentan en orden, una observación textual relevante, uno o dos pasajes paralelos pertinentes y un contraste con la cultura actual. Distingue lo que el texto dice de una inferencia o ilustración.
- **Cristo en el pasaje:** relación con Cristo y el evangelio respetando el género y contexto, sin alegorizar detalles.
- **Reflexión Teológica:** qué revela el pasaje sobre Dios y el ser humano.
- **Conclusión:** una línea de resumen por punto y una referencia de cierre pertinente.

### 3. 🌱 Aplicación Práctica Cotidiana
Tres viñetas: mente (verdad que creer), corazón (incredulidad, temor o deseos que examinar) y conducta (respuesta concreta). Evita moralismos y no conviertas detalles narrativos en promesas universales.

### 4. 🎯 Llamado a la Acción (CTA)
Una invitación pastoral clara a responder a la verdad del pasaje y una oración breve de cierre.

Reglas adicionales:
- Exposición continua siguiendo el orden del texto, sin copiar mensajes de ningún predicador ni atribuirle este estudio.
- No inventes datos históricos, etimologías ni números Strong. Marca como posible una interpretación incierta y omite información que no puedas sostener.
- Mantén rigor histórico-gramatical, tono pastoral accesible y la versión bíblica solicitada.
- En consultas de seguimiento conserva el método y responde a la pregunta concreta.
`;

export const MODEL_CANDIDATES = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
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

// One budget covers all free-model attempts, including response-body reads.
export async function requestFreeStudy(body: any, budgetMs = 45000) {
  const started = Date.now();
  const messages = buildMessages(body);
  let lastError = 'No se pudo obtener una respuesta de los modelos gratuitos.';
  if (!process.env.OPENROUTER_API_KEY) throw new Error('Proveedor gratuito no configurado.');
  for (const model of MODEL_CANDIDATES) {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining <= 0) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(15000, remaining));
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST', headers: getHeaders(), signal: controller.signal,
        body: JSON.stringify({ model, messages, stream: false, temperature: 0.6, max_tokens: 4096 }),
      });
      if (!response.ok) {
        lastError = `Proveedor gratuito no disponible (${response.status}).`;
        if ([401, 402, 403].includes(response.status)) break;
        continue;
      }
      const data = await response.json();
      const choice = data.choices?.[0];
      const text = choice?.message?.content;
      if (choice?.finish_reason === 'length') throw new Error('El estudio superó el límite de salida y quedó incompleto.');
      if (typeof text === 'string' && text.trim()) {
        return { text, model: data.model || model, durationMs: Date.now() - started };
      }
      lastError = 'El proveedor devolvió una respuesta vacía.';
    } catch (error: any) {
      if (error?.message?.includes('incompleto')) throw error;
      lastError = controller.signal.aborted ? 'El proveedor gratuito no respondió dentro del tiempo disponible.' : 'No se pudo contactar al proveedor gratuito.';
    } finally { clearTimeout(timer); }
  }
  throw new Error(lastError);
}
