import React, { useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TurndownService, { gfm } from '../utils/studyMarkdown';
import { studyFormatting } from '../utils/studyFormatting';

const MarkdownConstructor = TurndownService as unknown as {new(options:unknown): {use:(plugin:unknown)=>void;addRule:(name:string,rule:unknown)=>void;turndown:(html:string)=>string}};
const markdown = new MarkdownConstructor({headingStyle:'atx', bulletListMarker:'-', emDelimiter:'*', strongDelimiter:'**', codeBlockStyle:'fenced'});
markdown.use(gfm);
markdown.addRule('underline', {filter:['u'], replacement:(s:string) => s ? '<u>'+s+'</u>' : ''});
markdown.addRule('highlight', {filter:['mark'], replacement:(s:string) => s ? '<mark>'+s+'</mark>' : ''});

export function RichStudyField({value, onChange, label, minRows = 4}: {value:string; onChange:(s:string)=>void; label:string; minRows?:number}) {
  const editor = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const [html] = useState(() => renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm, studyFormatting]} components={{mark:({children})=><span style={{backgroundColor:'#ffeb80'}}>{children}</span>}}>{value}</ReactMarkdown>));
  const [hint,setHint] = useState('Seleccioná texto y elegí el formato, o activalo antes de escribir.');
  function remember() {
    const s=window.getSelection();
    if(s?.rangeCount && editor.current?.contains(s.anchorNode) && editor.current?.contains(s.focusNode)) range.current=s.getRangeAt(0).cloneRange();
  }
  function emit() {
    if(editor.current) {
      const copy=editor.current.cloneNode(true) as HTMLElement;
      for(const element of copy.querySelectorAll<HTMLElement>('[style]')) {
        const bg=element.style.backgroundColor;
        if(bg && !['transparent','rgba(0, 0, 0, 0)'].includes(bg)) {
          const mark=document.createElement('mark');
          while(element.firstChild)mark.appendChild(element.firstChild);
          element.appendChild(mark);
        }
        element.style.removeProperty('background-color');
      }
      onChange(markdown.turndown(copy.innerHTML));
    }
    remember();
  }
  function format(command:string) {
    const el=editor.current;if(!el)return;
    const savedRange=range.current?.cloneRange();
    el.focus({preventScroll:true});
    const selection=window.getSelection();
    if(savedRange && el.contains(savedRange.commonAncestorContainer)){ selection?.removeAllRanges();selection?.addRange(savedRange); }
    document.execCommand('styleWithCSS',false,'false');
    if(command==='highlight') {
      const color=document.queryCommandValue('backColor');
      document.execCommand('hiliteColor',false, /255, 235, 128/.test(color)?'transparent':'#ffeb80');
    } else document.execCommand(command,false);
    emit();
    setHint('Formato aplicado. Guardá el estudio para conservarlo.');
  }
  return <div className="rich-study-field mt-2 font-normal">
    <div role="toolbar" aria-label={'Formato de '+label} className="flex flex-wrap gap-2 mb-2 text-base font-sans">
      <button type="button" className="library-control font-bold" onMouseDown={e=>e.preventDefault()} onClick={()=>format('bold')} title="Negrita (Ctrl+B)">Negrita</button>
      <button type="button" className="library-control italic" onMouseDown={e=>e.preventDefault()} onClick={()=>format('italic')} title="Cursiva (Ctrl+I)">Cursiva</button>
      <button type="button" className="library-control underline" onMouseDown={e=>e.preventDefault()} onClick={()=>format('underline')} title="Subrayado (Ctrl+U)">Subrayado</button>
      <button type="button" className="library-control" style={{background:'#ffeb80',color:'#192a22'}} onMouseDown={e=>e.preventDefault()} onClick={()=>format('highlight')}>Resaltar</button>
    </div>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={label} aria-multiline="true" className="rich-study-input markdown-theology rounded-xl border-2 border-[#8fa597] bg-white text-black p-4 font-serif leading-relaxed" style={{minHeight:`${minRows*1.7+1.5}em`,fontSize:'inherit'}} dangerouslySetInnerHTML={{__html:html}}
      onInput={emit} onSelect={remember} onBlur={remember} onKeyUp={remember} onMouseUp={remember} onTouchEnd={remember}
      onKeyDown={e=>{if((e.ctrlKey||e.metaKey) && ['b','i','u'].includes(e.key.toLowerCase())){e.preventDefault();format(({b:'bold',i:'italic',u:'underline'} as Record<string,string>)[e.key.toLowerCase()]);}}}
      onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));emit();}}
      onDrop={e=>e.preventDefault()} onClick={e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();}}
    />
    <p className="text-sm font-sans opacity-75 mt-2" aria-live="polite">{hint}</p>
  </div>;
}
