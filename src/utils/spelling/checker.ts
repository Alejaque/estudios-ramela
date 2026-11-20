import {aff,dic} from './dictionary';
import NSpell from './engine.js';
export interface SpanishChecker {correct:(word:string)=>boolean;suggest:(word:string)=>string[];add:(word:string)=>void}
const checker:SpanishChecker = new NSpell({aff,dic});
// Common local forms and study vocabulary missing from this dictionary revision.
for(const word of ['podés','exégesis','exegético','exegética','homilética','homilético','HaDavar','RVR','Ramela']) checker.add(word);
export default checker;
