/**
 * Nodara - Main Dashboard View (Section 5.1 & Section 7)
 * Shows:
 * - Metrics & quick stats
 * - Quick creation actions (Nova Nota, Novo Documento Tradicional)
 * - Favorites carousel / cards
 * - Recent documents & notes with sync state
 * - Google Drive sync status widget
 * - Recent activities timeline
 * (Grafo de Conexões removed per Section 6)
 */

import React from 'react';
import {
  FileText,
  Layers,
  Star,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Cloud,
  HardDrive,
  ChevronRight,
  TrendingUp,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import {
  Workspace,
  Notebook,
  Folder,
  Note,
  TraditionalDocument,
  CloudAccount,
  ActivityLog,
  UserProfile
} from '../../types';

interface DashboardProps {
  profile: UserProfile;
  workspaces: Workspace[];
  notebooks: Notebook[];
  folders: Folder[];
  notes: Note[];
  documents: TraditionalDocument[];
  cloudAccount: CloudAccount;
  activities: ActivityLog[];
  isOffline: boolean;
  onOpenItem: (id: string, type: 'note' | 'document') => void;
  onCreateItem: (type: 'note' | 'document') => void;
  onOpenArchitecture: () => void;
  onOpenSyncModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  workspaces,
  notebooks,
  notes,
  documents,
  cloudAccount,
  activities,
  isOffline,
  onOpenItem,
  onCreateItem,
  onOpenArchitecture,
  onOpenSyncModal,
}) => {
  const activeNotes = notes.filter(n => !n.isDeleted);
  const activeDocs = documents.filter(d => !d.isDeleted);

  // Favorites
  const favorites = [
    ...activeNotes.filter(n => n.isFavorite).map(n => ({ ...n, itemType: 'note' as const })),
    ...activeDocs.filter(d => d.isFavorite).map(d => ({ ...d, itemType: 'document' as const })),
  ];

  // Combined recents sorted by updatedAt
  const recents = [
    ...activeNotes.map(n => ({ ...n, itemType: 'note' as const })),
    ...activeDocs.map(d => ({ ...d, itemType: 'document' as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);

  const totalWords =
    activeNotes.reduce((acc, n) => acc + (n.wordCount || 0), 0) +
    activeDocs.reduce((acc, d) => acc + (d.wordCount || 0), 0);

  const driveUsedMB = (cloudAccount.usedBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950 p-6 md:p-8 select-text">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* WELCOME BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-stone-800">
          <div className="z-10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Nodara • Plataforma de Produtividade
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Olá, {profile.displayName}
            </h1>
            <p className="text-stone-300 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              Área de escrita limpa e confortável, unindo anotações atômicas e documentos avançados com sincronização em nuvem.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onCreateItem('note')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all hover:scale-102"
            >
              <FileText className="w-4 h-4" />
              Nova Nota (.md)
            </button>
            <button
              onClick={() => onCreateItem('document')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition-all hover:scale-102"
            >
              <Layers className="w-4 h-4" />
              Novo Documento (Word)
            </button>
          </div>

          {/* Glowing gradient accent */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* METRIC STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
              <span>Notas Independentes</span>
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {activeNotes.length}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Markdown (.md)
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
              <span>Documentos Tradicionais</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {activeDocs.length}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                Paginados (A4/Carta)
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
              <span>Total de Palavras</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Em todos os cadernos
              </div>
            </div>
          </div>

          <div
            onClick={onOpenSyncModal}
            className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs">
              <span>Google Drive</span>
              <Cloud className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                {driveUsedMB} <span className="text-xs font-normal text-stone-400">MB</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                {isOffline ? (
                  <span className="text-amber-500 font-semibold">● Fila Offline</span>
                ) : (
                  <span className="text-emerald-500 font-semibold">● Conectado (15 GB)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QUICK SHORTCUTS & ACTION BAR (CLEAN 2-CARD LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={onOpenSyncModal}
            className="group bg-gradient-to-br from-stone-900 to-stone-950 p-5 rounded-2xl border border-stone-800 text-stone-200 cursor-pointer hover:border-blue-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                Central de Sincronização em Nuvem
              </div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Acompanhe o estado da pasta "Meu Aplicativo" no Google Drive, fila offline e resolução de conflitos.
              </p>
            </div>
          </div>

          <div
            onClick={onOpenArchitecture}
            className="group bg-gradient-to-br from-stone-900 to-stone-950 p-5 rounded-2xl border border-stone-800 text-stone-200 cursor-pointer hover:border-indigo-500/50 transition-all flex items-start gap-4 shadow-sm"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                Especificação Técnica & DER (Seção 15)
              </div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Consulte o DER relacional SQLite de 16 entidades, o protocolo de sincronização e o formato AST.
              </p>
            </div>
          </div>
        </div>

        {/* FAVORITES SECTION */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Itens Marcados como Favoritos
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.map(fav => (
                <div
                  key={fav.id}
                  onClick={() => onOpenItem(fav.id, fav.itemType)}
                  className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-indigo-400 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {fav.itemType === 'note' ? (
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                          <FileText className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                          <Layers className="w-4 h-4" />
                        </span>
                      )}
                      <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[180px]">
                        {fav.title}
                      </span>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400 flex justify-between items-center">
                    <span>{fav.itemType === 'note' ? 'Markdown (.md)' : 'Word AST'}</span>
                    <span>{fav.wordCount || 0} palavras</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENTS AND RECENT ACTIVITY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recents Table */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-stone-200">
                <Clock className="w-4 h-4 text-stone-400" />
                Documentos e Notas Recentes
              </div>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recents.map(item => (
                <div
                  key={item.id}
                  onClick={() => onOpenItem(item.id, item.itemType)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {item.itemType === 'note' ? (
                      <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                        <Layers className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-2">
                        <span>{item.itemType === 'note' ? 'Nota (.md)' : 'Documento (AST)'}</span>
                        <span>•</span>
                        <span>{item.wordCount || 0} palavras</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-stone-200">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                Histórico de Atividades
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {activities.slice(0, 6).map(act => (
                <div key={act.id} className="text-xs border-l-2 border-indigo-400 pl-3 py-1">
                  <div className="font-semibold text-stone-800 dark:text-stone-200">
                    {act.itemTitle}
                  </div>
                  <div className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                    {act.description}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
