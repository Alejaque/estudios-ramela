import { offlinePassage } from '../utils/offlineBible';
import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {X, Copy, Check, ExternalLink} from 'lucide-react';
import {useModalBackButton} from '../hooks/useModalBackButton';
export const BibleVerseModal:React.FC<{reference:string;onClose:()=>void}>=({reference,onClose})=>{
 useModalBackButton(true,onClose);
 const [copied,setCopied]=useState(false);
 const localText=offlinePassage(reference);
 const pd=localText?{text:localText,copyright:'Reina-Valera 1909 · Dominio público · Texto incluido en la app para consulta sin conexión.'}:null;
 const pdText=pd?pd.text.split('\n').map(l=>l.trim().replace(/^\[(\d+)\]\s*/,'$1 ')).filter(Boolean).join('\n\n'):'';
 const is1909=!!pd;
 const url='https://www.biblegateway.com/passage/?search='+encodeURIComponent(reference)+'&version=RVR1960';
 return createPortal(<div className="fixed inset-0 z-[100] bg-black/65 flex items-center justify-center p-3" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={reference} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')onClose();}} className="bg-[#fffdf8] text-[#24352c] w-full max-w-2xl max-h-[90dvh] rounded-2xl flex flex-col overflow-hidden"><div className="p-5 border-b flex justify-between items-center"><div><h2 className="text-xl font-bold">{reference}</h2><p className="text-sm">Reina-Valera 1909 (dominio público)</p></div><button aria-label="Cerrar Biblia" onClick={onClose} className="p-3"><X/></button></div><div className="overflow-auto p-6 text-[22px] leading-[1.8] whitespace-pre-line font-serif">{(is1909?<>{pdText}<span className="block text-base leading-snug mt-6 font-sans rounded-xl bg-[#f1e7c8] p-4">Esta consulta usa Reina-Valera 1909 y funciona sin conexión. El botón de abajo abre la RVR1960 en línea. El bosquejo no se cambia.</span><span className="block text-xs leading-normal mt-4 font-sans">{pd?.copyright}</span></>:'No pude reconocer esta referencia. El bosquejo sigue disponible. El botón de abajo permite buscarla en línea cuando tengas conexión.')}</div><div className="p-4 border-t flex flex-wrap gap-3">{pd&&<button className="library-control" onClick={()=>{navigator.clipboard.writeText(pdText+'\n'+reference+' (RV1909)');setCopied(true);}}>{copied?<Check size={18}/>:<Copy size={18}/>} Copiar</button>}<a href={url} target="_blank" rel="noreferrer" className="library-control"><ExternalLink size={18}/> Ver en RVR1960</a></div></div></div>,document.body);
};
