/**
 * Hierarchical Nested Sidebar (Section 3 & 5.2)
 * Workspaces -> Notebooks -> Folders -> Notes (.md) & Traditional Documents (AST)
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Layers,
  ChevronRight,
  ChevronDown,
  Star,
  Plus,
  Trash2,
  Share2,
  HardDrive,
  LayoutDashboard,
  Search,
  RefreshCw,
  MoreVertical,
  Edit2,
  FolderPlus,
  CornerDownRight
} from 'lucide-react';
import {
  Workspace,
  Notebook,
  Folder as FolderType,
  Note,
  TraditionalDocument,
  ActiveView
} from '../../types';

interface SidebarProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  notebooks: Notebook[];
  folders: FolderType[];
  notes: Note[];
  documents: TraditionalDocument[];
  activeView: ActiveView;
  activeItemId?: string;
  onSelectView: (view: ActiveView) => void;
  onOpenItem: (id: string, type: 'note' | 'document') => void;
  onNewItemClick: (notebookId: string, folderId: string | null, type: 'note' | 'document') => void;
  onNewFolderClick: (notebookId: string, parentFolderId: string | null) => void;
  onDeleteItem: (id: string, type: 'note' | 'document') => void;
  onToggleFavorite: (id: string, type: 'note' | 'document') => void;
  trashCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
  notebooks,
  folders,
  notes,
  documents,
  activeView,
  activeItemId,
  onSelectView,
  onOpenItem,
  onNewItemClick,
  onNewFolderClick,
  onDeleteItem,
  onToggleFavorite,
  trashCount,
  isOpen,
}) => {
  // Collapsible state for notebooks and folders
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({
    nb_arch: true,
    nb_docs: true,
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    fld_sync: true,
    fld_editor: true,
    fld_specs: true,
  });

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items belonging to the selected workspace
  const workspaceNotebooks = notebooks.filter(nb => nb.workspaceId === selectedWorkspaceId);

  // Active (non-deleted) items
  const activeNotes = notes.filter(n => !n.isDeleted);
  const activeDocs = documents.filter(d => !d.isDeleted);

  // Favorites
  const favorites = [
    ...activeNotes.filter(n => n.isFavorite).map(n => ({ ...n, itemType: 'note' as const })),
    ...activeDocs.filter(d => d.isFavorite).map(d => ({ ...d, itemType: 'document' as const })),
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-72 shrink-0 bg-stone-900 border-r border-stone-800 text-stone-300 flex flex-col h-full select-none z-30">
      {/* WORKSPACE SELECTOR */}
      <div className="p-3 border-b border-stone-800/80 bg-stone-950/60">
        <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-1 mb-1 block">
          Espaço de Trabalho
        </label>
        <select
          value={selectedWorkspaceId}
          onChange={e => onSelectWorkspace(e.target.value)}
          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* QUICK SYSTEM NAVIGATION (Section 5.2) */}
      <div className="p-2 border-b border-stone-800/80 flex flex-col gap-0.5 text-xs font-medium">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
            activeView === 'dashboard'
              ? 'bg-indigo-600 text-white font-semibold shadow-md'
              : 'hover:bg-stone-800/60 text-stone-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-400" />
          <span>Dashboard Geral</span>
        </button>


        <button
          onClick={() => onSelectView('architecture')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
            activeView === 'architecture'
              ? 'bg-blue-600 text-white font-semibold shadow-md'
              : 'hover:bg-stone-800/60 text-stone-300'
          }`}
        >
          <HardDrive className="w-4 h-4 text-blue-400" />
          <span>Arquitetura & DER (Seção 15)</span>
        </button>

        <button
          onClick={() => onSelectView('trash')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
            activeView === 'trash'
              ? 'bg-stone-800 text-white font-semibold'
              : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-stone-400" />
            <span>Lixeira</span>
          </div>
          {trashCount > 0 && (
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded-full font-mono">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* FAVORITES (Section 5.2 - Item 1) */}
      {favorites.length > 0 && (
        <div className="p-3 border-b border-stone-800/80">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              Favoritos
            </span>
            <span className="font-mono text-stone-600">{favorites.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {favorites.map(fav => (
              <button
                key={fav.id}
                onClick={() => onOpenItem(fav.id, fav.itemType)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left w-full truncate ${
                  activeItemId === fav.id
                    ? 'bg-stone-800 text-white font-medium'
                    : 'text-stone-300 hover:bg-stone-800/50'
                }`}
              >
                {fav.itemType === 'note' ? (
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
                <span className="truncate">{fav.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NESTED TREE (Section 3 & Section 5.2 - Item 2) */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider px-1">
          Cadernos & Pastas
        </div>

        {workspaceNotebooks.length === 0 ? (
          <div className="text-xs text-stone-500 italic p-3 text-center">
            Nenhum caderno criado neste espaço.
          </div>
        ) : (
          workspaceNotebooks.map(nb => {
            const isNbExpanded = !!expandedNotebooks[nb.id];
            const nbFolders = folders.filter(f => f.notebookId === nb.id && !f.parentFolderId);
            const nbNotesRoot = activeNotes.filter(n => n.notebookId === nb.id && !n.folderId);
            const nbDocsRoot = activeDocs.filter(d => d.notebookId === nb.id && !d.folderId);

            return (
              <div key={nb.id} className="flex flex-col gap-0.5">
                {/* Notebook Header */}
                <div className="group flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-800/60 text-xs font-semibold text-stone-200 transition-colors">
                  <div
                    onClick={() => toggleNotebook(nb.id)}
                    className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                  >
                    {isNbExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    )}
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nb.color || '#6366f1' }} />
                    <span className="truncate">{nb.name}</span>
                  </div>

                  {/* Action buttons on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={() => onNewItemClick(nb.id, null, 'note')}
                      className="p-1 hover:text-emerald-400 rounded hover:bg-stone-700"
                      title="Nova Nota neste caderno"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => onNewFolderClick(nb.id, null)}
                      className="p-1 hover:text-amber-400 rounded hover:bg-stone-700"
                      title="Nova Pasta neste caderno"
                    >
                      <FolderPlus className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* Notebook Content (Folders + Root Items) */}
                {isNbExpanded && (
                  <div className="ml-3 pl-2 border-l border-stone-800 flex flex-col gap-0.5 mt-1">
                    {/* Folders */}
                    {nbFolders.map(fld => {
                      const isFldExpanded = !!expandedFolders[fld.id];
                      const fldNotes = activeNotes.filter(n => n.folderId === fld.id);
                      const fldDocs = activeDocs.filter(d => d.folderId === fld.id);

                      return (
                        <div key={fld.id} className="flex flex-col gap-0.5">
                          <div className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/40 text-xs text-stone-300">
                            <div
                              onClick={() => toggleFolder(fld.id)}
                              className="flex items-center gap-1.5 flex-1 cursor-pointer truncate"
                            >
                              {isFldExpanded ? (
                                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className="truncate">{fld.name}</span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={() => onNewItemClick(nb.id, fld.id, 'note')}
                                className="p-0.5 hover:text-emerald-400"
                                title="Nova Nota nesta pasta"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => onNewItemClick(nb.id, fld.id, 'document')}
                                className="p-0.5 hover:text-blue-400"
                                title="Novo Documento nesta pasta"
                              >
                                <Plus className="w-3 h-3 text-blue-400" />
                              </button>
                            </div>
                          </div>

                          {/* Folder Items */}
                          {isFldExpanded && (
                            <div className="ml-3 pl-2 border-l border-stone-800/80 flex flex-col gap-0.5">
                              {fldNotes.map(n => (
                                <div
                                  key={n.id}
                                  onClick={() => onOpenItem(n.id, 'note')}
                                  className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                                    activeItemId === n.id
                                      ? 'bg-stone-800 text-white font-medium'
                                      : 'text-stone-300 hover:bg-stone-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate">{n.title}</span>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        onToggleFavorite(n.id, 'note');
                                      }}
                                      className="p-0.5 hover:text-amber-400"
                                    >
                                      <Star
                                        className={`w-3 h-3 ${n.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-500'}`}
                                      />
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        onDeleteItem(n.id, 'note');
                                      }}
                                      className="p-0.5 hover:text-red-400"
                                      title="Mover para lixeira"
                                    >
                                      <Trash2 className="w-3 h-3 text-stone-500 hover:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {fldDocs.map(d => (
                                <div
                                  key={d.id}
                                  onClick={() => onOpenItem(d.id, 'document')}
                                  className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                                    activeItemId === d.id
                                      ? 'bg-stone-800 text-white font-medium'
                                      : 'text-stone-300 hover:bg-stone-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="truncate">{d.title}</span>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        onToggleFavorite(d.id, 'document');
                                      }}
                                      className="p-0.5 hover:text-amber-400"
                                    >
                                      <Star
                                        className={`w-3 h-3 ${d.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-500'}`}
                                      />
                                    </button>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        onDeleteItem(d.id, 'document');
                                      }}
                                      className="p-0.5 hover:text-red-400"
                                      title="Mover para lixeira"
                                    >
                                      <Trash2 className="w-3 h-3 text-stone-500 hover:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Root items directly under notebook */}
                    {nbNotesRoot.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onOpenItem(n.id, 'note')}
                        className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                          activeItemId === n.id
                            ? 'bg-stone-800 text-white font-medium'
                            : 'text-stone-300 hover:bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{n.title}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleFavorite(n.id, 'note');
                            }}
                            className="p-0.5 hover:text-amber-400"
                          >
                            <Star
                              className={`w-3 h-3 ${n.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-500'}`}
                            />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteItem(n.id, 'note');
                            }}
                            className="p-0.5 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3 text-stone-500 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {nbDocsRoot.map(d => (
                      <div
                        key={d.id}
                        onClick={() => onOpenItem(d.id, 'document')}
                        className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                          activeItemId === d.id
                            ? 'bg-stone-800 text-white font-medium'
                            : 'text-stone-300 hover:bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{d.title}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleFavorite(d.id, 'document');
                            }}
                            className="p-0.5 hover:text-amber-400"
                          >
                            <Star
                              className={`w-3 h-3 ${d.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-500'}`}
                            />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteItem(d.id, 'document');
                            }}
                            className="p-0.5 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3 text-stone-500 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
