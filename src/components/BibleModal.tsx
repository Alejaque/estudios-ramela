import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink, BookMarked, Search } from 'lucide-react';
import { useModalBackButton } from '../hooks/useModalBackButton';
import data from '../data/rv1909';

// Reina-Valera 1909 completa, incluida en la app (dominio público, funciona sin conexión).
const bible = data as Record<string, Record<string, Record<string, string>>>;

// [clave normalizada en los datos, nombre para mostrar] en orden canónico.
const BOOKS: [string, string][] = [
  ['genesis', 'Génesis'], ['exodo', 'Éxodo'], ['levitico', 'Levítico'], ['numeros', 'Números'],
  ['deuteronomio', 'Deuteronomio'], ['josue', 'Josué'], ['jueces', 'Jueces'], ['rut', 'Rut'],
  ['1 samuel', '1 Samuel'], ['2 samuel', '2 Samuel'], ['1 reyes', '1 Reyes'], ['2 reyes', '2 Reyes'],
  ['1 cronicas', '1 Crónicas'], ['2 cronicas', '2 Crónicas'], ['esdras', 'Esdras'], ['nehemias', 'Nehemías'],
  ['ester', 'Ester'], ['job', 'Job'], ['salmos', 'Salmos'], ['proverbios', 'Proverbios'],
  ['eclesiastes', 'Eclesiastés'], ['cantares', 'Cantares'], ['isaias', 'Isaías'], ['jeremias', 'Jeremías'],
  ['lamentaciones', 'Lamentaciones'], ['ezequiel', 'Ezequiel'], ['daniel', 'Daniel'], ['oseas', 'Oseas'],
  ['joel', 'Joel'], ['amos', 'Amós'], ['abdias', 'Abdías'], ['jonas', 'Jonás'],
  ['miqueas', 'Miqueas'], ['nahum', 'Nahúm'], ['habacuc', 'Habacuc'], ['sofonias', 'Sofonías'],
  ['hageo', 'Hageo'], ['zacarias', 'Zacarías'], ['malaquias', 'Malaquías'],
  ['mateo', 'Mateo'], ['marcos', 'Marcos'], ['lucas', 'Lucas'], ['juan', 'Juan'],
  ['hechos', 'Hechos'], ['romanos', 'Romanos'], ['1 corintios', '1 Corintios'], ['2 corintios', '2 Corintios'],
  ['galatas', 'Gálatas'], ['efesios', 'Efesios'], ['filipenses', 'Filipenses'], ['colosenses', 'Colosenses'],
  ['1 tesalonicenses', '1 Tesalonicenses'], ['2 tesalonicenses', '2 Tesalonicenses'],
  ['1 timoteo', '1 Timoteo'], ['2 timoteo', '2 Timoteo'], ['tito', 'Tito'], ['filemon', 'Filemón'],
  ['hebreos', 'Hebreos'], ['santiago', 'Santiago'], ['1 pedro', '1 Pedro'], ['2 pedro', '2 Pedro'],
  ['1 juan', '1 Juan'], ['2 juan', '2 Juan'], ['3 juan', '3 Juan'], ['judas', 'Judas'],
  ['apocalipsis', 'Apocalipsis'],
];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const displayOf = (key: string) => BOOKS.find(([k]) => k === key)?.[1] ?? key;

type Version = 'rv1909' | 'RVR1960' | 'PDT';

export const BibleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useModalBackButton(true, onClose);
  const [bookKey, setBookKey] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [refInput, setRefInput] = useState('');
  const [refError, setRefError] = useState(false);
  const [version, setVersion] = useState<Version>('rv1909');

  const chapterCount = bookKey ? Object.keys(bible[bookKey] ?? {}).length : 0;
  const verses = bookKey && chapter ? bible[bookKey]?.[String(chapter)] : undefined;

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return BOOKS;
    return BOOKS.filter(([k, d]) => k.includes(q) || norm(d).includes(q));
  }, [query]);

  // Al abrir un capítulo con versículo destino, desplazarse a ese versículo.
  useEffect(() => {
    if (targetVerse == null) return;
    const el = document.getElementById(`biblemodal-v-${targetVerse}`);
    el?.scrollIntoView({ block: 'start' });
    setTargetVerse(null);
  }, [targetVerse, chapter, bookKey]);

  const openBook = (key: string) => { setBookKey(key); setChapter(null); setRefError(false); };
  const openChapter = (n: number, verse?: number) => { setChapter(n); if (verse) setTargetVerse(verse); };
  const goBack = () => { if (chapter != null) setChapter(null); else if (bookKey) setBookKey(null); };

  // Referencia directa: "Juan 3:16", "Juan 3 16", "Salmos 23", "1 Juan 2:3".
  const goToReference = () => {
    const m = norm(refInput).match(/^(.+?)\s+(\d+)(?:[:\s]+(\d+))?$/);
    if (!m) { setRefError(true); return; }
    const key = m[1] === 'salmo' ? 'salmos' : m[1];
    const book = bible[key];
    const ch = book?.[m[2]];
    const v = m[3] ? Number(m[3]) : null;
    if (!book || !ch || (v != null && !ch[String(v)])) { setRefError(true); return; }
    setBookKey(key);
    openChapter(Number(m[2]), v ?? undefined);
    setRefInput('');
    setRefError(false);
  };

  // Ventana en línea dentro de la app (como en HaDavarStudio): BibleGateway
  // cargado en un recuadro, sin salir del estudio. Necesita conexión y muestra
  // la fuente con su propia publicidad; el texto licenciado no se copia a la app.
  const onlineUrl = bookKey && chapter
    ? 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(`${displayOf(bookKey)} ${chapter}`) + `&version=${version === 'PDT' ? 'PDT' : 'RVR1960'}`
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/65 flex items-center justify-center p-3 no-print" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Biblia Reina-Valera 1909"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        className={`bg-[#fffdf8] text-[#24352c] w-full ${version === 'rv1909' ? 'max-w-2xl' : 'max-w-4xl'} max-h-[90dvh] rounded-2xl flex flex-col overflow-hidden`}
      >
        <div className="p-4 sm:p-5 border-b border-[#d8d2c0] flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold flex items-center gap-2 truncate">
              {(bookKey || chapter != null) && (
                <button aria-label="Volver" onClick={goBack} className="p-2 -ml-2 shrink-0"><ChevronLeft /></button>
              )}
              <BookMarked className="shrink-0" size={20} />
              {chapter != null && bookKey ? `${displayOf(bookKey)} ${chapter}` : bookKey ? displayOf(bookKey) : 'Biblia'}
            </h2>
            <p className="text-sm opacity-75">
              {chapter != null && version !== 'rv1909'
                ? `${version} · en línea (BibleGateway) · necesita conexión`
                : 'Reina-Valera 1909 (dominio público) · sin conexión'}
            </p>
          </div>
          <button aria-label="Cerrar Biblia" onClick={onClose} className="p-3 shrink-0"><X /></button>
        </div>

        {!bookKey && (
          <div className="overflow-auto p-4 sm:p-5">
            <div className="flex gap-2 mb-3">
              <input
                aria-label="Buscar libro"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar libro…"
                className="library-control flex-1 bg-transparent"
              />
            </div>
            <form
              className="flex gap-2 mb-4"
              onSubmit={e => { e.preventDefault(); goToReference(); }}
            >
              <input
                aria-label="Ir a referencia"
                value={refInput}
                onChange={e => { setRefInput(e.target.value); setRefError(false); }}
                placeholder="Ej.: Juan 3:16"
                className="library-control flex-1 bg-transparent"
              />
              <button type="submit" className="library-control"><Search size={18} /> Ir</button>
            </form>
            {refError && <p role="alert" className="text-sm mb-3 text-[#8a3b2e]">No encontré esa referencia. Probá, por ejemplo: Juan 3:16 o Salmos 23.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map(([key, name]) => (
                <button key={key} onClick={() => openBook(key)} className="library-control justify-start">{name}</button>
              ))}
            </div>
          </div>
        )}

        {bookKey && chapter == null && (
          <div className="overflow-auto p-4 sm:p-5">
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => openChapter(n)} className="library-control justify-center">{n}</button>
              ))}
            </div>
          </div>
        )}

        {bookKey && chapter != null && verses && (
          <>
            <div className="px-4 pt-3 flex flex-wrap gap-2 items-center text-sm font-sans">
              <span className="opacity-70 mr-1">Versión:</span>
              {(['rv1909', 'RVR1960', 'PDT'] as Version[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  aria-pressed={version === v}
                  className="library-control text-sm"
                >{v === 'rv1909' ? 'RV1909 · sin conexión' : v}</button>
              ))}
            </div>
            {version === 'rv1909' ? (
              <div className="overflow-auto p-5 sm:p-6 text-[22px] leading-[1.8] font-serif">
                {Object.entries(verses)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([v, t]) => (
                    <p key={v} id={`biblemodal-v-${v}`} className="mb-3 scroll-mt-4">
                      <strong className="mr-2 text-[#315b46]">{v}</strong>{t}
                    </p>
                  ))}
                <p className="text-base leading-snug mt-6 font-sans rounded-xl bg-[#f1e7c8] p-4">
                  Estás leyendo Reina-Valera 1909, incluida en la app: funciona sin conexión.
                  Con el selector de arriba podés consultar este mismo capítulo en RVR1960 o PDT
                  en línea, sin salir del estudio. El bosquejo no se cambia.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: '55vh' }}>
                {onlineUrl && (
                  <iframe
                    key={onlineUrl}
                    src={onlineUrl}
                    title={`${displayOf(bookKey)} ${chapter} en ${version} (BibleGateway)`}
                    className="flex-1 w-full border-0 bg-white"
                  />
                )}
                <p className="text-xs leading-normal px-4 py-2 font-sans opacity-75">
                  Ventana en línea de BibleGateway ({version}): necesita conexión y muestra la fuente
                  con su propia publicidad. Si no carga, probá el enlace de abajo.
                </p>
              </div>
            )}
            <div className="p-4 border-t border-[#d8d2c0] flex flex-wrap gap-3 items-center">
              <button
                className="library-control"
                disabled={chapter <= 1}
                onClick={() => openChapter(chapter - 1)}
                aria-label="Capítulo anterior"
              ><ChevronLeft size={18} /> Cap. anterior</button>
              <button
                className="library-control"
                disabled={chapter >= chapterCount}
                onClick={() => openChapter(chapter + 1)}
                aria-label="Capítulo siguiente"
              >Cap. siguiente <ChevronRight size={18} /></button>
              {onlineUrl && (
                <a href={onlineUrl} target="_blank" rel="noreferrer" className="library-control">
                  <ExternalLink size={18} /> Abrir fuera de la app
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
