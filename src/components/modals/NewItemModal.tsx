/**
 * New Item Creation Modal
 * Supports creating:
 * - Note (.md)
 * - Traditional Document (AST)
 * - Notebook
 * - Folder
 */

import React, { useState } from 'react';
import { FileText, Layers, FolderPlus, BookOpen, X } from 'lucide-react';
import { Workspace, Notebook, Folder, ContentType } from '../../types';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ContentType | 'notebook' | 'folder';
  initialNotebookId?: string;
  initialFolderId?: string | null;
  workspaces: Workspace[];
  notebooks: Notebook[];
  folders: Folder[];
  onCreateNote: (notebookId: string, folderId: string | null, title: string) => void;
  onCreateDocument: (notebookId: string, folderId: string | null, title: string) => void;
  onCreateNotebook: (workspaceId: string, name: string) => void;
  onCreateFolder: (notebookId: string, parentFolderId: string | null, name: string) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  initialType = 'note',
  initialNotebookId,
  initialFolderId = null,
  workspaces,
  notebooks,
  folders,
  onCreateNote,
  onCreateDocument,
  onCreateNotebook,
  onCreateFolder,
}) => {
  const [itemType, setItemType] = useState<ContentType | 'notebook' | 'folder'>(initialType);
  const [title, setTitle] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState(
    initialNotebookId || notebooks[0]?.id || ''
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id || '');

  if (!isOpen) return null;

  const notebookFolders = folders.filter(f => f.notebookId === selectedNotebookId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (itemType === 'note') {
      onCreateNote(selectedNotebookId, selectedFolderId, title.trim());
    } else if (itemType === 'document') {
      onCreateDocument(selectedNotebookId, selectedFolderId, title.trim());
    } else if (itemType === 'notebook') {
      onCreateNotebook(selectedWorkspaceId, title.trim());
    } else if (itemType === 'folder') {
      onCreateFolder(selectedNotebookId, selectedFolderId, title.trim());
    }

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Criar Novo Conteúdo</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Item Type Picker */}
          <div>
            <label className="font-semibold text-stone-300 block mb-1.5">Tipo de Elemento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('note')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  itemType === 'note'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Nota (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('document')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  itemType === 'document'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Doc Word (AST)</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('notebook')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  itemType === 'notebook'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Caderno</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('folder')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  itemType === 'folder'
                    ? 'bg-amber-600/20 border-amber-500 text-white font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>Pasta</span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="font-semibold text-stone-300 block mb-1">Nome / Título</label>
            <input
              autoFocus
              type="text"
              placeholder={
                itemType === 'note'
                  ? 'Ex: Anotações da Reunião'
                  : itemType === 'document'
                  ? 'Ex: Relatório Técnico Anual'
                  : itemType === 'notebook'
                  ? 'Ex: Projetos Estratégicos'
                  : 'Ex: Documentos Finais'
              }
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Workspace select (if notebook) */}
          {itemType === 'notebook' && (
            <div>
              <label className="font-semibold text-stone-300 block mb-1">Espaço de Trabalho</label>
              <select
                value={selectedWorkspaceId}
                onChange={e => setSelectedWorkspaceId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notebook & Folder select (if note, document, or folder) */}
          {itemType !== 'notebook' && (
            <>
              <div>
                <label className="font-semibold text-stone-300 block mb-1">Caderno de Destino</label>
                <select
                  value={selectedNotebookId}
                  onChange={e => {
                    setSelectedNotebookId(e.target.value);
                    setSelectedFolderId(null);
                  }}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none"
                >
                  {notebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}
                    </option>
                  ))}
                </select>
              </div>

              {itemType !== 'folder' && (
                <div>
                  <label className="font-semibold text-stone-300 block mb-1">
                    Pasta Opcional (Nested)
                  </label>
                  <select
                    value={selectedFolderId || ''}
                    onChange={e => setSelectedFolderId(e.target.value || null)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:outline-none"
                  >
                    <option value="">Raiz do Caderno (Sem pasta)</option>
                    {notebookFolders.map(f => (
                      <option key={f.id} value={f.id}>
                        Pasta: {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-semibold shadow-md shadow-indigo-900/30"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
