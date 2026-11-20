import React, {useEffect, useRef, useState, type RefObject} from 'react';
import type {SpanishChecker} from '../utils/spelling/checker';
let loading:Promise<SpanishChecker>|undefined;
const load=()=>loading??=(import('../utils/spelling/checker').then(m=>m.default).catch(e=>{loading=undefined;throw e}));
const highlights=new Map<HTMLElement,Range[]>();
function paint(el:HTMLElement,ranges:Range[]|null){
  if(ranges)highlights.set(el,ranges);else highlights.delete(el);
  const win=window as any;
  if(win.CSS?.highlights && win.Highlight)win.CSS.highlights.set('estudio-ortografia',new win.Highlight(...[...highlights.values()].flat()));
}
interface Issue {word:string;range:Range}
function findIssues(el:HTMLElement,checker:SpanishChecker,ignored:Set<string>):Issue[]{
  let text='';const segments:{node:Text;start:number;end:number}[]=[];
  function visit(node:Node){
    if(node.nodeType===Node.TEXT_NODE){const start=text.length;text+=node.textContent||'';segments.push({node:node as Text,start,end:text.length});return;}
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    const block=/^(P|DIV|BR|LI|H[1-6]|TD|TH|BLOCKQUOTE)$/.test((node as Element).tagName);
    if(block)text+='\n';for(const child of node.childNodes)visit(child);if(block)text+='\n';
  }
  visit(el);const issues:Issue[]=[];
  for(const match of text.matchAll(/\p{L}[\p{L}\p{M}]*(?:['’][\p{L}\p{M}]+)*/gu)){
    const word=match[0];if(word.length<2||word.length>64||ignored.has(word.toLocaleLowerCase('es-AR'))||checker.correct(word))continue;
    const start=match.index!,end=start+word.length;const a=segments.find(s=>s.start<=start&&s.end>start),b=segments.find(s=>s.start<end&&s.end>=end);
    if(a&&b){const range=document.createRange();range.setStart(a.node,start-a.start);range.setEnd(b.node,end-b.start);issues.push({word,range});}if(issues.length>=80)break;
  }return issues;
}

export function SpanishSpelling({editor,onEdit,label}: {editor:RefObject<HTMLDivElement|null>;onEdit:()=>void;label:string}){
  const [active,setActive]=useState(false),[state,setState]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
  const [issues,setIssues]=useState<Issue[]>([]),[chosen,setChosen]=useState<Issue|null>(null),[suggestions,setSuggestions]=useState<string[]>([]);
  const checker=useRef<SpanishChecker|null>(null),ignored=useRef(new Set<string>()),scan=useRef<()=>void>(()=>{}),editing=useRef(onEdit);editing.current=onEdit;
  useEffect(()=>{
    const el=editor.current;if(!el)return;let timer:ReturnType<typeof setTimeout>|undefined,alive=true,composing=false;
    function run(){if(!alive||composing||!checker.current)return;const found=findIssues(el!,checker.current,ignored.current);setIssues(found);setChosen(null);setSuggestions([]);paint(el!,found.map(x=>x.range));setState('ready');}
    function schedule(){clearTimeout(timer);timer=setTimeout(run,450);}
    function focus(){setActive(true);if(checker.current)return;setState('loading');load().then(c=>{if(alive){checker.current=c;run();}}).catch(()=>{if(alive)setState('failed')});}
    function start(){composing=true;clearTimeout(timer);}function end(){composing=false;schedule();}
    scan.current=run;el.addEventListener('focus',focus);el.addEventListener('input',schedule);el.addEventListener('compositionstart',start);el.addEventListener('compositionend',end);
    if(document.activeElement===el)focus();
    return()=>{alive=false;clearTimeout(timer);paint(el,null);el.removeEventListener('focus',focus);el.removeEventListener('input',schedule);el.removeEventListener('compositionstart',start);el.removeEventListener('compositionend',end);};
  },[editor]);
  function choose(issue:Issue){
    if(!editor.current?.contains(issue.range.commonAncestorContainer)||issue.range.toString()!==issue.word){scan.current();return;}
    setChosen(issue);setSuggestions(checker.current?.suggest(issue.word).slice(0,5)||[]);
    editor.current.focus({preventScroll:true});const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(issue.range);issue.range.startContainer.parentElement?.scrollIntoView({block:'nearest'});
  }
  function replace(word:string){
    const el=editor.current;if(!el||!chosen)return;
    if(!el.contains(chosen.range.commonAncestorContainer)||chosen.range.toString()!==chosen.word){scan.current();return;}
    el.focus({preventScroll:true});const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(chosen.range);
    document.execCommand('insertText',false,word);editing.current();scan.current();
  }
  if(!active)return <p className="text-sm font-sans opacity-75 mt-2">Ortografía en español: se revisa al escribir en este campo.</p>;
  const unique=issues.filter((x,i)=>issues.findIndex(y=>y.word===x.word)===i);
  return <div role="region" aria-label={'Ortografía de '+label} className="spelling-panel text-base font-sans font-normal mt-3 p-3 rounded-xl border border-[#8fa597] bg-[#f6f3e8] text-[#192a22]">
    <p className="font-bold">Ortografía en español (Argentina)</p>
    {state==='loading'&&<p role="status">Cargando el diccionario local…</p>}
    {state==='failed'&&<p role="alert">No se pudo cargar el diccionario. El corrector del navegador puede seguir marcando palabras si está activado. No se cambió tu texto.</p>}
    {state==='ready'&&<><p role="status">{issues.length?`${issues.length>=80?'80 o más':issues.length} posibles errores. Tocá una palabra para revisarla.`:'No se detectaron posibles errores en este campo.'}</p>
    {!!issues.length&&<div className="flex flex-wrap gap-2 mt-2">{unique.slice(0,12).map(issue=><button key={issue.word} type="button" className="library-control" onMouseDown={e=>e.preventDefault()} onClick={()=>choose(issue)}>{issue.word}</button>)}</div>}
    {unique.length>12&&<p>Se muestran las primeras 12 palabras distintas.</p>}
    {chosen&&<div className="mt-3 border-t border-[#8fa597] pt-3"><p>Revisar: <strong>{chosen.word}</strong></p><p className="text-sm">Elegí una sugerencia o corregí la palabra en el texto.</p><div className="flex flex-wrap gap-2 mt-2">{suggestions.map(word=><button key={word} type="button" className="library-control" aria-label={'Cambiar '+chosen.word+' por '+word} onMouseDown={e=>e.preventDefault()} onClick={()=>replace(word)}>{word}</button>)}<button type="button" className="library-control" onClick={()=>{ignored.current.add(chosen.word.toLocaleLowerCase('es-AR'));scan.current();}}>Omitir en este campo</button></div>{!suggestions.length&&<p className="text-sm">No hay una sugerencia segura. Podés corregirla vos u omitirla.</p>}</div>}
    <p className="text-xs mt-2"><a className="underline" href="/ortografia-licencias.txt" target="_blank" rel="noopener noreferrer">Diccionario y licencias</a> · <a className="underline" href="/ortografia-fuentes.zip" download>Fuentes del diccionario</a></p>
    <p className="text-sm mt-2">Solo ortografía, no gramática. Los nombres propios y términos bíblicos pueden marcarse aunque estén bien. No cambia nada sin que vos lo elijas. Guardá el estudio al terminar.</p></>}
  </div>;
                    }
