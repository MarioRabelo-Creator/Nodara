/**
 * Global Search Modal (Ctrl+K / Cmd+K)
 * Realtime search across titles, contents, and tags
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, Layers, Hash, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Note, TraditionalDocument } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  documents: TraditionalDocument[];
  onOpenItem: (id: string, type: 'note' | 'document') => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  notes,
  documents,
  onOpenItem,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'note' | 'document'>('all');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedNotes = notes
      .filter(n => !n.isDeleted)
      .filter(n => {
        if (filterType === 'document') return false;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q))
        );
      })
      .map(n => ({
        id: n.id,
        type: 'note' as const,
        title: n.title,
        tags: n.tags,
        snippet: n.content.substring(0, 120).replace(/\n/g, ' '),
      }));

    const matchedDocs = documents
      .filter(d => !d.isDeleted)
      .filter(d => {
        if (filterType === 'note') return false;
        let fullText = d.title;
        d.ast.nodes.forEach(node => {
          if ((node as any).text) fullText += ' ' + (node as any).text;
        });
        return fullText.toLowerCase().includes(q);
      })
      .map(d => ({
        id: d.id,
        type: 'document' as const,
        title: d.title,
        tags: [],
        snippet: 'Documento tradicional estruturado em páginas A4.',
      }));

    return [...matchedNotes, ...matchedDocs];
  }, [query, filterType, notes, documents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-20 animate-in fade-in duration-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Pesquise por títulos, conteúdos ou #etiquetas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-stone-950/60 border-b border-stone-800/80 flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => setFilterType('note')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'note'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Notas Markdown (.md)
          </button>
          <button
            onClick={() => setFilterType('document')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterType === 'document'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Documentos Word (AST)
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-1">
          {query.trim() === '' ? (
            <div className="text-center py-12 text-xs text-stone-500">
              Digite termos para localizar notas, documentos e referências.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-xs text-stone-400">
              Nenhum item encontrado para "{query}".
            </div>
          ) : (
            results.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onOpenItem(item.id, item.type);
                  onClose();
                }}
                className="group p-3 rounded-2xl hover:bg-stone-800/80 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-start gap-3 truncate">
                  {item.type === 'note' ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-semibold text-stone-200 group-hover:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate mt-0.5">
                      {item.snippet}
                    </div>
                  </div>
                </div>

                <CornerDownLeft className="w-4 h-4 text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
