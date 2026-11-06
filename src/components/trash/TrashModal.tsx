/**
 * Trash Bin (Section 6.1)
 * View soft-deleted items, restore back to hierarchy, or purge permanently.
 */

import React from 'react';
import { Trash2, RotateCcw, FileText, Layers, AlertCircle, X } from 'lucide-react';
import { Note, TraditionalDocument } from '../../types';

interface TrashModalProps {
  notes: Note[];
  documents: TraditionalDocument[];
  onRestoreItem: (id: string, type: 'note' | 'document') => void;
  onPermanentlyDeleteItem: (id: string, type: 'note' | 'document') => void;
  onEmptyTrash: () => void;
  onClose?: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  notes,
  documents,
  onRestoreItem,
  onPermanentlyDeleteItem,
  onEmptyTrash,
  onClose,
}) => {
  const trashedNotes = notes.filter(n => n.isDeleted);
  const trashedDocs = documents.filter(d => d.isDeleted);
  const totalTrash = trashedNotes.length + trashedDocs.length;

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950 p-6 md:p-8 select-text">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-white">
                Lixeira de Conteúdos
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {totalTrash === 0
                  ? 'A lixeira está vazia.'
                  : `${totalTrash} item(ns) aguardando restauração ou exclusão permanente.`}
              </p>
            </div>
          </div>

          {totalTrash > 0 && (
            <button
              onClick={onEmptyTrash}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              Esvaziar Lixeira
            </button>
          )}
        </div>

        {/* Trashed items list */}
        {totalTrash === 0 ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center text-stone-400">
            <Trash2 className="w-12 h-12 stroke-1 text-stone-300 dark:text-stone-700 mb-3" />
            <div className="font-semibold text-sm text-stone-600 dark:text-stone-300">
              Nenhum item excluído
            </div>
            <p className="text-xs mt-1 max-w-sm text-stone-400">
              Quando você excluir uma nota ou documento, ele permanecerá seguro aqui até que você decida restaurá-lo.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 shadow-sm text-xs">
            {trashedNotes.map(note => (
              <div
                key={note.id}
                className="p-4 flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {note.title}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Nota Markdown (.md) • Excluída em{' '}
                      {note.deletedAt ? new Date(note.deletedAt).toLocaleString() : 'Recentemente'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => onRestoreItem(note.id, 'note')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    Restaurar
                  </button>
                  <button
                    onClick={() => onPermanentlyDeleteItem(note.id, 'note')}
                    className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-500 transition-colors"
                    title="Excluir Permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {trashedDocs.map(doc => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Documento Tradicional Word (AST) • Excluído em{' '}
                      {doc.deletedAt ? new Date(doc.deletedAt).toLocaleString() : 'Recentemente'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => onRestoreItem(doc.id, 'document')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    Restaurar
                  </button>
                  <button
                    onClick={() => onPermanentlyDeleteItem(doc.id, 'document')}
                    className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-500 transition-colors"
                    title="Excluir Permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
