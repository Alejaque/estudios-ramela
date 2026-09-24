import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, GraduationCap, ScrollText, Camera, RotateCcw } from 'lucide-react';

const DEFAULT_PORTADA = '/público/portada-alejandro-ramela.jpg';
export const CoverHero: React.FC = () => {
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('alejandro_ramela_custom_avatar');
      // Only keep if the user explicitly uploaded a base64 custom image
      if (saved && saved.startsWith('data:image/')) {
        return saved;
      }
      return DEFAULT_PORTADA;
    } catch {
      return DEFAULT_PORTADA;
    }
  });

  const [hasCustomPhoto, setHasCustomPhoto] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('alejandro_ramela_custom_avatar');
      return !!(saved && saved.startsWith('data:image/'));
    } catch {
      return false;
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          try {
            localStorage.setItem('alejandro_ramela_custom_avatar', result);
          } catch (err) {
            console.error('Error saving custom avatar:', err);
          }
          setAvatarSrc(result);
          setHasCustomPhoto(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    try {
      localStorage.removeItem('alejandro_ramela_custom_avatar');
    } catch (err) {
      console.error(err);
    }
    setAvatarSrc(DEFAULT_PORTADA);
    setHasCustomPhoto(false);
  };

  return (
    <div
      id="portada-estudios-alejandro-ramela"
      className="mb-8 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-lg bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative"
    >
      {/* Subtle Background Pattern & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Cover Photo: Alejandro Ramela */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative rounded-2xl group transition-all duration-300">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-blue-500 to-amber-300 opacity-70 blur-xs" />
            
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl bg-slate-800">
              <img
                src={avatarSrc}
                alt="Alejandro Ramela - Portada Oficial"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />

              {/* Hover Overlay to update photo directly */}
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
                  title="Subir archivo de foto"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Subir foto</span>
                </button>
                {hasCustomPhoto && (
                  <button
                    type="button"
                    onClick={handleResetPhoto}
                    className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-amber-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Restaurar foto original de portada"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Badge */}
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-bold shadow-md flex items-center gap-1 pointer-events-none">
              <Sparkles className="w-3 h-3" />
              <span>Expositor</span>
            </div>
          </div>
        </div>

        {/* Text & Editorial Details */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-amber-300 text-xs font-semibold tracking-wide uppercase">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Exégesis Bíblica & Homilética Pastoral</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-theology-display text-white drop-shadow-xs">
            Estudios Alejandro Ramela
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-sans font-normal">
            Plataforma de análisis bíblico histórico-gramatical, bosquejos expositivos y notas de discipulado para la proclamación fiel de la Palabra de Dios.
          </p>

          {/* Pillars Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Fidelidad Textual</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5 shadow-xs">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>Exégesis Griego/Hebreo</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 flex items-center gap-1.5 shadow-xs">
              <ScrollText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bosquejos para el Púlpito</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
