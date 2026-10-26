import { offlinePassage } from '../utils/offlineBible';
import React, {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {X, Copy, Check, ExternalLink, ArrowLeft} from 'lucide-react';
import {useModalBackButton} from '../hooks/useModalBackButton';
export const BibleVerseModal:React.FC<{reference:string;onClose:()=>void}>=({reference,onClose})=>{
 useModalBackButton(true,onClose);
 const [copied,setCopied]=useState(false);
 const [verRVR,setVerRVR]=useState(false);
 const [estado,setEstado]=useState<'cargando'|'listo'|'fallo'>('cargando');
 const [intento,setIntento]=useState(0);
 const refBox=useRef<HTMLDivElement>(null);
 const localText=offlinePassage(reference);
 const pd=localText?{text:localText,copyright:'Reina-Valera 1909 · Dominio público · Texto incluido en la app para consulta sin conexión.'}:null;
 const pdText=pd?pd.text.split('\n').map(l=>l.trim().replace(/^\[(\d+)\]\s*/,'$1 ')).filter(Boolean).join('\n\n'):'';
 const is1909=!!pd;
 const url='https://www.biblegateway.com/passage/?search='+encodeURIComponent(reference)+'&version=RVR1960';
 useEffect(()=>{
  if(!verRVR)return;
  setEstado('cargando');
  let cancel=false;
  const t=setTimeout(()=>{if(!cancel)setEstado(e=>e==='cargando'?'fallo':e);},20000);
  (async()=>{
   try{
    if(!(window as any).BGLinks){
     await new Promise<void>((res,rej)=>{
      const s=document.createElement('script');
      s.src='https://www.biblegateway.com/public/link-to-us/tooltips/bglinks-es.js';
      s.onload=()=>res();
      s.onerror=()=>rej(new Error('no se pudo cargar la herramienta'));
      document.body.appendChild(s);
     });
    }
    if(cancel)return;
    const B=(window as any).BGLinks;
    B.version='RVR1960';
    B.clickTooltip=true;
    B.linkVerses();
    clearTimeout(t);
    if(cancel)return;
    setEstado('listo');
    setTimeout(()=>{const a=refBox.current?.querySelector('a.bibleref') as HTMLAnchorElement|null; if(a)a.click();},400);
   }catch(e){clearTimeout(t);if(!cancel)setEstado('fallo');}
  })();
  return ()=>{cancel=true;clearTimeout(t);};
 },[verRVR,intento]);
 return createPortal(<div className="fixed inset-0 z-[100] bg-black/65 flex items-center justify-center p-3" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={reference} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')onClose();}} className="bg-[#fffdf8] text-[#24352c] w-full max-w-2xl max-h-[90dvh] rounded-2xl flex flex-col overflow-hidden"><div className="p-5 border-b flex justify-between items-center"><div className="flex items-center gap-3">{verRVR&&<button aria-label="Volver al texto sin conexión" onClick={()=>setVerRVR(false)} className="p-2"><ArrowLeft/></button>}<div><h2 className="text-xl font-bold">{reference}</h2><p className="text-sm">{verRVR?'Reina-Valera 1960 · en línea (BibleGateway)':'Reina-Valera 1909 (dominio público)'}</p></div></div><button aria-label="Cerrar Biblia" onClick={onClose} className="p-3"><X/></button></div>{verRVR?(<>
 <div ref={refBox} className="p-6 flex-1 overflow-auto">
 {estado==='cargando'&&<p className="text-sm">Cargando RVR1960 con la herramienta oficial de BibleGateway… necesita Internet.</p>}
 {estado==='fallo'&&<div className="text-sm"><p>No se pudo cargar la versión en línea. Revisá tu conexión a Internet y reintentá. El texto sin conexión sigue disponible volviendo atrás.</p><button className="library-control mt-3" onClick={()=>setIntento(i=>i+1)}>Reintentar</button></div>}
 {estado==='listo'&&<>
  <p className="text-xl font-bold underline decoration-2 underline-offset-4">{reference}</p>
  <p className="text-sm mt-3">Tocá la referencia para volver a mostrar el texto. Los pasajes largos muestran el comienzo y siguen con el enlace a BibleGateway.</p>
 </>}
 </div>
 <div className="px-4 py-2 border-t flex flex-wrap gap-x-3 items-center justify-between"><p className="text-xs leading-normal max-w-md">Texto mostrado por la herramienta oficial de BibleGateway dentro de la app; no se copia ni se guarda. Requiere Internet. La consulta sin conexión usa Reina-Valera 1909.</p><a href={url} target="_blank" rel="noreferrer" className="text-xs underline">Abrir en BibleGateway (sale de la app)</a></div>
</>):(<>
 <div className="overflow-auto p-6 text-[22px] leading-[1.8] whitespace-pre-line font-serif">{(is1909?<>{pdText}<span className="block text-base leading-snug mt-6 font-sans rounded-xl bg-[#f1e7c8] p-4">Esta consulta usa Reina-Valera 1909 y funciona sin conexión. El botón de abajo abre la RVR1960 en línea. El bosquejo no se cambia.</span><span className="block text-xs leading-normal mt-4 font-sans">{pd?.copyright}</span></>:'No pude reconocer esta referencia. El bosquejo sigue disponible. El botón de abajo permite buscarla en línea cuando tengas conexión.')}</div>
 <div className="p-4 border-t flex flex-wrap gap-3">{pd&&<button className="library-control" onClick={()=>{navigator.clipboard.writeText(pdText+'\n'+reference+' (RV1909)');setCopied(true);}}>{copied?<Check size={18}/>:<Copy size={18}/>} Copiar</button>}<button className="library-control" onClick={()=>setVerRVR(true)}><ExternalLink size={18}/> Ver en RVR1960</button></div>
</>)}</div></div>,document.body);
};
