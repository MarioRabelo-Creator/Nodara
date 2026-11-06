/**
 * Top Navbar
 * Handles brand identity, profile switcher, network status (online/offline),
 * Google Drive sync trigger, and global search.
 */

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  RefreshCw,
  Cloud,
  CloudOff,
  User,
  ChevronDown,
  Sparkles,
  Settings,
  Layers,
  FileText,
  CheckCircle2,
  FolderPlus,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { UserProfile, CloudAccount } from '../../types';

interface NavbarProps {
  profile: UserProfile;
  profiles: UserProfile[];
  onSelectProfile: (profileId: string) => void;
  cloudAccount: CloudAccount;
  isOffline: boolean;
  isSyncing: boolean;
  onToggleOffline: () => void;
  onTriggerSync: () => void;
  onOpenSearch: () => void;
  onOpenSyncModal: () => void;
  onOpenProfileModal: () => void;
  onCreateNewItem: (type: 'note' | 'document') => void;
  onResetDatabase: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  profiles,
  onSelectProfile,
  cloudAccount,
  isOffline,
  isSyncing,
  onToggleOffline,
  onTriggerSync,
  onOpenSearch,
  onOpenSyncModal,
  onOpenProfileModal,
  onCreateNewItem,
  onResetDatabase,
  onToggleSidebar,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <header className="no-print bg-stone-950 border-b border-stone-800 h-14 px-4 flex items-center justify-between text-stone-200 select-none shrink-0 z-40">
      {/* LEFT BRAND GROUP */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          title="Alternar Barra Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/30 font-bold text-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">Nodara</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono px-1.5 py-0.2 rounded">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-stone-400 leading-none">
              Notas & Documentos
            </div>
          </div>
        </div>
      </div>

      {/* CENTER SEARCH SHORTCUT */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 px-3.5 py-1.5 rounded-xl text-xs text-stone-400 transition-all shadow-inner w-72 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span>Pesquisar títulos, tags e textos...</span>
          </div>
          <kbd className="text-[10px] bg-stone-950 text-stone-400 px-1.5 py-0.5 rounded border border-stone-800 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* RIGHT ACTION & STATUS GROUP */}
      <div className="flex items-center gap-2.5">
        {/* NEW ITEM BUTTON */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showCreateMenu && (
            <div
              onClick={() => setShowCreateMenu(false)}
              className="absolute right-0 top-10 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-1.5 w-52 z-50 animate-in fade-in zoom-in-95"
            >
              <button
                onClick={() => onCreateNewItem('note')}
                className="flex items-center gap-2.5 w-full p-2 rounded-xl text-xs text-left hover:bg-stone-800 text-stone-200 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Nota Independente</div>
                  <div className="text-[10px] text-stone-400">Markdown .md (Obsidian)</div>
                </div>
              </button>

              <button
                onClick={() => onCreateNewItem('document')}
                className="flex items-center gap-2.5 w-full p-2 rounded-xl text-xs text-left hover:bg-stone-800 text-stone-200 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Documento Tradicional</div>
                  <div className="text-[10px] text-stone-400">Páginas A4, AST (Word)</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ONLINE / OFFLINE TOGGLE */}
        <button
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            isOffline
              ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/40'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/40'
          }`}
          title={isOffline ? 'Modo Offline Ativo (Fila SQLite)' : 'Modo Online (Sincronizado)'}
        >
          {isOffline ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* GOOGLE DRIVE SYNC BADGE & TRIGGER */}
        <button
          onClick={onTriggerSync}
          disabled={isSyncing || isOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            isSyncing
              ? 'bg-blue-950/60 border-blue-800 text-blue-300'
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
          } ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Sincronizar com a pasta 'Meu Aplicativo' no Google Drive"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-stone-400'}`} />
          <span className="hidden lg:inline">{isSyncing ? 'Sincronizando...' : 'Drive'}</span>
        </button>

        {/* USER PROFILE DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-6 h-6 rounded-lg object-cover ring-1 ring-stone-700"
            />
            <span className="text-xs font-medium text-stone-200 hidden sm:inline max-w-[100px] truncate">
              {profile.displayName}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {showProfileMenu && (
            <div
              onClick={() => setShowProfileMenu(false)}
              className="absolute right-0 top-11 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-2 w-64 z-50 animate-in fade-in zoom-in-95"
            >
              <div className="p-2 border-b border-stone-800 mb-1">
                <div className="font-bold text-xs text-white">{profile.displayName}</div>
                <div className="text-[10px] text-stone-400 truncate">{profile.email}</div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Google OAuth 2.0 Conectado
                </div>
              </div>

              {/* Profiles switch */}
              <div className="py-1">
                <div className="text-[10px] uppercase font-bold text-stone-500 px-2 py-1">
                  Trocar de Perfil
                </div>
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProfile(p.id)}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      p.id === profile.id
                        ? 'bg-stone-800 text-white font-semibold'
                        : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
                    }`}
                  >
                    <span className="truncate">{p.displayName}</span>
                    {p.id === profile.id && <span className="text-[10px] text-indigo-400">Ativo</span>}
                  </button>
                ))}
              </div>

              <div className="border-t border-stone-800 pt-1 mt-1 flex flex-col gap-0.5">
                <button
                  onClick={onOpenProfileModal}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-stone-400" />
                  Preferências do Usuário
                </button>

                <button
                  onClick={onOpenSyncModal}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-stone-300 hover:bg-stone-800 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  Configurar Google Drive
                </button>

                <button
                  onClick={onResetDatabase}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  Restaurar Banco de Demonstração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
