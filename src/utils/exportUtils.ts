/**
 * Export utilities for Traditional Documents and Notes
 * Supports:
 * - Word (.docx compatible HTML/XML blob)
 * - Markdown (.md)
 * - JSON / AST
 * - Print / PDF trigger
 */

import { TraditionalDocument, Note } from '../types';

export function exportDocumentToWordDoc(doc: TraditionalDocument): void {
  const { ast } = doc;
  const isLandscape = ast.pageConfig.orientation === 'landscape';

  let bodyContent = '';

  // Table of Contents
  const headings = ast.nodes.filter(n => n.type === 'heading') as any[];
  const hasToc = ast.nodes.some(n => n.type === 'table_of_contents');

  if (hasToc && headings.length > 0) {
    bodyContent += `
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <h3 style="margin-top:0; color:#1e293b; font-family: Calibri, sans-serif;">Sumário</h3>
        <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
          ${headings
            .map(
              h => `
            <li style="margin-left: ${(h.level - 1) * 20}px;">
              <span style="color:#0284c7; text-decoration: underline;">${h.text}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>
    `;
  }

  // Render nodes
  ast.nodes.forEach(node => {
    switch (node.type) {
      case 'heading': {
        const sizeMap: Record<number, string> = {
          1: '24pt',
          2: '18pt',
          3: '14pt',
          4: '12pt',
          5: '11pt',
          6: '10pt',
        };
        const fontSize = sizeMap[node.level] || '16pt';
        bodyContent += `<h${node.level} style="font-family: Calibri, 'Times New Roman', serif; font-size: ${fontSize}; color: #0f172a; margin-top: 20px; margin-bottom: 8px; text-align: ${node.alignment || 'left'};">${node.text}</h${node.level}>`;
        break;
      }
      case 'paragraph': {
        bodyContent += `<p style="font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.5; color: #1e293b; margin-bottom: 12px; text-align: ${node.alignment || 'justify'}; text-indent: 1.25cm;">${node.text}</p>`;
        break;
      }
      case 'callout': {
        const bgColors = {
          info: '#e0f2fe',
          warning: '#fef3c7',
          tip: '#dcfce7',
          quote: '#f1f5f9',
        };
        const borderColors = {
          info: '#0284c7',
          warning: '#d97706',
          tip: '#16a34a',
          quote: '#64748b',
        };
        bodyContent += `
          <div style="background-color: ${bgColors[node.variant]}; border-left: 4px solid ${borderColors[node.variant]}; padding: 12px 16px; margin: 16px 0; font-family: Calibri, sans-serif; font-size: 11pt;">
            ${node.title ? `<strong style="display:block; margin-bottom: 4px; color: #0f172a;">${node.title}</strong>` : ''}
            <div>${node.text}</div>
          </div>
        `;
        break;
      }
      case 'table': {
        bodyContent += `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Calibri, sans-serif; font-size: 10pt;">
            ${node.caption ? `<caption style="caption-side: top; text-align: left; font-weight: bold; margin-bottom: 6px; font-size: 10pt; color: #475569;">${node.caption}</caption>` : ''}
            <thead>
              <tr style="background-color: #f1f5f9;">
                ${node.headers.map(h => `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: 600; color: #1e293b;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${node.rows
                .map(
                  (row, rIdx) => `
                <tr style="background-color: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  ${row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #334155;">${cell}</td>`).join('')}
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        `;
        break;
      }
      case 'page_break': {
        bodyContent += `<br clear="all" style="page-break-before: always; mso-special-character: line-break;" />`;
        break;
      }
      case 'footnote': {
        bodyContent += `
          <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 24px; font-size: 9pt; color: #64748b; font-family: Calibri, sans-serif;">
            <sup>[${node.number}]</sup> ${node.text}
          </div>
        `;
        break;
      }
      default:
        break;
    }
  });

  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${doc.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: ${isLandscape ? '297mm 210mm' : '210mm 297mm'};
            margin: ${ast.pageConfig.margins.top}mm ${ast.pageConfig.margins.right}mm ${ast.pageConfig.margins.bottom}mm ${ast.pageConfig.margins.left}mm;
            mso-header: h1;
            mso-footer: f1;
          }
          div.Section1 { page: Section1; }
          p.MsoHeader, p.MsoFooter { font-family: Calibri, sans-serif; font-size: 9pt; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- Header -->
          <div style="mso-element:header" id="h1">
            <p class="MsoHeader" style="text-align: ${ast.pageConfig.headerAlignment}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              ${ast.pageConfig.headerText || doc.title}
            </p>
          </div>
          
          ${bodyContent}

          <!-- Footer -->
          <div style="mso-element:footer" id="f1">
            <p class="MsoFooter" style="text-align: ${ast.pageConfig.footerAlignment}; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              ${ast.pageConfig.footerText || ''} | Página <span style='mso-field-code: PAGE '></span> de <span style='mso-field-code: NUMPAGES '></span>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDoc], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDocumentToJSON(doc: TraditionalDocument): void {
  const jsonStr = JSON.stringify(doc.ast, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_ast.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportNoteToMarkdown(note: Note): void {
  const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrintDialog(): void {
  window.print();
}
