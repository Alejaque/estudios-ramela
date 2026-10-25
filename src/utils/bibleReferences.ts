const aliases: Record<string,string> = {
  'fil':'Filipenses','fil.':'Filipenses','jn':'Juan','jn.':'Juan','mt':'Mateo','mt.':'Mateo','ro':'Romanos','rom':'Romanos','rom.':'Romanos','heb':'Hebreos','heb.':'Hebreos','dt':'Deuteronomio','dt.':'Deuteronomio','sal':'Salmos','sal.':'Salmos','ef':'Efesios','ef.':'Efesios','1 ti':'1 Timoteo','2 ti':'2 Timoteo','1 p':'1 Pedro','1 pe':'1 Pedro','1 co':'1 Corintios','2 co':'2 Corintios'
};
const books = 'Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|[12] Samuel|[12] Reyes|[12] Crónicas|Esdras|Nehemías|Ester|Job|Salmos?|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|[12] Corintios|Gálatas|Efesios|Filipenses|Colosenses|[12] Tesalonicenses|[12] Timoteo|Tito|Filemón|Hebreos|Santiago|[12] Pedro|[123] Juan|Judas|Apocalipsis|Fil\\.?|Jn\\.?|Mt\\.?|Rom?\\.?|Heb\\.?|Dt\\.?|Sal\\.?|Ef\\.?|[12] Co\\.?|[12] Ti\\.?|1 P(?:e)?\\.?';
const explicit = new RegExp(`(?<![A-Za-záéíóúüñÁÉÍÓÚÜÑ])(${books})\\s+(\\d+)(?::\\s*(\\d+)(?:\\s*[-–—]\\s*(?:(\\d+):)?(\\d+))?(?:\\s*,\\s*\\d+(?:\\s*[-–—]\\s*\\d+)?)*)?`, 'gi');
export function referenceLinks(context: string) {
  return () => (tree: any) => {
    let activeContext = context;
    function visit(node: any, allowBare=true) {
      if (node.type === 'heading') activeContext = context;
      if(node.type==='strong' && node.children?.some((x:any)=>x.type==='text' && /\bv{1,2}\.\s*\d/.test(x.value)) && !node.children?.some((x:any)=>x.type==='text' && /\d+:\d+/.test(x.value))) activeContext=context;
      if (!node.children || ['link','code','inlineCode'].includes(node.type)) return;
      node.children = node.children.flatMap((child: any) => {
        if (child.type !== 'text') { visit(child,allowBare); return [child]; }
        const value = String(child.value); const result: any[] = []; let end = 0;
        explicit.lastIndex = 0;
        for (const match of value.matchAll(explicit)) {
          const i = match.index!; if (i > end) result.push({type:'text',value:value.slice(end,i)});
          const name = aliases[match[1].toLowerCase().replace(/\.$/,'')] || aliases[match[1].toLowerCase()] || match[1];
          const ref = `${name} ${match[0].slice(match[1].length).trim().replace(/[–—]/g,'-')}`;
          activeContext = ref;
          result.push({type:'link',url:'bible:'+encodeURIComponent(ref),children:[{type:'text',value:match[0]}]});end=i+match[0].length;
        }
        if (end) { if (end < value.length) result.push({type:'text',value:value.slice(end)}); const wrapper={children:result};visit(wrapper,false);return wrapper.children; }
        const base = (/su fuerza es Cristo/i.test(value) ? context : activeContext).match(/^(.+?\s+\d+):/);
        const bare = /(?<![\w:])(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?/g;
        const contextBook=activeContext.match(/^(.+?)\s+\d+/)?.[1];
        if(allowBare && contextBook && bare.test(value)){bare.lastIndex=0;let finish=0;const parts:any[]=[];for(const r of value.matchAll(bare)){const pos=r.index!;if(pos>finish)parts.push({type:'text',value:value.slice(finish,pos)});parts.push({type:'link',url:'bible:'+encodeURIComponent(`${contextBook} ${r[0]}`),children:[{type:'text',value:r[0]}]});finish=pos+r[0].length;}if(finish<value.length)parts.push({type:'text',value:value.slice(finish)});return parts;}
        const relatives = /(?:^Versículos?\s+|\bv{1,2}\.\s*)(\d+)(?:\s*[-–—]\s*(\d+))?[ab]?(?=\s*[·:.,)-]|$)/gi;
        if (base) {
          let finish=0;const parts:any[]=[];
          for (const r of value.matchAll(relatives)) {
            const pos=r.index!;if(pos>finish)parts.push({type:'text',value:value.slice(finish,pos)});
            parts.push({type:'link',url:'bible:'+encodeURIComponent(`${base[1]}:${r[1]}${r[2]?'-'+r[2]:''}`),children:[{type:'text',value:r[0]}]});finish=pos+r[0].length;
          }
          if(finish){if(finish<value.length)parts.push({type:'text',value:value.slice(finish)});return parts;}
        }
        return [child];
      });
    }
    visit(tree);
  };
}
export const bibleUrlTransform = (url: string) => /^(bible:|https?:|mailto:|#|\/)/i.test(url) ? url : '';
