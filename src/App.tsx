/**
 * Nodara - Main Application Controller
 * Unifying Microsoft Word (paginated AST documents), Obsidian (connected Markdown notes),
 * and Google Drive (cloud storage, sync protocol, and offline-first SQLite).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './db/storage';
import {
  UserProfile,
  Workspace,
  Notebook,
  Folder,
  Note,
  TraditionalDocument,
  CloudAccount,
  SyncQueueItem,
  ActivityLog,
  EditorTab,
  ActiveView,
  ContentType
} from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TabsBar } from './components/layout/TabsBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ObsidianNoteEditor } from './components/editor/ObsidianNoteEditor';
import { WordDocumentEditor } from './components/editor/WordDocumentEditor';
import { ArchitectureArtifactsModal } from './components/architecture/ArchitectureArtifactsModal';
import { TrashModal } from './components/trash/TrashModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { SyncModal } from './components/sync/SyncModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { NewItemModal } from './components/modals/NewItemModal';

export default function App() {
  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(storage.getCurrentProfile());

  // Relational Entities
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<TraditionalDocument[]>([]);

  // Cloud & Sync
  const [cloudAccount, setCloudAccount] = useState<CloudAccount>(storage.getCloudAccount());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(storage.getSyncQueue());
  const [isOffline, setIsOffline] = useState<boolean>(storage.isOfflineForced());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activities, setActivities] = useState<ActivityLog[]>(storage.getActivities());

  // UI Navigation & Tabs
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [tabs, setTabs] = useState<EditorTab[]>(storage.getTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(storage.getActiveTabId());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);
  const [newItemDefaults, setNewItemDefaults] = useState<{
    type?: ContentType | 'notebook' | 'folder';
    notebookId?: string;
    folderId?: string | null;
  }>({});

  // Reload data from local database
  const reloadData = useCallback(() => {
    const profs = storage.getProfiles();
    const currProf = storage.getCurrentProfile();
    const ws = storage.getWorkspaces();
    const nbs = storage.getNotebooks();
    const flds = storage.getFolders();
    const nts = storage.getNotes();
    const docs = storage.getDocuments();

    setProfiles(profs);
    setCurrentProfile(currProf);
    setWorkspaces(ws);
    setNotebooks(nbs);
    setFolders(flds);
    setNotes(nts);
    setDocuments(docs);
    setCloudAccount(storage.getCloudAccount());
    setSyncQueue(storage.getSyncQueue());
    setIsOffline(storage.isOfflineForced());
    setActivities(storage.getActivities());

    if (ws.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(ws[0].id);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Profile switching
  const handleSelectProfile = (profileId: string) => {
    storage.setCurrentProfileId(profileId);
    reloadData();
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    storage.updateProfile(updated);
    setCurrentProfile(updated);
    reloadData();
  };

  // Open item in editor
  const handleOpenItem = (id: string, type: 'note' | 'document') => {
    const existing = tabs.find(t => t.itemId === id);
    if (existing) {
      setActiveTabId(existing.id);
      storage.setActiveTabId(existing.id);
      setActiveView('editor');
      return;
    }

    let title = 'Documento';
    if (type === 'note') {
      const note = notes.find(n => n.id === id);
      if (note) title = note.title;
    } else {
      const doc = documents.find(d => d.id === id);
      if (doc) title = doc.title;
    }

    const newTab: EditorTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      itemId: id,
      title,
      hasUnsavedChanges: false,
    };

    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    storage.saveTabs(newTabs);
    setActiveTabId(newTab.id);
    storage.setActiveTabId(newTab.id);
    setActiveView('editor');
  };

  // Open item by title (used by [[WikiLinks]])
  const handleOpenItemByTitle = (title: string) => {
    const q = title.toLowerCase().trim();
    const foundNote = notes.find(n => !n.isDeleted && n.title.toLowerCase().trim() === q);
    if (foundNote) {
      handleOpenItem(foundNote.id, 'note');
      return;
    }
    const foundDoc = documents.find(d => !d.isDeleted && d.title.toLowerCase().trim() === q);
    if (foundDoc) {
      handleOpenItem(foundDoc.id, 'document');
      return;
    }

    // If item not found, offer to create note with that title
    const nbId = notebooks[0]?.id || 'nb_arch';
    handleCreateNote(nbId, null, title);
  };

  // Tab Close
  const handleCloseTab = (tabId: string) => {
    const remaining = tabs.filter(t => t.id !== tabId);
    setTabs(remaining);
    storage.saveTabs(remaining);

    if (activeTabId === tabId) {
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
        storage.setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        setActiveTabId(null);
        storage.setActiveTabId(null);
        setActiveView('dashboard');
      }
    }
  };

  const handleCloseOtherTabs = (tabId: string) => {
    const remaining = tabs.filter(t => t.id === tabId);
    setTabs(remaining);
    storage.saveTabs(remaining);
    setActiveTabId(tabId);
    storage.setActiveTabId(tabId);
  };

  // Content Mutators
  const handleUpdateNote = (updatedNote: Note) => {
    storage.saveNote(updatedNote);
    setNotes(prev => prev.map(n => (n.id === updatedNote.id ? updatedNote : n)));

    // Update tab title if changed
    setTabs(prev =>
      prev.map(t => (t.itemId === updatedNote.id ? { ...t, title: updatedNote.title } : t))
    );
  };

  const handleUpdateDocument = (updatedDoc: TraditionalDocument) => {
    storage.saveDocument(updatedDoc);
    setDocuments(prev => prev.map(d => (d.id === updatedDoc.id ? updatedDoc : d)));

    // Update tab title if changed
    setTabs(prev =>
      prev.map(t => (t.itemId === updatedDoc.id ? { ...t, title: updatedDoc.title } : t))
    );
  };

  // Item Creators
  const handleCreateNote = (notebookId: string, folderId: string | null, title: string) => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      profileId: currentProfile.id,
      notebookId,
      folderId,
      title,
      content: `# ${title}\n\nComece a redigir suas ideias aqui. Conecte com [[Outra Nota]] ou adicione #etiquetas.\n`,
      tags: [],
      isFavorite: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 15,
      attachments: [],
    };
    storage.saveNote(newNote);
    reloadData();
    handleOpenItem(newNote.id, 'note');
  };

  const handleCreateDocument = (notebookId: string, folderId: string | null, title: string) => {
    const newDoc: TraditionalDocument = {
      id: `doc_${Date.now()}`,
      profileId: currentProfile.id,
      notebookId,
      folderId,
      title,
      isFavorite: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 30,
      pageCount: 1,
      ast: {
        version: '1.0',
        title,
        metadata: {
          author: currentProfile.displayName,
          createdAt: new Date().toISOString(),
          lastModifiedBy: currentProfile.displayName,
          wordCount: 30,
          charCount: 180,
        },
        pageConfig: {
          paperSize: currentProfile.preferences.defaultPaperSize || 'A4',
          orientation: 'portrait',
          marginPreset: 'normal',
          margins: { top: 25, bottom: 25, left: 30, right: 25 },
          headerText: title.toUpperCase(),
          footerText: 'Nodara',
          showPageNumbers: true,
          pageNumberFormat: 'X_OF_Y',
          headerAlignment: 'right',
          footerAlignment: 'center',
        },
        nodes: [
          {
            id: `h_${Date.now()}`,
            type: 'heading',
            level: 1,
            text: title,
            alignment: 'left',
          },
          {
            id: `p_${Date.now()}`,
            type: 'paragraph',
            text: 'Este é um novo documento tradicional paginado estruturado no formato AST. Utilize a barra superior para adicionar quebras de página, tabelas, notas de rodapé e sumários.',
            alignment: 'justify',
          },
        ],
      },
      attachments: [],
    };
    storage.saveDocument(newDoc);
    reloadData();
    handleOpenItem(newDoc.id, 'document');
  };

  const handleCreateNotebook = (workspaceId: string, name: string) => {
    const newNb: Notebook = {
      id: `nb_${Date.now()}`,
      workspaceId,
      name,
      icon: 'BookOpen',
      color: '#6366f1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveNotebook(newNb);
    reloadData();
  };

  const handleCreateFolder = (notebookId: string, parentFolderId: string | null, name: string) => {
    const newFld: Folder = {
      id: `fld_${Date.now()}`,
      notebookId,
      parentFolderId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveFolder(newFld);
    reloadData();
  };

  // Trash & Favorites
  const handleDeleteItem = (id: string, type: 'note' | 'document') => {
    if (type === 'note') {
      storage.trashNote(id);
    } else {
      storage.trashDocument(id);
    }
    // Close tab if open
    const openTab = tabs.find(t => t.itemId === id);
    if (openTab) handleCloseTab(openTab.id);
    reloadData();
  };

  const handleRestoreItem = (id: string, type: 'note' | 'document') => {
    if (type === 'note') {
      storage.restoreNote(id);
    } else {
      storage.restoreDocument(id);
    }
    reloadData();
  };

  const handlePermanentlyDeleteItem = (id: string, type: 'note' | 'document') => {
    if (type === 'note') {
      storage.permanentlyDeleteNote(id);
    } else {
      storage.permanentlyDeleteDocument(id);
    }
    reloadData();
  };

  const handleToggleFavorite = (id: string, type: 'note' | 'document') => {
    if (type === 'note') {
      const n = notes.find(item => item.id === id);
      if (n) storage.saveNote({ ...n, isFavorite: !n.isFavorite });
    } else {
      const d = documents.find(item => item.id === id);
      if (d) storage.saveDocument({ ...d, isFavorite: !d.isFavorite });
    }
    reloadData();
  };

  // Offline & Google Drive Sync
  const handleToggleOffline = () => {
    const next = !isOffline;
    storage.setOfflineForced(next);
    setIsOffline(next);
  };

  const handleTriggerSync = () => {
    if (isOffline) return;
    setIsSyncing(true);
    setTimeout(() => {
      storage.processSyncQueue();
      setIsSyncing(false);
      reloadData();
    }, 1200);
  };

  // Backup & Reset
  const handleExportAllData = () => {
    const fullDump = {
      profile: currentProfile,
      workspaces,
      notebooks,
      folders,
      notes,
      documents,
      cloudAccount,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullDump, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapsedocs_backup_${currentProfile.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetDatabase = () => {
    if (window.confirm('Deseja restaurar o banco de dados inicial de demonstração?')) {
      storage.resetDatabase();
      window.location.reload();
    }
  };

  // Determine currently active item
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeNote = activeTab?.type === 'note' ? notes.find(n => n.id === activeTab.itemId) : null;
  const activeDoc =
    activeTab?.type === 'document' ? documents.find(d => d.id === activeTab.itemId) : null;

  const trashCount =
    notes.filter(n => n.isDeleted).length + documents.filter(d => d.isDeleted).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-900 text-stone-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        profile={currentProfile}
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        cloudAccount={cloudAccount}
        isOffline={isOffline}
        isSyncing={isSyncing}
        onToggleOffline={handleToggleOffline}
        onTriggerSync={handleTriggerSync}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onCreateNewItem={type => {
          setNewItemDefaults({ type });
          setIsNewItemModalOpen(true);
        }}
        onResetDatabase={handleResetDatabase}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hierarchical Sidebar */}
        <Sidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={setSelectedWorkspaceId}
          notebooks={notebooks}
          folders={folders}
          notes={notes}
          documents={documents}
          activeView={activeView}
          activeItemId={activeTab?.itemId}
          onSelectView={view => {
            setActiveView(view);
          }}
          onOpenItem={handleOpenItem}
          onNewItemClick={(nbId, fldId, type) => {
            setNewItemDefaults({ notebookId: nbId, folderId: fldId, type });
            setIsNewItemModalOpen(true);
          }}
          onNewFolderClick={(nbId, parentFolderId) => {
            setNewItemDefaults({ notebookId: nbId, folderId: parentFolderId, type: 'folder' });
            setIsNewItemModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onToggleFavorite={handleToggleFavorite}
          trashCount={trashCount}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Content Viewer / Editor Main Stage */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 relative">
          {/* Multi-Tab Bar (when in editor view and tabs exist) */}
          {activeView === 'editor' && (
            <TabsBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={tabId => {
                setActiveTabId(tabId);
                storage.setActiveTabId(tabId);
                setActiveView('editor');
              }}
              onCloseTab={handleCloseTab}
              onCloseOtherTabs={handleCloseOtherTabs}
              onNewTabClick={() => {
                setNewItemDefaults({});
                setIsNewItemModalOpen(true);
              }}
            />
          )}

          {/* VIEW ROUTER */}
          {activeView === 'dashboard' && (
            <Dashboard
              profile={currentProfile}
              workspaces={workspaces}
              notebooks={notebooks}
              folders={folders}
              notes={notes}
              documents={documents}
              cloudAccount={cloudAccount}
              activities={activities}
              isOffline={isOffline}
              onOpenItem={handleOpenItem}
              onCreateItem={type => {
                setNewItemDefaults({ type });
                setIsNewItemModalOpen(true);
              }}
              onOpenArchitecture={() => setActiveView('architecture')}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
            />
          )}

          {activeView === 'architecture' && (
            <ArchitectureArtifactsModal />
          )}

          {activeView === 'trash' && (
            <TrashModal
              notes={notes}
              documents={documents}
              onRestoreItem={handleRestoreItem}
              onPermanentlyDeleteItem={handlePermanentlyDeleteItem}
              onEmptyTrash={() => {
                if (window.confirm('Deseja excluir permanentemente todos os itens da lixeira?')) {
                  notes.filter(n => n.isDeleted).forEach(n => storage.permanentlyDeleteNote(n.id));
                  documents.filter(d => d.isDeleted).forEach(d => storage.permanentlyDeleteDocument(d.id));
                  reloadData();
                }
              }}
            />
          )}

          {activeView === 'editor' && (
            <>
              {activeNote && (
                <ObsidianNoteEditor
                  note={activeNote}
                  allNotes={notes}
                  allDocuments={documents}
                  onUpdate={handleUpdateNote}
                  onOpenItem={handleOpenItem}
                  onOpenItemByTitle={handleOpenItemByTitle}
                />
              )}

              {activeDoc && (
                <WordDocumentEditor
                  document={activeDoc}
                  onUpdate={handleUpdateDocument}
                  onOpenNoteByTitle={handleOpenItemByTitle}
                />
              )}

              {!activeNote && !activeDoc && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
                  <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 mb-4 shadow-xl">
                    <span className="text-2xl font-bold text-indigo-400">N</span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-200">
                    Nenhum documento aberto
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mt-1">
                    Selecione uma nota ou documento na barra lateral, ou crie um novo item.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium"
                    >
                      Ir para o Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setNewItemDefaults({});
                        setIsNewItemModalOpen(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                    >
                      Criar Conteúdo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        documents={documents}
        onOpenItem={handleOpenItem}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        cloudAccount={cloudAccount}
        onUpdateCloudAccount={acc => {
          storage.saveCloudAccount(acc);
          setCloudAccount(acc);
        }}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        syncQueue={syncQueue}
        onProcessSync={handleTriggerSync}
        onClearSynced={() => {
          storage.clearSyncedQueue();
          setSyncQueue(storage.getSyncQueue());
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={currentProfile}
        onUpdateProfile={handleUpdateProfile}
        onExportAllData={handleExportAllData}
        onResetData={handleResetDatabase}
      />

      <NewItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        initialType={newItemDefaults.type}
        initialNotebookId={newItemDefaults.notebookId}
        initialFolderId={newItemDefaults.folderId}
        workspaces={workspaces}
        notebooks={notebooks}
        folders={folders}
        onCreateNote={handleCreateNote}
        onCreateDocument={handleCreateDocument}
        onCreateNotebook={handleCreateNotebook}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}
