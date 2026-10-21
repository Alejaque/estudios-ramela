import React from 'react';
import {BookOpen} from 'lucide-react';

export const CoverHero:React.FC=()=>{
 let image='/portada-alejandro-ramela.png';
 try{const saved=localStorage.getItem('alejandro_ramela_custom_avatar');if(saved?.startsWith('data:image/'))image=saved;}catch{/* Use original cover. */}
 return <section className="flex items-center gap-4 sm:gap-6 rounded-2xl border border-[#cbd4c9] dark:border-[#405245] bg-[#fffdf8] dark:bg-[#18241d] p-4 sm:p-5">
 <img src={image} alt="Alejandro Ramela" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0"/>
 <div className="min-w-0"><p className="text-xs uppercase tracking-widest opacity-60 mb-1">Estudios bíblicos</p><h2 className="font-serif text-xl sm:text-2xl font-bold">Alejandro Ramela</h2><p className="text-sm sm:text-base opacity-75 mt-1 flex items-center gap-2"><BookOpen size={16} className="shrink-0"/> Biblioteca y púlpito</p></div>
 </section>;
};
