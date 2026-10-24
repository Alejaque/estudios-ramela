import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {X, Copy, Check, ExternalLink} from 'lucide-react';
import {useModalBackButton} from '../hooks/useModalBackButton';
const JUAN_VERSES:Record<string,string>={"1": "Después de esto, Jesús fue al otro lado del mar de Galilea, el de Tiberias.", "2": "Y le seguía gran multitud, porque veían las señales que hacía en los enfermos.", "3": "Entonces subió Jesús a un monte, y se sentó allí con sus discípulos.", "4": "Y estaba cerca la pascua, la fiesta de los judíos.", "5": "Cuando alzó Jesús los ojos, y vio que había venido a él gran multitud, dijo a Felipe: ¿De dónde compraremos pan para que coman estos?", "6": "Pero esto decía para probarle; porque él sabía lo que había de hacer.", "7": "Felipe le respondió: Doscientos denarios de pan no bastarían para que cada uno de ellos tomase un poco.", "8": "Uno de sus discípulos, Andrés, hermano de Simón Pedro, le dijo:", "9": "Aquí está un muchacho, que tiene cinco panes de cebada y dos pececillos; mas ¿qué es esto para tantos?", "10": "Entonces Jesús dijo: Haced recostar la gente. Y había mucha hierba en aquel lugar; y se recostaron como en número de cinco mil varones.", "11": "Y tomó Jesús aquellos panes, y habiendo dado gracias, los repartió entre los discípulos, y los discípulos entre los que estaban recostados; asimismo de los peces, cuanto querían.", "12": "Y cuando se hubieron saciado, dijo a sus discípulos: Recoged los pedazos que sobraron, para que no se pierda nada.", "13": "Recogieron, pues, y llenaron doce cestas de pedazos, que de los cinco panes de cebada sobraron a los que habían comido.", "14": "Aquellos hombres entonces, viendo la señal que Jesús había hecho, dijeron: Este verdaderamente es el profeta que había de venir al mundo.", "15": "Pero entendiendo Jesús que iban a venir para apoderarse de él y hacerle rey, volvió a retirarse al monte él solo."};
const EXTRA:Record<string,string>={
'juan 6:35':'Jesús les dijo: Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre; y el que en mí cree, no tendrá sed jamás.',
'deuteronomio 18:15':'Profeta de en medio de ti, de tus hermanos, como yo, te levantará Jehová tu Dios; a él oiréis;'
};
export const BibleVerseModal:React.FC<{reference:string;onClose:()=>void}>=({reference,onClose})=>{
 useModalBackButton(true,onClose);
 const [copied,setCopied]=useState(false);
 const normalized=reference.trim().toLowerCase().replace(/[–—]/g,'-');
 const match=normalized.match(/^juan 6:(\d+)(?:-(\d+))?$/);
 let text=EXTRA[normalized]||'';
 if(match){const first=Number(match[1]),last=Number(match[2]||match[1]);if(first>=1&&last<=15&&last>=first)text=Array.from({length:last-first+1},(_,i)=>`${first+i} ${JUAN_VERSES[String(first+i)]}`).join('\n\n');}
 const [pd,setPd]=useState<{text:string;copyright:string}|null>(null);
 const [state,setState]=useState<'idle'|'loading'|'error'>('idle');
 const cacheKey='bible1909_'+normalized;
 useEffect(()=>{
  if(text)return;
  try{const c=localStorage.getItem(cacheKey);if(c){setPd(JSON.parse(c));return;}}catch{/* sin cache */}
  let alive=true;setState('loading');
  fetch('/api/bible?version=rvr60&ref='+encodeURIComponent(reference.trim())).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(!alive)return;if(!d.text)throw Error();const v={text:d.text as string,copyright:String(d.copyright||'Reina-Valera 1909 - Dominio público.')};setPd(v);try{localStorage.setItem(cacheKey,JSON.stringify(v));}catch{/* lleno */}}).catch(()=>{if(alive)setState('error');});
  return()=>{alive=false;};
 },[text,cacheKey,reference]);
 const pdText=pd?pd.text.split('\n').map(l=>l.trim().replace(/^\[(\d+)\]\s*/,'$1 ')).filter(Boolean).join('\n\n'):'';
 const is1909=!text&&!!pd;
 const url='https://www.biblegateway.com/passage/?search='+encodeURIComponent(reference)+'&version=RVR1960';
 return createPortal(<div className="fixed inset-0 z-[100] bg-black/65 flex items-center justify-center p-3" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={reference} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')onClose();}} className="bg-[#fffdf8] text-[#24352c] w-full max-w-2xl max-h-[90dvh] rounded-2xl flex flex-col overflow-hidden"><div className="p-5 border-b flex justify-between items-center"><div><h2 className="text-xl font-bold">{reference}</h2><p className="text-sm">{is1909?'Reina-Valera 1909 (dominio público)':'Reina-Valera 1960'}</p></div><button aria-label="Cerrar Biblia" onClick={onClose} className="p-3"><X/></button></div><div className="overflow-auto p-6 text-[22px] leading-[1.8] whitespace-pre-line font-serif">{text||(is1909?<>{pdText}<span className="block text-base leading-snug mt-6 font-sans rounded-xl bg-[#f1e7c8] p-4">Este texto es la Reina-Valera 1909, no la RVR1960 de tus estudios; algunas palabras cambian. Para leer la RVR1960 usá el botón de abajo (se abre fuera de la app).</span><span className="block text-xs leading-normal mt-4 font-sans">{pd?.copyright}</span></>:state==='loading'?'Cargando el pasaje…':'No pude cargar el texto dentro de la app (sin conexión o pasaje no reconocido). Podés abrir la RVR1960 con el botón de abajo.')}{text&&<p className="text-xs leading-normal mt-6 font-sans">Reina-Valera 1960 ® © Sociedades Bíblicas en América Latina, 1960. Renovado © Sociedades Bíblicas Unidas, 1988.</p>}</div><div className="p-4 border-t flex flex-wrap gap-3">{text&&<button className="library-control" onClick={()=>{navigator.clipboard.writeText(text+'\n'+reference+' (RVR1960)');setCopied(true);}}>{copied?<Check size={18}/>:<Copy size={18}/>} Copiar</button>}<a href={url} target="_blank" rel="noreferrer" className="library-control"><ExternalLink size={18}/> Ver en RVR1960</a></div></div></div>,document.body);
};
