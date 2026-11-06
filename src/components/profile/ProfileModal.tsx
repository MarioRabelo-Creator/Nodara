/**
 * User Profile & Preferences Modal (Section 7)
 * Handles individual profiles, display name, Google identity, preferences, and data isolation.
 */

import React, { useState } from 'react';
import {
  User,
  CheckCircle2,
  Settings,
  Moon,
  Sun,
  Palette,
  Type,
  FileText,
  Clock,
  Shield,
  Download,
  Trash2,
  X
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onExportAllData: () => void;
  onResetData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onExportAllData,
  onResetData,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [theme, setTheme] = useState(profile.preferences.theme);
  const [fontFamily, setFontFamily] = useState(profile.preferences.fontFamily);
  const [defaultPaperSize, setDefaultPaperSize] = useState(profile.preferences.defaultPaperSize);
  const [autoSaveInterval, setAutoSaveInterval] = useState(profile.preferences.autoSaveIntervalSeconds);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      displayName: displayName.trim() || profile.displayName,
      preferences: {
        ...profile.preferences,
        theme,
        fontFamily,
        defaultPaperSize,
        autoSaveIntervalSeconds: autoSaveInterval,
      },
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Perfil e Preferências do Usuário</h2>
              <div className="text-[11px] text-stone-400">
                Isolamento estrito de dados e preferências individuais (Seção 7)
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
          {/* Identity Card */}
          <div className="flex items-center gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800">
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{profile.displayName}</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                  {profile.id}
                </span>
              </div>
              <div className="text-stone-400 text-[11px] mt-0.5">{profile.email}</div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Conta Google OAuth 2.0 Vinculada</span>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-semibold text-stone-300 block mb-1">Nome de Exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Typography Preference */}
            <div>
              <label className="font-semibold text-stone-300 block mb-1">
                Família Tipográfica Padrão
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Calibri', val: 'Calibri' },
                  { label: 'Aptos', val: 'Aptos' },
                  { label: 'Arial', val: 'Arial' },
                  { label: 'Times New Roman', val: 'Times New Roman' },
                  { label: 'Georgia', val: 'Georgia' },
                  { label: 'Inter', val: 'Inter' },
                ].map(f => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFontFamily(f.val)}
                    className={`p-2 rounded-xl border text-center text-xs transition-all ${
                      fontFamily === f.val
                        ? 'bg-indigo-600 border-indigo-500 text-white font-medium'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Paper Size */}
            <div>
              <label className="font-semibold text-stone-300 block mb-1">
                Tamanho de Papel Padrão (Documentos Word)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['A4', 'Letter', 'Legal'] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setDefaultPaperSize(size)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      defaultPaperSize === size
                        ? 'bg-blue-600 border-blue-500 text-white font-medium'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Save Interval */}
            <div>
              <label className="font-semibold text-stone-300 block mb-1">
                Intervalo de Salvamento Automático Local (segundos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={autoSaveInterval}
                onChange={e => setAutoSaveInterval(parseInt(e.target.value) || 3)}
                className="w-32 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Backup & Dangerous Actions */}
          <div className="pt-4 border-t border-stone-800 flex flex-col gap-2">
            <div className="font-semibold text-stone-300 mb-1">Exportação & Manutenção</div>
            <div className="flex gap-2">
              <button
                onClick={onExportAllData}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Backup JSON
              </button>
              <button
                onClick={onResetData}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded-xl font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Redefinir Dados de Teste
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <div className="text-emerald-400 text-xs">
            {isSavedNotice && 'Preferências salvas com sucesso!'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-900/30"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
