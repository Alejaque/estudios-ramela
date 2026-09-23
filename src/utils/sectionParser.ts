export interface ParsedSections {
  section1: string;
  section2: string;
  section3: string;
  section4: string;
  preamble: string;
}

export function parseBiblicalStudySections(fullText: string): ParsedSections {
  const result: ParsedSections = {
    section1: '',
    section2: '',
    section3: '',
    section4: '',
    preamble: '',
  };

  if (!fullText) return result;

  // Regex patterns to find section headers
  const s1Regex = /###?\s*(?:1[.)]\s*)?[📖\s]*Contexto[,\s]+Ex[ée]gesis/i;
  const s2Regex = /###?\s*(?:2[.)]\s*)?[📝\s]*Bosquejo\s+Expositivo/i;
  const s3Regex = /###?\s*(?:3[.)]\s*)?[🌱\s]*Aplicaci[óo]n\s+Pr[áa]ctica/i;
  const s4Regex = /###?\s*(?:4[.)]\s*)?[🎯\s]*Llamado\s+a\s+la\s+Acci[óo]n/i;

  const s1Match = fullText.search(s1Regex);
  const s2Match = fullText.search(s2Regex);
  const s3Match = fullText.search(s3Regex);
  const s4Match = fullText.search(s4Regex);

  // If standard headers are not found, return full text in preamble
  if (s1Match === -1 && s2Match === -1 && s3Match === -1 && s4Match === -1) {
    result.preamble = fullText;
    return result;
  }

  // Preamble before section 1
  if (s1Match > 0) {
    result.preamble = fullText.slice(0, s1Match).trim();
  }

  // Section 1
  if (s1Match !== -1) {
    const end = s2Match !== -1 ? s2Match : (s3Match !== -1 ? s3Match : (s4Match !== -1 ? s4Match : fullText.length));
    result.section1 = fullText.slice(s1Match, end).trim();
  }

  // Section 2
  if (s2Match !== -1) {
    const end = s3Match !== -1 ? s3Match : (s4Match !== -1 ? s4Match : fullText.length);
    result.section2 = fullText.slice(s2Match, end).trim();
  }

  // Section 3
  if (s3Match !== -1) {
    const end = s4Match !== -1 ? s4Match : fullText.length;
    result.section3 = fullText.slice(s3Match, end).trim();
  }

  // Section 4
  if (s4Match !== -1) {
    result.section4 = fullText.slice(s4Match).trim();
  }

  return result;
}
