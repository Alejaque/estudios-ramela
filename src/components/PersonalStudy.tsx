import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  Maximize2,
  NotebookPen,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { PulpitModal } from './PulpitModal';
import { exportStudyToPdf } from '../utils/pdfExport';
import { rvr1960Url, stepBibleUrl, blbUrl } from '../utils/bibleRef';
import type { PersonalStudyDoc } from '../types';

const STORAGE_KEY = 'personal_studies';

interface SectionDef {
  key: string;
  label: string;
  hint: string;
}

// Etapa de preparación: el material con el que él trabaja el pasaje.
const PREP_SECTIONS: SectionDef[] = [
  {
    key: 'apuntes',
    label: 'Apuntes del pasaje',
    hint: 'Observación libre: qué dice el texto, repeticiones, conectores, preguntas que te surgen.',
  },
  {
    key: 'contexto',
    label: 'Contexto histórico, gramatical y literario',
    hint: 'Autor, audiencia, ocasión, género literario, estructura y gramática del pasaje.',
  },
  {
    key: 'palabras',
    label: 'Palabras del original',
    hint: 'Palabra en griego o hebreo, su significado y qué aporta a la interpretación. Ej.: metà taûta - "después de estas (cosas)", una transición común en Juan.',
  },
];

// Etapa de elaboración: el bosquejo del sermón, en el orden en que se predica.
const SERMON_SECTIONS: SectionDef[] = [
  { key: 'introduccion', label: 'Introducción', hint: 'El gancho que lleva a la proposición.' },
  {
    key: 'proposicion',
    label: 'Proposición',
    hint: 'La idea central del sermón y los puntos que va a desarrollar.',
  },
  {
    key: 'desarrollo',
    label: 'Desarrollo (puntos principales)',
    hint: 'Cada punto con su explicación y su aplicación.',
  },
  { key: 'conclusion', label: 'Conclusión', hint: 'Cierre que resume y aterriza la idea central.' },
  { key: 'llamado', label: 'Llamado a la acción', hint: 'La respuesta concreta que pide el pasaje.' },
  { key: 'oracion', label: 'Oración', hint: 'La oración final, si querés dejarla escrita.' },
];

const ALL_SECTIONS = [...PREP_SECTIONS, ...SERMON_SECTIONS];

function loadStudies(): PersonalStudyDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s.id === 'string' && typeof s.passageOrTopic === 'string' && s.sections
    );
  } catch {
    return [];
  }
}

function persistStudies(list: PersonalStudyDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Arma el bosquejo en markdown, solo con los apartados que tienen texto.
function assembleSermon(s: PersonalStudyDoc): string {
  const parts: string[] = [];
  if (s.title.trim()) parts.push(`# ${s.title.trim()}`);
  for (const sec of SERMON_SECTIONS) {
    const text = (s.sections[sec.key] || '').trim();
    if (text) parts.push(`## ${sec.label}\n\n${text}`);
  }
  return parts.join('\n\n');
}

export const PersonalStudy: React.FC = () => {
  const [studies, setStudies] = useState<PersonalStudyDoc[]>(loadStudies);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPassage, setNewPassage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [preview, setPreview] = useState(false);
  const [pulpit, setPulpit] = useState(false);
  const [importError, setImportError] = useState('');
  const saveTimer = useRef<number | null>(null);

  const doc = studies.find((s) => s.id === selectedId) || null;
  const sermon = useMemo(() => (doc ? assembleSermon(doc) : ''), [doc]);
  const hasSermon = sermon.replace(/^#[^\n]*$/m, '').trim().length > 0;

  // Autoguardado inmediato en este dispositivo; el indicador se actualiza a los 600 ms.
  function updateDoc(mutate: (s: PersonalStudyDoc) => PersonalStudyDoc) {
    if (!doc) return;
    const updated = mutate({ ...doc, updatedAt: new Date().toISOString() });
    const next = studies.map((s) => (s.id === updated.id ? updated : s));
    setStudies(next);
    persistStudies(next);
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveState('saved'), 600);
  }

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function createStudy(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassage.trim()) return;
    const now = new Date().toISOString();
    const item: PersonalStudyDoc = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      passageOrTopic: newPassage.trim(),
      sections: {},
      createdAt: now,
      updatedAt: now,
    };
    const next = [item, ...studies];
    setStudies(next);
    persistStudies(next);
    setSelectedId(item.id);
    setNewPassage('');
    setNewTitle('');
  }

  function removeStudy(id: string) {
    const target = studies.find((s) => s.id === id);
    if (!target) return;
    if (!window.confirm(`¿Borrar el estudio personal de "${target.passageOrTopic}"? Esta acción no se puede deshacer.`)) return;
    const next = studies.filter((s) => s.id !== id);
    setStudies(next);
    persistStudies(next);
    if (selectedId === id) setSelectedId(null);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(studies, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis-estudios-personales.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : [data];
      const valid = list.every(
        (s) =>
          s &&
          typeof s.id === 'string' &&
          typeof s.passageOrTopic === 'string' &&
          s.sections &&
          typeof s.sections === 'object'
      );
      if (!valid) throw Error();
      const incoming = list as PersonalStudyDoc[];
      const next = [...incoming, ...studies.filter((s) => !incoming.some((i) => i.id === s.id))];
      setStudies(next);
      persistStudies(next);
      setImportError('');
    } catch {
      setImportError('No se pudo abrir el archivo. Usá la copia JSON exportada desde esta sección.');
    }
  }

  const rvrUrl = doc ? rvr1960Url(doc.passageOrTopic) : null;
  const stepUrl = doc ? stepBibleUrl(doc.passageOrTopic) : null;
  const blbLink = doc ? blbUrl(doc.passageOrTopic) : null;

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-7 items-start">
      <aside className="lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl flex gap-2 items-center mb-4">
          <NotebookPen size={22} /> Mi estudio
        </h2>
        <p className="text-sm opacity-75 mb-4">
          Tu espacio para estudiar el pasaje a solas con la Biblia, tomar apuntes y elaborar tu
          propio sermón. Tus apuntes se guardan en este dispositivo; la primera carga de la página necesita Internet.
        </p>
        <form onSubmit={createStudy} className="mb-5 space-y-3">
          <label className="block font-semibold" htmlFor="ps-passage">
            Nuevo estudio personal
          </label>
          <input
            id="ps-passage"
            value={newPassage}
            onChange={(e) => setNewPassage(e.target.value)}
            placeholder="Pasaje (ej.: Juan 6:1-15)"
            className="library-control w-full bg-transparent"
            required
          />
          <input
            aria-label="Título del estudio (opcional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="library-control w-full bg-transparent"
          />
          <button className="library-control w-full">
            <Plus size={18} /> Crear estudio
          </button>
        </form>
        <div className="space-y-3">
          {studies.map((s) => (
            <div
              key={s.id}
              className={
                'rounded-2xl p-4 border ' +
                (selectedId === s.id
                  ? 'border-[#315b46] bg-[#e3ebe0] dark:bg-[#263b2d]'
                  : 'border-[#cbd4c9]')
              }
            >
              <button onClick={() => { setSelectedId(s.id); setPreview(false); }} className="text-left w-full">
                <span className="text-xs font-bold tracking-wide">{s.passageOrTopic}</span>
                <span className="block font-serif text-xl mt-2 leading-tight">
                  {s.title || 'Sin título'}
                </span>
                <span className="block text-sm mt-3 opacity-70">
                  Abrir estudio <ChevronRight className="inline" size={14} />
                </span>
              </button>
              <button
                onClick={() => removeStudy(s.id)}
                className="mt-2 text-sm underline opacity-70 flex items-center gap-1 py-2"
                aria-label={`Borrar estudio de ${s.passageOrTopic}`}
              >
                <Trash2 size={14} /> Borrar
              </button>
            </div>
          ))}
          {!studies.length && (
            <p className="py-4">Todavía no tenés estudios personales. Creá el primero acá arriba.</p>
          )}
        </div>
        {studies.length > 0 && (
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer py-3">Copia de respaldo</summary>
            <p className="mb-3 opacity-75">
              Tus apuntes viven en este dispositivo. Exportá una copia para guardarlos o pasarlos a
              la tablet.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={exportBackup} className="library-control text-sm">
                <Download size={16} /> Exportar copia (JSON)
              </button>
              <label className="library-control text-sm cursor-pointer">
                <Upload size={16} /> Importar copia
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) importBackup(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {importError && <p className="mt-2">{importError}</p>}
          </details>
        )}
      </aside>

      {doc ? (
        <section className="min-w-0">
          <div className="mb-6">
            <input
              aria-label="Pasaje del estudio"
              value={doc.passageOrTopic}
              onChange={(e) => updateDoc((s) => ({ ...s, passageOrTopic: e.target.value }))}
              className="library-control bg-transparent text-sm tracking-wide uppercase mb-2 w-full sm:w-auto"
            />
            <input
              aria-label="Título del estudio"
              value={doc.title}
              onChange={(e) => updateDoc((s) => ({ ...s, title: e.target.value }))}
              placeholder="Título del sermón"
              className="block w-full font-serif text-3xl sm:text-4xl leading-tight max-w-3xl bg-transparent border-b border-transparent focus:border-[#315b46] outline-none py-1"
            />
            <p className="text-sm opacity-70 mt-2" role="status">
              {saveState === 'saving' ? 'Guardando…' : 'Guardado en este dispositivo'}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => setPulpit(true)}
                disabled={!hasSermon}
                className="library-control disabled:opacity-50"
              >
                <Maximize2 size={18} /> Modo Púlpito
              </button>
              <button
                onClick={() =>
                  exportStudyToPdf({
                    passageOrTopic: doc.passageOrTopic,
                    translation: 'Reina-Valera 1960 (RVR1960)',
                    content: sermon,
                  })
                }
                disabled={!hasSermon}
                className="library-control disabled:opacity-50"
              >
                <FileDown size={18} /> PDF del bosquejo
              </button>
              <button onClick={() => setPreview(!preview)} className="library-control">
                <Eye size={18} /> {preview ? 'Ocultar bosquejo' : 'Ver bosquejo'}
              </button>
            </div>
            {!hasSermon && (
              <p className="text-sm opacity-70 mt-3">
                El púlpito y el PDF se habilitan cuando escribís algo en los apartados del bosquejo.
              </p>
            )}
          </div>

          <details className="mb-6 border-y border-[#cbd4c9] dark:border-[#405245] py-3" open>
            <summary className="font-semibold cursor-pointer">Herramientas de estudio</summary>
            <p className="text-sm opacity-75 mt-3 mb-3">
              Estas herramientas externas son gratuitas, están en inglés y necesitan Internet.
              Todo lo que escribás en los apartados queda guardado acá, en este dispositivo.
            </p>
            <div className="flex flex-wrap gap-2">
              {rvrUrl && (
                <a href={rvrUrl} target="_blank" rel="noreferrer" className="library-control text-sm">
                  <BookOpen size={16} /> Pasaje en RVR1960 <ExternalLink size={13} />
                </a>
              )}
              {stepUrl && (
                <a href={stepUrl} target="_blank" rel="noreferrer" className="library-control text-sm">
                  Texto original e interlineal (STEP Bible) <ExternalLink size={13} />
                </a>
              )}
              <a
                href={blbLink || 'https://www.blueletterbible.org/'}
                target="_blank"
                rel="noreferrer"
                className="library-control text-sm"
              >
                Léxico y comentarios (Blue Letter Bible) <ExternalLink size={13} />
              </a>
            </div>
          </details>

          {preview && (
            <article
              className="library-reading bg-[#fffdf8] dark:bg-[#18241d] rounded-2xl px-5 sm:px-9 py-7 sm:py-10 shadow-sm mb-6"
              style={{ fontSize: 20, lineHeight: 1.75 }}
            >
              {hasSermon ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sermon}</ReactMarkdown>
              ) : (
                <p>Todavía no hay contenido en los apartados del bosquejo.</p>
              )}
            </article>
          )}

          <h3 className="font-serif text-2xl mb-3">Preparación</h3>
          <div className="space-y-4 mb-8">
            {PREP_SECTIONS.map((sec) => (
              <SectionEditor key={sec.key} def={sec} doc={doc} updateDoc={updateDoc} />
            ))}
          </div>

          <h3 className="font-serif text-2xl mb-3">Bosquejo del sermón</h3>
          <div className="space-y-4">
            {SERMON_SECTIONS.map((sec) => (
              <SectionEditor key={sec.key} def={sec} doc={doc} updateDoc={updateDoc} />
            ))}
          </div>
        </section>
      ) : (
        <section className="py-10 font-serif text-2xl">
          Elegí un estudio de la lista o creá uno nuevo para empezar.
        </section>
      )}

      {doc && (
        <PulpitModal
          isOpen={pulpit}
          onClose={() => setPulpit(false)}
          passageOrTopic={doc.passageOrTopic}
          translation="Reina-Valera 1960 (RVR1960)"
          content={sermon}
        />
      )}
    </div>
  );
};

interface SectionEditorProps {
  def: SectionDef;
  doc: PersonalStudyDoc;
  updateDoc: (mutate: (s: PersonalStudyDoc) => PersonalStudyDoc) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ def, doc, updateDoc }) => (
  <div className="rounded-2xl border border-[#cbd4c9] dark:border-[#405245] p-4 bg-[#fffdf8] dark:bg-[#18241d]">
    <label className="block font-semibold" htmlFor={`ps-${def.key}`}>
      {def.label}
    </label>
    <p className="text-sm opacity-70 mt-1 mb-2">{def.hint}</p>
    <textarea
      id={`ps-${def.key}`}
      value={doc.sections[def.key] || ''}
      onChange={(e) =>
        updateDoc((s) => ({ ...s, sections: { ...s.sections, [def.key]: e.target.value } }))
      }
      rows={5}
      className="w-full rounded-xl border border-[#cbd4c9] dark:border-[#405245] bg-transparent p-3 text-base leading-relaxed resize-y outline-none focus:border-[#315b46]"
      style={{ fontSize: 17 }}
    />
  </div>
);
