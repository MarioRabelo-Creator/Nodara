import React, { useState } from 'react';
import { Collaborator, UserRole } from '../../types';
import { Users, UserCheck, Share2, Copy, Check, Shield, Wifi, WifiOff, Plus, ChevronDown } from 'lucide-react';

interface CollaboratorBarProps {
  collaborators: Collaborator[];
  activePersona: Collaborator;
  isConnected: boolean;
  onSwitchPersona: (collabId: string) => void;
  documentTitle: string;
}

export const CollaboratorBar: React.FC<CollaboratorBarProps> = ({
  collaborators,
  activePersona,
  isConnected,
  onSwitchPersona,
  documentTitle,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteEmail('');
      setInviteSuccess(false);
    }, 2500);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'editor':
        return 'Editor';
      case 'commenter':
        return 'Comentador';
      case 'viewer':
        return 'Leitor';
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Connection status indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
          title={isConnected ? 'Conexão WebSocket ativa em tempo real' : 'Modo local sincronizado'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">Ao Vivo</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="hidden md:inline">Sincronizado</span>
            </>
          )}
        </div>

        {/* Collaborators Avatars List */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {collaborators.map(c => {
            const isMe = c.id === activePersona.id;
            return (
              <div
                key={c.id}
                className="relative group cursor-pointer"
                onClick={() => onSwitchPersona(c.id)}
                title={`${c.name} (${getRoleLabel(c.role)})${isMe ? ' - Você' : ' - Clique para simular este usuário'}`}
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 transition-transform hover:scale-110 hover:z-10"
                  style={{
                    borderColor: c.color,
                    boxShadow: isMe ? `0 0 0 2px ${c.color}` : undefined,
                  }}
                />
                {isMe && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-stone-900"
                    title="Você está ativo com este perfil"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Persona Switcher Dropdown (Allows testing real-time multi-user editing directly) */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700"
            title="Alternar usuário para testar colaboração e comentários simultâneos"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activePersona.color }}
            />
            <span className="max-w-[100px] truncate">{activePersona.name}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 border-b border-stone-100 dark:border-stone-800 mb-1">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Alternar Usuário Atual
                </p>
                <p className="text-[11px] text-stone-400">
                  Simule múltiplos colaboradores simultâneos no mesmo arquivo:
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {collaborators.map(c => {
                  const isActive = c.id === activePersona.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSwitchPersona(c.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                          style={{ border: `2px solid ${c.color}` }}
                        />
                        <div className="truncate">
                          <p className="text-xs leading-none truncate">{c.name}</p>
                          <p className="text-[10px] text-stone-400 leading-tight mt-0.5 truncate">{c.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 shrink-0">
                        {getRoleLabel(c.role)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Share / Invite Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          title="Compartilhar arquivo e gerenciar permissões"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </button>
      </div>

      {/* Share / Invite Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm">
                    Compartilhar "{documentTitle}"
                  </h3>
                  <p className="text-xs text-stone-500">Edição e marcações em tempo real</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-5">
              {/* Invite by Email */}
              <form onSubmit={handleSendInvite} className="flex flex-col gap-2">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Adicionar pessoas ou grupos
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="commenter">Comentador</option>
                    <option value="viewer">Leitor</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Convidar
                  </button>
                </div>
                {inviteSuccess && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Convite enviado com sucesso para {inviteEmail}!
                  </p>
                )}
              </form>

              {/* People with Access */}
              <div>
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Pessoas com acesso ({collaborators.length})
                </p>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {collaborators.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          style={{ border: `2px solid ${c.color}` }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                            {c.name} {c.id === activePersona.id ? '(Você)' : ''}
                          </p>
                          <p className="text-[11px] text-stone-400 truncate">{c.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        {getRoleLabel(c.role)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Link Section */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Qualquer pessoa com o link pode visualizar</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
