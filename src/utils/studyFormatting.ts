// Only these two inline HTML pairs are accepted. No raw HTML is enabled.
export function studyFormatting() {
  return (tree: any) => {
    function walk(parent: any) {
      if (!parent.children) return;
      for (const child of parent.children) walk(child);
      const out: any[] = [], stack: any[] = [];
      for (const child of parent.children) {
        const tag = child.type === 'html' && /^<(u|mark)>$/.exec(child.value);
        const close = child.type === 'html' && /^<\/(u|mark)>$/.exec(child.value);
        if (tag) { const node = {type:'studyFormat', data:{hName:tag[1]}, children:[]}; (stack.length ? stack[stack.length-1].children : out).push(node); stack.push(node); }
        else if (close && stack.length && stack[stack.length-1].data.hName === close[1]) stack.pop();
        else (stack.length ? stack[stack.length-1].children : out).push(child);
      }
      parent.children = out;
    }
    walk(tree);
  };
}
