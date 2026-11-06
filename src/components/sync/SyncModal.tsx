/**
 * Google Drive Synchronization & Offline Queue Central (Sections 9, 10, 11)
 * Features:
 * - Google Drive folder choice ("Meu Aplicativo" vs custom)
 * - Cloud quota gauge (15 GB)
 * - Offline queue inspector (SQLite SyncQueue)
 * - Conflict resolution simulation and interactive tester
 */

import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Folder,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  X,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { CloudAccount, SyncQueueItem } from '../../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudAccount: CloudAccount;
  onUpdateCloudAccount: (acc: CloudAccount) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  syncQueue: SyncQueueItem[];
  onProcessSync: () => void;
  onClearSynced: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  cloudAccount,
  onUpdateCloudAccount,
  isOffline,
  onToggleOffline,
  syncQueue,
  onProcessSync,
  onClearSynced,
}) => {
  const [folderName, setFolderName] = useState(cloudAccount.driveFolder || 'Meu Aplicativo');
  const [simulatedConflict, setSimulatedConflict] = useState<boolean>(false);
  const [conflictResolvedMsg, setConflictResolvedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const usedMB = (cloudAccount.usedBytes / (1024 * 1024)).toFixed(1);
  const totalGB = (cloudAccount.totalBytes / (1024 * 1024 * 1024)).toFixed(0);
  const percentUsed = ((cloudAccount.usedBytes / cloudAccount.totalBytes) * 100).toFixed(2);

  const pendingCount = syncQueue.filter(q => q.status === 'PENDING').length;

  const handleSaveFolder = () => {
    onUpdateCloudAccount({
      ...cloudAccount,
      driveFolder: folderName.trim() || 'Meu Aplicativo',
    });
  };

  const handleResolveConflict = (choice: 'local' | 'remote' | 'merge') => {
    setSimulatedConflict(false);
    const msg =
      choice === 'local'
        ? 'Conflito resolvido: Versão local sobrescreveu a cópia do Google Drive.'
        : choice === 'remote'
        ? 'Conflito resolvido: Versão do Google Drive restaurada no banco local.'
        : 'Conflito resolvido: Mesclagem automática concluída com sucesso.';
    setConflictResolvedMsg(msg);
    setTimeout(() => setConflictResolvedMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Sincronização com Google Drive & Fila Offline
              </h2>
              <div className="text-[11px] text-stone-400">
                Protocolo de integridade bidirecional (Seções 9, 10 e 11)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6 text-xs">
          {/* Status & Storage Usage Card */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Conta Google Drive:</span>
                <span className="text-stone-300 font-mono">{cloudAccount.email}</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                <CheckCircle2 className="w-3 h-3" /> Conectado (OAuth 2.0)
              </span>
            </div>

            {/* Storage Quota Gauge */}
            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                <span>Cota Utilizada no Drive: {usedMB} MB</span>
                <span>{totalGB} GB Disponíveis</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.max(2, parseFloat(percentUsed))}%` }}
                />
              </div>
            </div>

            {/* Last Synced */}
            <div className="text-[11px] text-stone-400 flex items-center justify-between pt-2 border-t border-stone-800/60">
              <span>Última sincronização:</span>
              <span className="font-mono text-stone-300">
                {cloudAccount.lastSyncedAt
                  ? new Date(cloudAccount.lastSyncedAt).toLocaleString()
                  : 'Pendente'}
              </span>
            </div>
          </div>

          {/* Drive Folder Selector (Section 9.2) */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-400" />
              Diretório no Google Drive
            </div>
            <p className="text-[11px] text-stone-400">
              Conforme a Seção 9.2, os arquivos são armazenados visivelmente no seu "Meu Drive", em uma pasta exclusiva.
            </p>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="Nome da pasta (ex: Meu Aplicativo)"
                className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSaveFolder}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-medium"
              >
                Salvar Pasta
              </button>
            </div>
          </div>

          {/* Offline / Online Switch & Actions */}
          <div className="flex items-center justify-between bg-stone-950 p-4 rounded-2xl border border-stone-800">
            <div>
              <div className="font-semibold text-white">Simulador de Conexão de Rede</div>
              <div className="text-[11px] text-stone-400">
                {isOffline
                  ? 'Modo Offline forçado. Todas as edições são enfileiradas no SQLite local.'
                  : 'Modo Online. Sincronizações ocorrem em tempo real com a nuvem.'}
              </div>
            </div>
            <button
              onClick={onToggleOffline}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                isOffline
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isOffline ? 'Alternar para Online' : 'Simular Offline'}
            </button>
          </div>

          {/* Offline Sync Queue Inspector (Section 11) */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">
                  Fila de Operações Pendentes ({pendingCount})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onProcessSync}
                  disabled={isOffline || pendingCount === 0}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-medium transition-colors"
                >
                  Sincronizar Fila
                </button>
                <button
                  onClick={onClearSynced}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[11px]"
                >
                  Limpar Histórico
                </button>
              </div>
            </div>

            {syncQueue.length === 0 ? (
              <div className="text-center py-6 text-stone-500 italic text-[11px]">
                Nenhuma operação registrada na fila de sincronização.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-[11px]">
                {syncQueue.map(q => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-900 border border-stone-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          q.status === 'SYNCED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : q.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {q.status}
                      </span>
                      <span className="text-stone-300 uppercase">{q.operation}</span>
                      <span className="text-stone-500">{q.itemType}</span>
                    </div>
                    <span className="text-stone-500 text-[10px]">
                      {new Date(q.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Conflict Resolution Tester (Section 11) */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">Simulador de Resolução de Conflitos</span>
              </div>
              {!simulatedConflict && (
                <button
                  onClick={() => setSimulatedConflict(true)}
                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 rounded-lg text-[11px] font-medium"
                >
                  Simular Conflito Concorrente
                </button>
              )}
            </div>

            {conflictResolvedMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {conflictResolvedMsg}
              </div>
            )}

            {simulatedConflict && (
              <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl flex flex-col gap-3 animate-in fade-in">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Conflito detectado no documento "Especificação Técnica do Sistema"
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                    <span className="font-bold text-stone-200 block mb-1">Versão Local (Este Computador):</span>
                    <p className="text-stone-400">Modificado há 2 minutos durante desconexão offline.</p>
                  </div>
                  <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                    <span className="font-bold text-stone-200 block mb-1">Versão Remota (Google Drive):</span>
                    <p className="text-stone-400">Modificado há 1 minuto via dispositivo Android.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-800/40">
                  <button
                    onClick={() => handleResolveConflict('local')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                  >
                    Manter Versão Local
                  </button>
                  <button
                    onClick={() => handleResolveConflict('remote')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium"
                  >
                    Baixar Versão do Drive
                  </button>
                  <button
                    onClick={() => handleResolveConflict('merge')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    Mesclar Ambas as Versões
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
