import data from '../data/rv1909';
const bible = data as Record<string,Record<string,Record<string,string>>>;
const norm = (s:string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export function offlinePassage(reference:string):string | null {
 const m=norm(reference).match(/^(.+?)\s+(\d+)(?::(.+))?$/);if(!m)return null;
 const key=m[1]==='salmo'?'salmos':m[1]; const book=bible[key];if(!book)return null;
 const chapter=book[m[2]];if(!chapter)return null;
 if(!m[3])return Object.entries(chapter).map(([v,t])=>`${v} ${t}`).join('\n\n');
 const lines:string[]=[];
 for(const part of m[3].split(/[,;]/)) {
  const range=part.trim().match(/^(\d+)(?:\s*[-–—]\s*(?:(\d+):)?(\d+))?$/);if(!range)return null;
  const start=Number(range[1]),endChapter=Number(range[2]||m[2]),end=Number(range[3]||range[1]);
  if(endChapter<Number(m[2]))return null;
  for(let ch=Number(m[2]);ch<=endChapter;ch++) {
   const verses=book[String(ch)];if(!verses)return null;
   const first=ch===Number(m[2])?start:1,last=ch===endChapter?end:Math.max(...Object.keys(verses).map(Number));
   if(last<first||last-first>176)return null;
   for(let v=first;v<=last;v++){if(!verses[String(v)])return null;lines.push(`${endChapter===Number(m[2])?v:ch+':'+v} ${verses[String(v)]}`)}
  }
 }
 return lines.join('\n\n');
}
