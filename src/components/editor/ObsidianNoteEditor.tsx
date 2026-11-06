/**
 * Nodara - Single Area Note Editor
 * Built strictly according to "ATUALIZAÇÃO DA DOCUMENTAÇÃO — NODARA":
 * - Single direct editing area (removed split view / double column typing).
 * - Writing area occupies the maximum screen space available.
 * - Clean, distraction-free toolbar with frequent commands.
 * - Interactive [[Internal Links]] navigation and auto-suggestions.
 * - Tags (#etiqueta) support.
 * - Optional Preview / Print Modal available on-demand via command, never splitting the screen.
 * - Optional Backlinks drawer closed by default.
 */

import React, { useState, useMemo } from 'react';
import { Note, TraditionalDocument } from '../../types';
import {
  FileText,
  Download,
  Share2,
  Bold,
  Italic,
  Strikethrough,
  List,
  CheckSquare,
  Code,
  Quote,
  Eye,
  X,
  Hash,
  Link2,
  Printer,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { marked } from 'marked';
import { exportNoteToMarkdown } from '../../utils/exportUtils';
import { extractTags, findBacklinks } from '../../utils/linkUtils';

interface ObsidianNoteEditorProps {
  note: Note;
  allNotes: Note[];
  allDocuments: TraditionalDocument[];
  onUpdate: (updatedNote: Note) => void;
  onOpenItem: (id: string, type: 'note' | 'document') => void;
  onOpenItemByTitle: (title: string) => void;
}

export const ObsidianNoteEditor: React.FC<ObsidianNoteEditorProps> = ({
  note,
  allNotes,
  allDocuments,
  onUpdate,
  onOpenItem,
  onOpenItemByTitle,
}) => {
  // Backlinks panel is CLOSED by default to reduce visual clutter per guidelines
  const [showBacklinks, setShowBacklinks] = useState<boolean>(false);

  // Independent preview modal per Section 3 (never open side-by-side)
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // [[Wikilink]] suggestion
  const [showLinkSuggest, setShowLinkSuggest] = useState<boolean>(false);
  const [suggestQuery, setSuggestQuery] = useState<string>('');

  // Extract tags and backlinks
  const extractedTags = useMemo(() => extractTags(note.content), [note.content]);
  const backlinks = useMemo(
    () => findBacklinks(note.title, note.id, allNotes, allDocuments),
    [note.title, note.id, allNotes, allDocuments]
  );

  // Format markdown with wikilinks
  const renderedHtml = useMemo(() => {
    const preprocessed = note.content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      return `<a href="#wikilink" class="obsidian-wikilink font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 no-underline hover:underline cursor-pointer" data-target="${p1}">[[${p1}]]</a>`;
    });

    try {
      return marked.parse(preprocessed, { breaks: true });
    } catch {
      return preprocessed;
    }
  }, [note.content]);

  // Insert markdown syntax helper
  const insertSyntax = (before: string, after: string = '') => {
    const textarea = document.getElementById('nodara-note-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = note.content.substring(start, end);
    const replacement = `${before}${selected || 'texto'}${after}`;
    const newContent = note.content.substring(0, start) + replacement + note.content.substring(end);

    onUpdate({
      ...note,
      content: newContent,
      tags: extractTags(newContent),
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected.length || 5));
    }, 10);
  };

  // Textarea input handler with [[ suggestion detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    const leftText = val.slice(0, pos);
    const lastDoubleBracket = leftText.lastIndexOf('[[');

    if (lastDoubleBracket !== -1 && !leftText.slice(lastDoubleBracket).includes(']]')) {
      const q = leftText.slice(lastDoubleBracket + 2);
      setSuggestQuery(q);
      setShowLinkSuggest(true);
    } else {
      setShowLinkSuggest(false);
    }

    onUpdate({
      ...note,
      content: val,
      tags: extractTags(val),
    });
  };

  const insertWikiLink = (targetTitle: string) => {
    const textarea = document.getElementById('nodara-note-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const left = note.content.slice(0, pos);
    const lastBracket = left.lastIndexOf('[[');
    if (lastBracket !== -1) {
      const newContent =
        note.content.slice(0, lastBracket) +
        `[[${targetTitle}]]` +
        note.content.slice(pos);

      onUpdate({
        ...note,
        content: newContent,
        tags: extractTags(newContent),
      });
      setShowLinkSuggest(false);
    }
  };

  // Link suggestions
  const linkSuggestions = useMemo(() => {
    const q = suggestQuery.toLowerCase();
    const items: { id: string; title: string; type: 'note' | 'document' }[] = [];
    allNotes.forEach(n => {
      if (n.id !== note.id && !n.isDeleted && n.title.toLowerCase().includes(q)) {
        items.push({ id: n.id, title: n.title, type: 'note' });
      }
    });
    allDocuments.forEach(d => {
      if (!d.isDeleted && d.title.toLowerCase().includes(q)) {
        items.push({ id: d.id, title: d.title, type: 'document' });
      }
    });
    return items.slice(0, 8);
  }, [allNotes, allDocuments, note.id, suggestQuery]);

  const readingTimeMinutes = Math.max(1, Math.ceil(note.wordCount / 200));

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-900 overflow-hidden select-text">
      {/* CLEAN COMPACT TOOLBAR (Prioritizes Writing Canvas) */}
      <div className="no-print bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10">
        {/* Formatting commands */}
        <div className="flex items-center flex-wrap gap-1">
          <button
            onClick={() => insertSyntax('**', '**')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Negrito (**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax('*', '*')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Itálico (*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax('~~', '~~')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Tachado (~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 mx-1" />

          <button
            onClick={() => insertSyntax('\n## ')}
            className="px-2 py-1 text-xs font-semibold rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Título (##)"
          >
            H2
          </button>
          <button
            onClick={() => insertSyntax('\n### ')}
            className="px-2 py-1 text-xs font-semibold rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Subtítulo (###)"
          >
            H3
          </button>
          <button
            onClick={() => insertSyntax('\n- ')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Lista com marcadores (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax('\n- [ ] ')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Checklist / Tarefa (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          </button>
          <button
            onClick={() => insertSyntax('> ')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Citação (>)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax('```typescript\n', '\n```')}
            className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            title="Bloco de Código"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSyntax('[[', ']]')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 dark:border-emerald-800"
            title="Inserir Conexão [[Nota]]"
          >
            <Link2 className="w-3 h-3" />
            [[Link]]
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center gap-2">
          {/* Independent Preview Command (Modal per Section 3) */}
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition-colors"
            title="Visualização de Leitura / Impressão"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            Visualizar
          </button>

          {/* Optional Backlinks Panel Toggle */}
          <button
            onClick={() => setShowBacklinks(!showBacklinks)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showBacklinks
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
            title="Conexões e referências a esta nota"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Links ({backlinks.length})</span>
          </button>

          {/* Export .md */}
          <button
            onClick={() => exportNoteToMarkdown(note)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium shadow-sm transition-colors"
            title="Exportar arquivo Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>
        </div>
      </div>

      {/* SINGLE EDITING CANVAS (Occupies maximum available space) */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-stone-950 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col flex-1">
            {/* Note Title Input */}
            <input
              type="text"
              value={note.title}
              onChange={e => onUpdate({ ...note, title: e.target.value })}
              className="text-3xl font-bold text-stone-900 dark:text-white bg-transparent focus:outline-none border-b border-transparent focus:border-stone-300 dark:focus:border-stone-700 pb-2 mb-4"
              placeholder="Título da Nota..."
            />

            {/* Tag chips and subtle word counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400 mb-6 pb-3 border-b border-stone-100 dark:border-stone-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                {extractedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {extractedTags.length === 0 && (
                  <span className="text-stone-400 text-[11px] italic">
                    Adicione tags usando <code className="text-amber-600 dark:text-amber-400">#etiqueta</code>
                  </span>
                )}
              </div>

              <div className="font-mono text-[11px] text-stone-400">
                {note.wordCount} palavras • ~{readingTimeMinutes} min de leitura
              </div>
            </div>

            {/* SINGLE DIRECT EDITING TEXTAREA (NO SPLIT SCREEN) */}
            <textarea
              id="nodara-note-textarea"
              value={note.content}
              onChange={handleContentChange}
              placeholder="Redija suas anotações aqui... Use [[Nome da Nota]] para conectar conteúdos."
              className="flex-1 w-full bg-transparent text-stone-800 dark:text-stone-100 font-sans text-base leading-relaxed resize-none focus:outline-none min-h-[500px]"
            />
          </div>

          {/* WIKILINK AUTO-SUGGEST POPUP */}
          {showLinkSuggest && (
            <div className="absolute left-24 top-28 bg-stone-900 text-stone-100 border border-stone-700 rounded-2xl shadow-2xl p-2 w-72 z-30 animate-in fade-in zoom-in-95">
              <div className="text-[10px] uppercase font-bold text-stone-400 px-2 py-1 border-b border-stone-800">
                Conectar a uma nota ou documento:
              </div>
              <div className="max-h-48 overflow-y-auto mt-1 flex flex-col gap-0.5">
                {linkSuggestions.length === 0 ? (
                  <div className="text-xs text-stone-500 px-2 py-2">
                    Nenhum item existente. Digite o título e feche com ]] para criar nova referência.
                  </div>
                ) : (
                  linkSuggestions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => insertWikiLink(item.title)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] text-stone-500 uppercase ml-2">
                        {item.type === 'note' ? '.md' : 'Word AST'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPTIONAL RETRACTABLE BACKLINKS PANEL (Closed by default) */}
        {showBacklinks && (
          <aside className="w-72 shrink-0 border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 flex flex-col overflow-y-auto shadow-sm animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                Backlinks ({backlinks.length})
              </div>
              <button
                onClick={() => setShowBacklinks(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {backlinks.length === 0 ? (
              <div className="text-xs text-stone-400 py-6 text-center italic">
                Nenhum outro documento cita esta nota com <code className="text-[10px]">[[{note.title}]]</code> no momento.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {backlinks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => onOpenItem(b.id, b.type)}
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 hover:border-emerald-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800 dark:text-stone-200">
                      <span className="truncate">{b.title}</span>
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 uppercase">
                      {b.type === 'note' ? 'Nota' : 'Documento Word'}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 italic font-mono bg-white dark:bg-stone-950 p-1.5 rounded border border-stone-100 dark:border-stone-800">
                      {b.snippet}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* INDEPENDENT PREVIEW / READING MODAL (Section 3: Accessible on demand, not persistent) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-stone-800 dark:text-stone-100">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-sm">Visualização de Leitura / Impressão</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="p-8 overflow-y-auto prose dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
