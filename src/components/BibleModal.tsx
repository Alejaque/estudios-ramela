import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink, BookMarked, Search } from 'lucide-react';
import { useModalBackButton } from '../hooks/useModalBackButton';
import data from '../data/rv1909';
import { listPersonalModules, personalChapter, setActiveModule, PersonalModuleMeta } from '../utils/personalBible';

// Reina-Valera 1909 completa, incluida en la app (dominio público, funciona sin conexión).
const bible = data as Record<string, Record<string, Record<string, string>>>;

// [clave normalizada en los datos, nombre para mostrar, abreviatura] en orden canónico.
const BOOKS: [string, string, string][] = [
  ['genesis', 'Génesis', 'Gn'], ['exodo', 'Éxodo', 'Ex'], ['levitico', 'Levítico', 'Lv'], ['numeros', 'Números', 'Nm'],
  ['deuteronomio', 'Deuteronomio', 'Dt'], ['josue', 'Josué', 'Jos'], ['jueces', 'Jueces', 'Jue'], ['rut', 'Rut', 'Rt'],
  ['1 samuel', '1 Samuel', '1S'], ['2 samuel', '2 Samuel', '2S'], ['1 reyes', '1 Reyes', '1R'], ['2 reyes', '2 Reyes', '2R'],
  ['1 cronicas', '1 Crónicas', '1Cr'], ['2 cronicas', '2 Crónicas', '2Cr'], ['esdras', 'Esdras', 'Esd'], ['nehemias', 'Nehemías', 'Neh'],
  ['ester', 'Ester', 'Est'], ['job', 'Job', 'Job'], ['salmos', 'Salmos', 'Sal'], ['proverbios', 'Proverbios', 'Pr'],
  ['eclesiastes', 'Eclesiastés', 'Ec'], ['cantares', 'Cantares', 'Cnt'], ['isaias', 'Isaías', 'Is'], ['jeremias', 'Jeremías', 'Jer'],
  ['lamentaciones', 'Lamentaciones', 'Lm'], ['ezequiel', 'Ezequiel', 'Ez'], ['daniel', 'Daniel', 'Dn'], ['oseas', 'Oseas', 'Os'],
  ['joel', 'Joel', 'Jl'], ['amos', 'Amós', 'Am'], ['abdias', 'Abdías', 'Abd'], ['jonas', 'Jonás', 'Jon'],
  ['miqueas', 'Miqueas', 'Miq'], ['nahum', 'Nahúm', 'Nah'], ['habacuc', 'Habacuc', 'Hab'], ['sofonias', 'Sofonías', 'Sof'],
  ['hageo', 'Hageo', 'Hag'], ['zacarias', 'Zacarías', 'Zac'], ['malaquias', 'Malaquías', 'Mal'],
  ['mateo', 'Mateo', 'Mt'], ['marcos', 'Marcos', 'Mr'], ['lucas', 'Lucas', 'Lc'], ['juan', 'Juan', 'Jn'],
  ['hechos', 'Hechos', 'Hch'], ['romanos', 'Romanos', 'Ro'], ['1 corintios', '1 Corintios', '1Co'], ['2 corintios', '2 Corintios', '2Co'],
  ['galatas', 'Gálatas', 'Ga'], ['efesios', 'Efesios', 'Ef'], ['filipenses', 'Filipenses', 'Fil'], ['colosenses', 'Colosenses', 'Col'],
  ['1 tesalonicenses', '1 Tesalonicenses', '1Ts'], ['2 tesalonicenses', '2 Tesalonicenses', '2Ts'],
  ['1 timoteo', '1 Timoteo', '1Ti'], ['2 timoteo', '2 Timoteo', '2Ti'], ['tito', 'Tito', 'Tit'], ['filemon', 'Filemón', 'Flm'],
  ['hebreos', 'Hebreos', 'He'], ['santiago', 'Santiago', 'Stg'], ['1 pedro', '1 Pedro', '1P'], ['2 pedro', '2 Pedro', '2P'],
  ['1 juan', '1 Juan', '1Jn'], ['2 juan', '2 Juan', '2Jn'], ['3 juan', '3 Juan', '3Jn'], ['judas', 'Judas', 'Jd'],
  ['apocalipsis', 'Apocalipsis', 'Ap'],
];

const OT_COUNT = 39; // los primeros 39 son el Antiguo Testamento
const OT_KEYS = new Set(BOOKS.slice(0, OT_COUNT).map(([k]) => k));

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const displayOf = (key: string) => BOOKS.find(([k]) => k === key)?.[1] ?? key;

// Botón grande de cuadrícula (libro, capítulo o versículo): fácil de tocar en la tablet.
const gridBtn =
  'min-h-[52px] rounded-lg border border-[#a9b9a9] font-bold text-[15px] text-center px-1 ' +
  'hover:bg-[#eef2ea] active:bg-[#e3ebe0] transition-colors cursor-pointer';

// Colores por testamento (pedido de Ale): AT ámbar pergamino, NT celeste; contraste alto sobre la tarjeta clara.
const gridBtnOT =
  'min-h-[52px] rounded-lg border-2 border-[#c9a227] bg-[#f5e9c8] text-[#5c4a08] font-bold text-[15px] text-center px-1 ' +
  'hover:bg-[#efdfae] active:bg-[#e8d394] transition-colors cursor-pointer';
const gridBtnNT =
  'min-h-[52px] rounded-lg border-2 border-[#5b8ec4] bg-[#dcebf9] text-[#1d4368] font-bold text-[15px] text-center px-1 ' +
  'hover:bg-[#c6e0f5] active:bg-[#b0d4f0] transition-colors cursor-pointer';

type Version = 'rv1909' | 'RVR1960' | 'PDT' | `mod:${string}`;

export const BibleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useModalBackButton(true, onClose);
  const [bookKey, setBookKey] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [pickingVerse, setPickingVerse] = useState(false);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [refInput, setRefInput] = useState('');
  const [refError, setRefError] = useState(false);
  const [version, setVersion] = useState<Version>('rv1909');
  const [modules, setModules] = useState<PersonalModuleMeta[]>([]);
  const [personalVerses, setPersonalVerses] = useState<Record<string, string> | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);

  // Biblias personales cargadas en este dispositivo (si hay). Si hay una en uso,
  // la Biblia abre directamente en esa versión; siempre se puede volver a la 1909.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const ms = await listPersonalModules();
        if (!live || !ms.length) return;
        setModules(ms);
        const active = ms.find(m => m.active) ?? ms[0];
        if (active?.id) setVersion(`mod:${active.id}`);
      } catch { /* sin módulos: queda la 1909 */ }
    })();
    return () => { live = false; };
  }, []);

  // Texto del capítulo desde la Biblia personal elegida (local, sin conexión).
  useEffect(() => {
    let live = true;
    if (!version.startsWith('mod:') || !bookKey || chapter == null) { setPersonalVerses(null); setPersonalLoading(false); return; }
    setPersonalLoading(true);
    personalChapter(version.slice(4), bookKey, chapter)
      .then(vs => { if (live) { setPersonalVerses(vs); setPersonalLoading(false); } });
    return () => { live = false; };
  }, [version, bookKey, chapter]);

  const personalMeta = version.startsWith('mod:') ? modules.find(m => `mod:${m.id}` === version) : undefined;
  const choosePersonal = (id: string) => { setVersion(`mod:${id}`); void setActiveModule(id); };

  const chapterCount = bookKey ? Object.keys(bible[bookKey] ?? {}).length : 0;
  const verses = bookKey && chapter ? bible[bookKey]?.[String(chapter)] : undefined;
  const verseNumbers = useMemo(
    () => (verses ? Object.keys(verses).map(Number).sort((a, b) => a - b) : []),
    [verses],
  );

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return BOOKS;
    return BOOKS.filter(([k, d, a]) => k.includes(q) || norm(d).includes(q) || norm(a) === q);
  }, [query]);
  const otBooks = filtered.filter(([k]) => OT_KEYS.has(k));
  const ntBooks = filtered.filter(([k]) => !OT_KEYS.has(k));

  // Al abrir un capítulo con versículo destino, desplazarse a ese versículo.
  useEffect(() => {
    if (targetVerse == null) return;
    const el = document.getElementById(`biblemodal-v-${targetVerse}`);
    el?.scrollIntoView({ block: 'start' });
    setTargetVerse(null);
  }, [targetVerse, chapter, bookKey]);

  const openBook = (key: string) => { setBookKey(key); setChapter(null); setPickingVerse(false); setRefError(false); };
  const pickChapter = (n: number) => { setChapter(n); setPickingVerse(true); };
  const readChapter = (n: number, verse?: number) => { setChapter(n); setPickingVerse(false); setTargetVerse(verse ?? 1); };
  const pickVerse = (v: number) => readChapter(chapter!, v);
  const goBack = () => {
    if (chapter != null && !pickingVerse) setPickingVerse(true);
    else if (chapter != null) setChapter(null);
    else if (bookKey) setBookKey(null);
  };

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
    if (v != null) readChapter(Number(m[2]), v);
    else pickChapter(Number(m[2]));
    setRefInput('');
    setRefError(false);
  };

  // Ventana en línea dentro de la app (como en HaDavarStudio): BibleGateway
  // cargado en un recuadro, sin salir del estudio. Necesita conexión y muestra
  // la fuente con su propia publicidad; el texto licenciado no se copia a la app.
  const onlineUrl = bookKey && chapter
    ? 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(`${displayOf(bookKey)} ${chapter}`) + `&version=${version === 'PDT' ? 'PDT' : 'RVR1960'}`
    : null;

  const title =
    chapter != null && bookKey && pickingVerse
      ? `${displayOf(bookKey)} ${chapter} · versículo`
      : chapter != null && bookKey
        ? `${displayOf(bookKey)} ${chapter}`
        : bookKey
          ? `${displayOf(bookKey)} · capítulo`
          : 'Biblia';

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
              {title}
            </h2>
            <p className="text-sm opacity-75">
              {version.startsWith('mod:')
                ? `Tu Biblia personal · ${personalMeta?.name ?? ''} · sin conexión`
                : chapter != null && !pickingVerse && version !== 'rv1909'
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
            <p className="text-sm opacity-70 mb-2">Elegí un libro:</p>
            {([
              ['Antiguo Testamento', otBooks, gridBtnOT, 'text-[#8a6d10]'],
              ['Nuevo Testamento', ntBooks, gridBtnNT, 'text-[#2f5a86]'],
            ] as const).map(([label, list, btnCls, labelCls]) =>
              list.length > 0 && (
                <div key={label} className="mb-4">
                  <p className={`text-xs font-bold tracking-[0.15em] uppercase mb-2 ${labelCls}`}>{label}</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {list.map(([key, name, abbr]) => (
                      <button key={key} onClick={() => openBook(key)} title={name} aria-label={name} className={btnCls}>
                        {abbr}
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {bookKey && chapter == null && (
          <div className="overflow-auto p-4 sm:p-5">
            <p className="text-sm opacity-70 mb-2">Elegí un capítulo:</p>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => pickChapter(n)} aria-label={`Capítulo ${n}`} className={gridBtn}>{n}</button>
              ))}
            </div>
          </div>
        )}

        {bookKey && chapter != null && pickingVerse && (
          <div className="overflow-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm opacity-70">Elegí un versículo:</p>
              <button onClick={() => readChapter(chapter, 1)} className="text-sm font-semibold underline decoration-dotted underline-offset-4 cursor-pointer">
                Leer desde el principio
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {verseNumbers.map(v => (
                <button key={v} onClick={() => pickVerse(v)} aria-label={`Versículo ${v}`} className={gridBtn}>{v}</button>
              ))}
            </div>
          </div>
        )}

        {bookKey && chapter != null && !pickingVerse && verses && (
          <>
            <div className="px-4 pt-3 flex flex-wrap gap-2 items-center text-sm font-sans">
              <span className="opacity-70 mr-1">Versión:</span>
              <select
                aria-label="Elegir versión de la Biblia"
                className="library-control text-sm bg-[#fffdf8] max-w-[min(100%,420px)] truncate font-bold"
                value={version}
                onChange={e => {
                  const v = e.target.value as Version;
                  if (v.startsWith('mod:')) choosePersonal(v.slice(4));
                  else setVersion(v);
                }}
              >
                {modules.map(m => <option key={m.id} value={`mod:${m.id}`}>{m.name} · sin conexión</option>)}
                <option value="rv1909">Reina-Valera 1909 · sin conexión</option>
              </select>
            </div>
            {version.startsWith('mod:') ? (
              <div className="overflow-auto p-5 sm:p-6 text-[22px] leading-[1.8] font-serif">
                {personalLoading && <p className="text-base font-sans opacity-70">Abriendo tu Biblia personal…</p>}
                {!personalLoading && personalVerses && Object.keys(personalVerses).map(Number).sort((a, b) => a - b).map(v => (
                  <p key={v} id={`biblemodal-v-${v}`} className="mb-3 scroll-mt-4">
                    <strong className="mr-2 text-[#315b46]">{v}</strong>{personalVerses[String(v)]}
                  </p>
                ))}
                {!personalLoading && !personalVerses && (
                  <>
                    <p className="text-base leading-snug font-sans rounded-xl bg-[#f5e2c8] p-4 mb-4">
                      Tu Biblia personal{personalMeta ? ` (${personalMeta.name})` : ''} no tiene este capítulo; por eso se muestra la Reina-Valera 1909.
                    </p>
                    {verseNumbers.map(v => (
                      <p key={v} id={`biblemodal-v-${v}`} className="mb-3 scroll-mt-4">
                        <strong className="mr-2 text-[#315b46]">{v}</strong>{verses[String(v)]}
                      </p>
                    ))}
                  </>
                )}
                {!personalLoading && personalVerses && (
                  <p className="text-base leading-snug mt-6 font-sans rounded-xl bg-[#e3ecdd] p-4">
                    Estás leyendo tu Biblia personal{personalMeta ? ` (${personalMeta.name})` : ''}, guardada solo en este dispositivo. Funciona sin conexión.
                  </p>
                )}
              </div>
            ) : version === 'rv1909' ? (
              <div className="overflow-auto p-5 sm:p-6 text-[22px] leading-[1.8] font-serif">
                {verseNumbers.map(v => (
                  <p key={v} id={`biblemodal-v-${v}`} className="mb-3 scroll-mt-4">
                    <strong className="mr-2 text-[#315b46]">{v}</strong>{verses[String(v)]}
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
                onClick={() => readChapter(chapter - 1)}
                aria-label="Capítulo anterior"
              ><ChevronLeft size={18} /> Cap. anterior</button>
              <button
                className="library-control"
                disabled={chapter >= chapterCount}
                onClick={() => readChapter(chapter + 1)}
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
