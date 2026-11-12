import React, { useState, useEffect } from 'react';
import { Highlighter, MessageSquare, Plus, Check } from 'lucide-react';

interface SelectionToolbarProps {
  onAddHighlight: (selectedText: string, color: string, note?: string) => void;
  onAddComment: (selectedText: string, content: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const HIGHLIGHT_PRESETS = [
  { name: 'Amarelo', hex: '#fef08a' },
  { name: 'Verde', hex: '#bbf7d0' },
  { name: 'Azul', hex: '#bae6fd' },
  { name: 'Rosa', hex: '#fbcfe8' },
  { name: 'Laranja', hex: '#fed7aa' },
];

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  onAddHighlight,
  onAddComment,
  containerRef,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');
  const [showHighlightPalette, setShowHighlightPalette] = useState<boolean>(false);

  useEffect(() => {
    const handleMouseUp = () => {
      // Delay slightly to let selection finalize
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          if (!showCommentForm) {
            setPosition(null);
            setSelectedText('');
          }
          return;
        }

        const text = selection.toString().trim();
        if (text.length < 2) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Check if inside container
        if (containerRef.current && !containerRef.current.contains(range.commonAncestorContainer)) {
          return;
        }

        setSelectedText(text);
        setPosition({
          top: Math.max(10, rect.top - 46),
          left: Math.max(10, rect.left + rect.width / 2 - 100),
        });
      }, 50);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, showCommentForm]);

  const handleApplyHighlight = (color: string) => {
    if (!selectedText) return;
    onAddHighlight(selectedText, color);
    setPosition(null);
    setShowHighlightPalette(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedText) return;
    onAddComment(selectedText, commentInput.trim());
    setCommentInput('');
    setShowCommentForm(false);
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 50,
      }}
      className="animate-in fade-in zoom-in-95 duration-150 shadow-xl"
    >
      {!showCommentForm ? (
        <div className="flex items-center gap-1 bg-stone-900 text-white rounded-lg p-1 text-xs border border-stone-700 shadow-2xl backdrop-blur-xs">
          {/* Highlight Color Palette Trigger */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowHighlightPalette(!showHighlightPalette)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-800 text-amber-300 font-medium transition-colors"
              title="Marcar / Realçar texto selecionado"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Realçar</span>
            </button>

            {showHighlightPalette && (
              <div className="absolute top-full left-0 mt-1.5 p-1.5 bg-stone-900 border border-stone-700 rounded-lg shadow-xl flex items-center gap-1.5">
                {HIGHLIGHT_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handleApplyHighlight(p.hex)}
                    style={{ backgroundColor: p.hex }}
                    className="w-5 h-5 rounded-full hover:scale-110 transition-transform shadow-xs"
                    title={`Marcar em ${p.name}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-stone-700" />

          {/* Comment on Selection Trigger */}
          <button
            onClick={() => setShowCommentForm(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-stone-800 text-blue-300 font-medium transition-colors"
            title="Comentar neste trecho selecionado"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comentar</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmitComment}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3 shadow-2xl w-72 text-xs flex flex-col gap-2"
        >
          <div className="flex items-center justify-between text-stone-500 pb-1 border-b border-stone-100 dark:border-stone-800">
            <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Comentário
            </span>
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          </div>
          <div className="text-[11px] text-stone-500 italic p-1.5 bg-stone-50 dark:bg-stone-800 rounded truncate">
            "{selectedText}"
          </div>
          <textarea
            rows={2}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Adicione seu comentário sobre este trecho..."
            className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded p-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCommentForm(false)}
              className="px-2 py-0.5 text-stone-500 hover:text-stone-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs transition-colors"
            >
              Comentar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
