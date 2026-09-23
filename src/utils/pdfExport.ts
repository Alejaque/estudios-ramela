import { jsPDF } from 'jspdf';

interface ExportPdfOptions {
  passageOrTopic: string;
  translation?: string;
  content: string;
  personalNotes?: string;
}

export function exportStudyToPdf({
  passageOrTopic,
  translation = 'Reina-Valera 1960 (RVR1960)',
  content,
  personalNotes,
}: ExportPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      cursorY = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top subtle running header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 155);
    doc.text('ESTUDIOS ALEJANDRO RAMELA • EXÉGESIS & HOMILÉTICA EXPOSITIVA', margin, 11);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 13, pageWidth - margin, 13);
  };

  // First page banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(margin, cursorY, contentWidth, 26, 3, 3, 'F');

  doc.setTextColor(251, 191, 36); // Amber 400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PLATAFORMA TEOLÓGICA • BOSQUEJO PARA EL PÚLPITO', margin + 6, cursorY + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('Estudios Alejandro Ramela', margin + 6, cursorY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin - 6, cursorY + 16, { align: 'right' });

  cursorY += 32;

  // Title Box: Passage and Translation
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(passageOrTopic, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 7;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Texto base: ${translation} • Enfoque: Histórico-Gramatical y Homilético`, margin, cursorY);
  cursorY += 4;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 7;

  // Clean Markdown parsing for PDF
  // Strip heavy markdown tokens while preserving structure and bullets
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      cursorY += 3;
      continue;
    }

    // Section 1 / 2 / 3 / 4 Major Headings
    if (line.startsWith('# ')) {
      checkPageBreak(18);
      cursorY += 4;
      doc.setFillColor(30, 58, 138); // Blue 900
      doc.roundedRect(margin, cursorY - 3.5, contentWidth, 8, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const headingText = line.replace(/^#\s+/, '').replace(/\*\*/g, '');
      doc.text(headingText, margin + 4, cursorY + 2.5);
      cursorY += 9;
      continue;
    }

    // H2 Headings
    if (line.startsWith('## ')) {
      checkPageBreak(14);
      cursorY += 3;
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(margin, cursorY - 3, contentWidth, 7, 1, 1, 'F');
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const headingText = line.replace(/^##\s+/, '').replace(/\*\*/g, '');
      doc.text(headingText, margin + 3, cursorY + 2);
      cursorY += 8;
      continue;
    }

    // H3 Headings
    if (line.startsWith('### ')) {
      checkPageBreak(10);
      doc.setTextColor(180, 83, 9); // Amber 700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const headingText = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
      const wrapped = doc.splitTextToSize(headingText, contentWidth);
      doc.text(wrapped, margin, cursorY);
      cursorY += wrapped.length * 4.5 + 1;
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      checkPageBreak(8);
      const isNumbered = /^\d+\.\s/.test(line);
      const bulletPrefix = isNumbered ? line.match(/^\d+\.\s/)?.[0] || '• ' : '• ';
      const cleanText = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*\*/g, '');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138); // Bullet in dark blue
      doc.text(bulletPrefix, margin + 2, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const textLines = doc.splitTextToSize(cleanText, contentWidth - 8);
      doc.text(textLines, margin + 7, cursorY);
      cursorY += textLines.length * 4.2 + 1;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      checkPageBreak(10);
      const quoteText = line.replace(/^>\s*/, '').replace(/\*\*/g, '');
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(margin, cursorY - 2, 2, 6, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 53, 15); // Amber 900
      const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 6);
      doc.text(quoteLines, margin + 5, cursorY + 2);
      cursorY += quoteLines.length * 4.2 + 2;
      continue;
    }

    // Standard body text
    checkPageBreak(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const cleanBody = line.replace(/\*\*/g, '');
    const bodyLines = doc.splitTextToSize(cleanBody, contentWidth);
    doc.text(bodyLines, margin, cursorY);
    cursorY += bodyLines.length * 4.2 + 1.5;
  }

  // Personal Notes section if available
  if (personalNotes && personalNotes.trim()) {
    checkPageBreak(25);
    cursorY += 6;
    doc.setFillColor(254, 243, 199); // Light amber
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(margin, cursorY, contentWidth, 10, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('NOTAS Y REFLEXIONES PERSONALES DEL EXPOSITOR', margin + 5, cursorY + 6.5);
    cursorY += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(personalNotes.trim(), contentWidth);
    for (let i = 0; i < noteLines.length; i++) {
      checkPageBreak(5);
      doc.text(noteLines[i], margin, cursorY);
      cursorY += 4.5;
    }
  }

  // Add running footers with total page count
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.text('Estudios Bíblicos Alejandro Ramela • Preparado para ministerio y púlpito', margin, pageHeight - 7);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Sanitize filename
  const cleanPassage = passageOrTopic
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ]+/gi, '_')
    .slice(0, 40);
  const fileName = `Estudio_Alejandro_Ramela_${cleanPassage}.pdf`;

  doc.save(fileName);
}
