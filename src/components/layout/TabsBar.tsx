/**
 * Multi-Tab Bar (Section 5.3)
 * Allows opening multiple notes and traditional documents simultaneously,
 * switching tabs, closing tabs, and tracking unsaved state.
 */

import React from 'react';
import { FileText, Layers, X, Plus, Circle } from 'lucide-react';
import { EditorTab, ContentType } from '../../types';

interface TabsBarProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOtherTabs: (tabId: string) => void;
  onNewTabClick: () => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onNewTabClick,
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className="no-print bg-stone-900 border-b border-stone-800 flex items-center px-2 overflow-x-auto select-none shrink-0 h-10 scrollbar-none">
      <div className="flex items-center gap-1 flex-1 overflow-x-auto pr-2">
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium cursor-pointer max-w-[200px] border-t-2 transition-all ${
                isActive
                  ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-indigo-500 shadow-sm'
                  : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border-transparent'
              }`}
            >
              {tab.type === 'note' ? (
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}

              <span className="truncate">{tab.title}</span>

              {tab.hasUnsavedChanges && (
                <Circle className="w-2 h-2 text-amber-500 fill-amber-500 shrink-0" />
              )}

              <button
                onClick={e => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-opacity ml-1"
                title="Fechar aba"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNewTabClick}
        className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
        title="Nova aba rápida"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
