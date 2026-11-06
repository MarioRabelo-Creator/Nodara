/**
 * Nodara - Storage Engine (SQLite / Relational Emulation via Persistent Local Storage)
 * Includes schema seed, relational constraints, sync queue, and transaction logging.
 */

import {
  UserProfile,
  Workspace,
  Notebook,
  Folder,
  Note,
  TraditionalDocument,
  InternalLink,
  Attachment,
  VersionSnapshot,
  SyncQueueItem,
  CloudAccount,
  ActivityLog,
  EditorTab
} from '../types';

const STORAGE_KEYS = {
  CURRENT_PROFILE_ID: 'nodara_current_profile_id',
  PROFILES: 'nodara_profiles',
  WORKSPACES: 'nodara_workspaces',
  NOTEBOOKS: 'nodara_notebooks',
  FOLDERS: 'nodara_folders',
  NOTES: 'nodara_notes',
  DOCUMENTS: 'nodara_documents',
  ATTACHMENTS: 'nodara_attachments',
  INTERNAL_LINKS: 'nodara_internal_links',
  VERSIONS: 'nodara_versions',
  SYNC_QUEUE: 'nodara_sync_queue',
  CLOUD_ACCOUNT: 'nodara_cloud_account',
  ACTIVITIES: 'nodara_activities',
  TABS: 'nodara_tabs',
  ACTIVE_TAB_ID: 'nodara_active_tab_id',
  IS_OFFLINE_FORCED: 'nodara_is_offline_forced',
};

// Seed initial profile
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'usr_eduardo',
    googleId: 'google_oauth_ma138902',
    displayName: 'Eduardo M.',
    email: 'ma138902@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-11-04T05:00:00.000Z',
    preferences: {
      theme: 'light',
      fontFamily: 'Calibri',
      autoSaveIntervalSeconds: 3,
      defaultPaperSize: 'A4',
      defaultPageOrientation: 'portrait',
      driveSyncEnabled: true,
      driveFolder: 'Meu Aplicativo',
    },
  },
  {
    id: 'usr_demo',
    googleId: 'google_oauth_demo_guest',
    displayName: 'Perfil Acadêmico',
    email: 'academico@universidade.edu.br',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-10-20T14:30:00.000Z',
    updatedAt: '2026-11-01T11:00:00.000Z',
    preferences: {
      theme: 'sepia',
      fontFamily: 'Times New Roman',
      autoSaveIntervalSeconds: 5,
      defaultPaperSize: 'A4',
      defaultPageOrientation: 'portrait',
      driveSyncEnabled: false,
      driveFolder: 'Nodara_Cloud',
    },
  },
];

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws_eng',
    profileId: 'usr_eduardo',
    name: 'Engenharia & Pesquisa',
    icon: 'Cpu',
    color: '#4f46e5',
    description: 'Projetos técnicos, arquitetura de sistemas e artigos científicos.',
    createdAt: '2026-10-15T10:05:00.000Z',
    updatedAt: '2026-11-02T16:00:00.000Z',
  },
  {
    id: 'ws_prod',
    profileId: 'usr_eduardo',
    name: 'Gestão de Produto',
    icon: 'Briefcase',
    color: '#059669',
    description: 'Roadmaps, especificações funcionais e documentação de lançamentos.',
    createdAt: '2026-10-15T10:10:00.000Z',
    updatedAt: '2026-11-03T18:20:00.000Z',
  },
];

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb_arch',
    workspaceId: 'ws_eng',
    name: 'Arquitetura Nodara',
    icon: 'Layers',
    color: '#6366f1',
    description: 'Módulos centrais, persistência SQLite e protocolo de nuvem.',
    createdAt: '2026-10-15T10:15:00.000Z',
    updatedAt: '2026-11-03T12:00:00.000Z',
  },
  {
    id: 'nb_docs',
    workspaceId: 'ws_prod',
    name: 'Documentação Oficial v1.0',
    icon: 'FileText',
    color: '#0284c7',
    description: 'Manuais de referência e especificações técnicas completas.',
    createdAt: '2026-10-16T08:00:00.000Z',
    updatedAt: '2026-11-04T02:00:00.000Z',
  },
];

const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'fld_sync',
    notebookId: 'nb_arch',
    parentFolderId: null,
    name: 'Módulo de Sincronização',
    createdAt: '2026-10-16T09:00:00.000Z',
    updatedAt: '2026-10-16T09:00:00.000Z',
  },
  {
    id: 'fld_editor',
    notebookId: 'nb_arch',
    parentFolderId: null,
    name: 'Editores e AST',
    createdAt: '2026-10-16T09:10:00.000Z',
    updatedAt: '2026-10-16T09:10:00.000Z',
  },
  {
    id: 'fld_specs',
    notebookId: 'nb_docs',
    parentFolderId: null,
    name: 'Especificações Técnicas',
    createdAt: '2026-10-17T11:00:00.000Z',
    updatedAt: '2026-10-17T11:00:00.000Z',
  },
];

const INITIAL_NOTES: Note[] = [
  {
    id: 'note_visao_geral',
    profileId: 'usr_eduardo',
    notebookId: 'nb_arch',
    folderId: 'fld_editor',
    title: 'Visão Geral da Arquitetura Híbrida',
    content: `# Visão Geral da Arquitetura Híbrida

O **Nodara** funde a filosofia de processamento formal de texto (estilo Word) com o hipertexto em rede e anotações atômicas (estilo Obsidian).

## Pilares Fundamentais
1. **Modo Duplo de Edição**:
   - Notas em Markdown (\`.md\`) em área única de digitação para raciocínio rápido e interconexão.
   - Documentos formais estruturados em JSON/AST com paginação sequencial A4/Carta e barra de estilo Word.
2. **Armazenamento Híbrido**:
   - Persistência local relacional simulando SQLite.
   - Arquivos externos com sincronização bidirecional no Google Drive.
3. **Conexões em Rede**:
   - Veja a especificação em [[Protocolo de Sincronização]] e [[Especificação Técnica do Sistema]].
   - Links bidirecionais automáticos usando a sintaxe \`[[Nome da Nota]]\`.

## Etiquetas e Categorias
#arquitetura #engenharia #produtividade #offline-first

> "A melhor ferramenta não obriga o usuário a escolher entre a fluidez do pensamento e a formalidade da publicação."
`,
    tags: ['arquitetura', 'engenharia', 'produtividade', 'offline-first'],
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-11-04T04:20:00.000Z',
    wordCount: 135,
    attachments: [],
  },
  {
    id: 'note_sync_protocol',
    profileId: 'usr_eduardo',
    notebookId: 'nb_arch',
    folderId: 'fld_sync',
    title: 'Protocolo de Sincronização',
    content: `# Protocolo de Sincronização e Fila Offline

Este documento detalha o ciclo de vida de operações quando o aplicativo opera offline e como os conflitos são resolvidos com o Google Drive.

## Estados da Fila
- **PENDING**: Alteração registrada no SQLite local aguardando conexão.
- **SYNCED**: Arquivo enviado para a pasta do Drive com hash de integridade verificado.
- **CONFLICT**: Versão remota modificada após a última sincronização local.

## Referências Cruzadas
- Conectado com [[Visão Geral da Arquitetura Híbrida]].
- Implementa as diretrizes do documento formal [[Especificação Técnica do Sistema]].

### Checklist de Implementação
- [x] Detecção de status de rede (Online/Offline)
- [x] Fila de operações persistente
- [x] Resolução automática por Timestamp com fallback para manual
- [ ] Suporte a Delta-Compression para anexos pesados

#sync #google-drive #offline #sqlite
`,
    tags: ['sync', 'google-drive', 'offline', 'sqlite'],
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-19T09:30:00.000Z',
    updatedAt: '2026-11-04T03:50:00.000Z',
    wordCount: 110,
    attachments: [],
  },
  {
    id: 'note_roadmap',
    profileId: 'usr_eduardo',
    notebookId: 'nb_docs',
    folderId: 'fld_specs',
    title: 'Roadmap de Recursos Futuros',
    content: `# Roadmap de Expansão Multiplataforma

Prioridades mapeadas para as próximas iterações:
- [x] Suporte a Windows e Android
- [x] Área única de digitação sem divisão de tela
- [x] Barra de ferramentas completa estilo Word
- [ ] Empacotamento nativo Desktop via Electron/Tauri
- [ ] Aplicativo móvel nativo Flutter

Conecta-se a [[Visão Geral da Arquitetura Híbrida]].

#roadmap #planejamento
`,
    tags: ['roadmap', 'planejamento'],
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-22T16:00:00.000Z',
    updatedAt: '2026-11-03T19:00:00.000Z',
    wordCount: 45,
    attachments: [],
  },
];

const INITIAL_DOCUMENTS: TraditionalDocument[] = [
  {
    id: 'doc_spec_tecnica',
    profileId: 'usr_eduardo',
    notebookId: 'nb_docs',
    folderId: 'fld_specs',
    title: 'Especificação Técnica do Sistema',
    isFavorite: true,
    isDeleted: false,
    deletedAt: null,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-11-04T04:45:00.000Z',
    wordCount: 290,
    pageCount: 2,
    ast: {
      version: '1.0',
      title: 'Especificação Técnica do Sistema',
      metadata: {
        author: 'Eduardo M.',
        createdAt: '2026-10-20T10:00:00.000Z',
        lastModifiedBy: 'Eduardo M.',
        wordCount: 290,
        charCount: 2150,
      },
      pageConfig: {
        paperSize: 'A4',
        orientation: 'portrait',
        marginPreset: 'normal',
        margins: { top: 25, bottom: 25, left: 30, right: 25 },
        headerText: 'NODARA — ESPECIFICAÇÃO DE PRODUTO V1.0',
        footerText: 'Confidencial | Nodara',
        showPageNumbers: true,
        pageNumberFormat: 'X_OF_Y',
        headerAlignment: 'right',
        footerAlignment: 'center',
        differentFirstPage: false,
        showDateInHeader: true,
      },
      nodes: [
        {
          id: 'node_toc',
          type: 'table_of_contents',
          title: 'Sumário Executivo',
          maxLevel: 3,
        },
        {
          id: 'node_h1_1',
          type: 'heading',
          level: 1,
          text: '1. Visão Geral e Arquitetura do Produto',
          alignment: 'left',
          fontFamily: 'Calibri',
          fontSize: '20pt',
        },
        {
          id: 'node_p_1',
          type: 'paragraph',
          text: 'O Nodara é concebido para resolver o dilema moderno entre a formalidade estruturada dos processadores de texto consolidados (Microsoft Word) e a agilidade das ferramentas de pensamento em rede (Obsidian), ancorando a persistência distribuída no Google Drive com operação offline autônoma.',
          alignment: 'justify',
          fontFamily: 'Calibri',
          fontSize: '11pt',
          lineHeight: 1.15,
        },
        {
          id: 'node_tbl_1',
          type: 'table',
          caption: 'Tabela 1.1 — Comparativo de Capacidades Arquiteturais',
          headers: ['Requisito', 'Microsoft Word', 'Obsidian', 'Nodara'],
          rows: [
            ['Paginação A4 / Cabeçalhos', 'Sim (Avançado)', 'Não (Fluxo único)', 'Sim (Nativo Paginado)'],
            ['Hiperlinks [[ ]]', 'Não nativo', 'Sim (Links cruzados)', 'Sim (Links nativos)'],
            ['Armazenamento em Nuvem', 'OneDrive', 'Local / Sync Pago', 'Google Drive Integrado'],
            ['Formato Interno', 'DOCX (ZIP/XML)', 'Markdown simples', 'JSON/AST Estruturado'],
            ['Operação Offline', 'Parcial', 'Sim', 'Sim (Fila SQLite)']
          ],
        },
        {
          id: 'node_callout_1',
          type: 'callout',
          variant: 'info',
          title: 'Princípio do Formato AST Estruturado',
          text: 'Todos os documentos tradicionais são serializados em uma Árvore Sintática Abstrata (AST) imutável por versão, permitindo renderização precisa na tela, conversão direta para PDF e exportação fiel para arquivos DOCX.',
        },
        {
          id: 'node_pb_1',
          type: 'page_break',
        },
        {
          id: 'node_h1_2',
          type: 'heading',
          level: 1,
          text: '2. Segurança, Identidade e Sincronização',
          alignment: 'left',
          fontFamily: 'Calibri',
          fontSize: '20pt',
        },
        {
          id: 'node_p_2',
          type: 'paragraph',
          text: 'O sistema opera sob o modelo Zero-Trust Local-First. As credenciais do Google OAuth 2.0 nunca transitam em servidores intermediários não confiáveis. A pasta raiz "Meu Aplicativo" no Drive mantém os arquivos protegidos com metadados de versão sincronizados.',
          alignment: 'justify',
          fontFamily: 'Calibri',
          fontSize: '11pt',
          lineHeight: 1.15,
        },
        {
          id: 'node_fn_1',
          type: 'footnote',
          number: 1,
          text: 'Consulte a nota técnica interna [[Protocolo de Sincronização]] para detalhes da máquina de estados e resolução de conflitos.',
        },
      ],
    },
    attachments: [],
  },
];

const INITIAL_CLOUD_ACCOUNT: CloudAccount = {
  email: 'ma138902@gmail.com',
  connected: true,
  driveFolder: 'Meu Aplicativo',
  usedBytes: 14200000, // ~14.2 MB
  totalBytes: 15 * 1024 * 1024 * 1024, // 15 GB
  lastSyncedAt: '2026-11-04T05:00:00.000Z',
  autoSync: true,
};

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act_1',
    type: 'edit',
    itemTitle: 'Especificação Técnica do Sistema',
    itemType: 'document',
    timestamp: '2026-11-04T04:45:00.000Z',
    description: 'Atualizou a Tabela 1.1 e configurou cabeçalhos A4',
  },
  {
    id: 'act_2',
    type: 'sync',
    itemTitle: 'Google Drive',
    itemType: 'sync',
    timestamp: '2026-11-04T04:00:00.000Z',
    description: 'Sincronização com nuvem concluída com sucesso (3 arquivos)',
  },
  {
    id: 'act_3',
    type: 'create',
    itemTitle: 'Protocolo de Sincronização',
    itemType: 'note',
    timestamp: '2026-11-03T14:15:00.000Z',
    description: 'Nova nota criada no caderno Arquitetura Nodara',
  },
];

/* =========================================================================
   Storage Service Implementation
   ========================================================================= */

class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    // If nodara_profiles does not exist, initialize or migrate
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE_ID, INITIAL_PROFILES[0].id);
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(INITIAL_WORKSPACES));
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(INITIAL_NOTEBOOKS));
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(INITIAL_FOLDERS));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
      localStorage.setItem(STORAGE_KEYS.CLOUD_ACCOUNT, JSON.stringify(INITIAL_CLOUD_ACCOUNT));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify([
        { id: 'tab_doc_spec', type: 'document', itemId: 'doc_spec_tecnica', title: 'Especificação Técnica do Sistema', hasUnsavedChanges: false },
        { id: 'tab_note_visao', type: 'note', itemId: 'note_visao_geral', title: 'Visão Geral da Arquitetura Híbrida', hasUnsavedChanges: false },
      ]));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ID, 'tab_doc_spec');
      localStorage.setItem(STORAGE_KEYS.IS_OFFLINE_FORCED, 'false');
    }
  }

  // Current Profile
  getCurrentProfileId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE_ID) || INITIAL_PROFILES[0].id;
  }

  setCurrentProfileId(profileId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE_ID, profileId);
  }

  getProfiles(): UserProfile[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    } catch {
      return INITIAL_PROFILES;
    }
  }

  getCurrentProfile(): UserProfile {
    const list = this.getProfiles();
    const id = this.getCurrentProfileId();
    return list.find(p => p.id === id) || list[0] || INITIAL_PROFILES[0];
  }

  updateProfile(profile: UserProfile): void {
    const list = this.getProfiles();
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      list.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(list));
  }

  // Workspaces
  getWorkspaces(): Workspace[] {
    const profileId = this.getCurrentProfileId();
    try {
      const all: Workspace[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSPACES) || '[]');
      return all.filter(w => w.profileId === profileId);
    } catch {
      return [];
    }
  }

  saveWorkspace(ws: Workspace): void {
    const all: Workspace[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSPACES) || '[]');
    const idx = all.findIndex(w => w.id === ws.id);
    if (idx >= 0) {
      all[idx] = ws;
    } else {
      all.push(ws);
    }
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(all));
    this.enqueueSync('workspace', ws.id, 'CREATE', ws);
  }

  deleteWorkspace(id: string): void {
    let all: Workspace[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSPACES) || '[]');
    all = all.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(all));
    this.enqueueSync('workspace', id, 'DELETE', { id });
  }

  // Notebooks
  getNotebooks(): Notebook[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTEBOOKS) || '[]');
    } catch {
      return [];
    }
  }

  saveNotebook(nb: Notebook): void {
    const all: Notebook[] = this.getNotebooks();
    const idx = all.findIndex(n => n.id === nb.id);
    if (idx >= 0) {
      all[idx] = nb;
    } else {
      all.push(nb);
    }
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(all));
    this.enqueueSync('notebook', nb.id, 'CREATE', nb);
  }

  deleteNotebook(id: string): void {
    const all = this.getNotebooks().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(all));
    this.enqueueSync('notebook', id, 'DELETE', { id });
  }

  // Folders
  getFolders(): Folder[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
    } catch {
      return [];
    }
  }

  saveFolder(folder: Folder): void {
    const all = this.getFolders();
    const idx = all.findIndex(f => f.id === folder.id);
    if (idx >= 0) {
      all[idx] = folder;
    } else {
      all.push(folder);
    }
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(all));
    this.enqueueSync('folder', folder.id, 'CREATE', folder);
  }

  deleteFolder(id: string): void {
    const all = this.getFolders().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(all));
    this.enqueueSync('folder', id, 'DELETE', { id });
  }

  // Notes (.md)
  getNotes(): Note[] {
    const profileId = this.getCurrentProfileId();
    try {
      const all: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
      return all.filter(n => n.profileId === profileId);
    } catch {
      return [];
    }
  }

  getNoteById(id: string): Note | undefined {
    return this.getNotes().find(n => n.id === id);
  }

  saveNote(note: Note): void {
    const all: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
    const now = new Date().toISOString();
    const updatedNote = {
      ...note,
      updatedAt: now,
      wordCount: note.content.trim() ? note.content.trim().split(/\s+/).length : 0,
    };
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      all[idx] = updatedNote;
    } else {
      all.push(updatedNote);
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
    this.enqueueSync('note', note.id, 'UPDATE', updatedNote);
    this.logActivity('edit', note.title, 'note', `Nota "${note.title}" salva com sucesso`);
  }

  trashNote(id: string): void {
    const note = this.getNoteById(id);
    if (!note) return;
    this.saveNote({ ...note, isDeleted: true, deletedAt: new Date().toISOString() });
    this.logActivity('delete', note.title, 'note', `Nota movida para a lixeira`);
  }

  restoreNote(id: string): void {
    const note = this.getNoteById(id);
    if (!note) return;
    this.saveNote({ ...note, isDeleted: false, deletedAt: null });
    this.logActivity('restore', note.title, 'note', `Nota restaurada da lixeira`);
  }

  permanentlyDeleteNote(id: string): void {
    let all: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
    all = all.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
    this.enqueueSync('note', id, 'DELETE', { id });
  }

  // Documents (Word AST)
  getDocuments(): TraditionalDocument[] {
    const profileId = this.getCurrentProfileId();
    try {
      const all: TraditionalDocument[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
      return all.filter(d => d.profileId === profileId);
    } catch {
      return [];
    }
  }

  getDocumentById(id: string): TraditionalDocument | undefined {
    return this.getDocuments().find(d => d.id === id);
  }

  saveDocument(doc: TraditionalDocument): void {
    const all: TraditionalDocument[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    const now = new Date().toISOString();
    
    // Calculate word count from AST nodes
    let words = 0;
    doc.ast.nodes.forEach(node => {
      if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'callout') {
        const text = (node as any).text || '';
        words += text.trim() ? text.trim().split(/\s+/).length : 0;
      }
    });

    // Approximate page count based on page breaks + node density
    let pageCount = 1;
    doc.ast.nodes.forEach(n => {
      if (n.type === 'page_break') pageCount++;
    });

    const updatedDoc: TraditionalDocument = {
      ...doc,
      updatedAt: now,
      wordCount: words,
      pageCount: Math.max(1, pageCount),
      ast: {
        ...doc.ast,
        metadata: {
          ...doc.ast.metadata,
          lastModifiedBy: this.getCurrentProfile().displayName,
          wordCount: words,
          charCount: words * 6,
        },
      },
    };

    const idx = all.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      all[idx] = updatedDoc;
    } else {
      all.push(updatedDoc);
    }
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(all));
    this.enqueueSync('document', doc.id, 'UPDATE', updatedDoc);
    this.logActivity('edit', doc.title, 'document', `Documento tradicional "${doc.title}" atualizado`);
  }

  trashDocument(id: string): void {
    const doc = this.getDocumentById(id);
    if (!doc) return;
    this.saveDocument({ ...doc, isDeleted: true, deletedAt: new Date().toISOString() });
    this.logActivity('delete', doc.title, 'document', `Documento movido para a lixeira`);
  }

  restoreDocument(id: string): void {
    const doc = this.getDocumentById(id);
    if (!doc) return;
    this.saveDocument({ ...doc, isDeleted: false, deletedAt: null });
    this.logActivity('restore', doc.title, 'document', `Documento restaurado da lixeira`);
  }

  permanentlyDeleteDocument(id: string): void {
    let all: TraditionalDocument[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    all = all.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(all));
    this.enqueueSync('document', id, 'DELETE', { id });
  }

  // Versioning
  createSnapshot(itemId: string, itemType: 'note' | 'document', summary: string): void {
    const versions: VersionSnapshot[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VERSIONS) || '[]');
    let title = '';
    let snapshot: any = null;

    if (itemType === 'note') {
      const note = this.getNoteById(itemId);
      if (note) {
        title = note.title;
        snapshot = note.content;
      }
    } else {
      const doc = this.getDocumentById(itemId);
      if (doc) {
        title = doc.title;
        snapshot = doc.ast;
      }
    }

    if (!snapshot) return;

    const newVersion: VersionSnapshot = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      itemId,
      itemType,
      title,
      contentSnapshot: snapshot,
      timestamp: new Date().toISOString(),
      savedBy: this.getCurrentProfile().displayName,
      changeSummary: summary,
    };

    versions.unshift(newVersion);
    const filtered = versions.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(filtered));
  }

  getVersionsForItem(itemId: string): VersionSnapshot[] {
    try {
      const versions: VersionSnapshot[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VERSIONS) || '[]');
      return versions.filter(v => v.itemId === itemId);
    } catch {
      return [];
    }
  }

  // Tabs Management
  getTabs(): EditorTab[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TABS) || '[]');
    } catch {
      return [];
    }
  }

  saveTabs(tabs: EditorTab[]): void {
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
  }

  getActiveTabId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB_ID);
  }

  setActiveTabId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB_ID);
    }
  }

  // Offline and Sync Queue
  isOfflineForced(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_OFFLINE_FORCED) === 'true';
  }

  setOfflineForced(forced: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_OFFLINE_FORCED, forced ? 'true' : 'false');
  }

  getSyncQueue(): SyncQueueItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '[]');
    } catch {
      return [];
    }
  }

  enqueueSync(
    itemType: SyncQueueItem['itemType'],
    itemId: string,
    operation: SyncQueueItem['operation'],
    payload: any
  ): void {
    const queue = this.getSyncQueue();
    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      profileId: this.getCurrentProfileId(),
      itemId,
      itemType,
      operation,
      payload,
      status: this.isOfflineForced() ? 'PENDING' : 'SYNCED',
      createdAt: new Date().toISOString(),
      attemptCount: 1,
    };
    queue.push(newItem);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue.slice(-50)));
  }

  clearSyncedQueue(): void {
    const queue = this.getSyncQueue().filter(q => q.status !== 'SYNCED');
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  processSyncQueue(): { syncedCount: number; errors: number } {
    const queue = this.getSyncQueue();
    let syncedCount = 0;
    queue.forEach(item => {
      if (item.status === 'PENDING') {
        item.status = 'SYNCED';
        syncedCount++;
      }
    });
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

    // Update cloud state
    const cloud = this.getCloudAccount();
    cloud.lastSyncedAt = new Date().toISOString();
    this.saveCloudAccount(cloud);

    this.logActivity('sync', 'Google Drive', 'sync', `Sincronizados ${syncedCount} itens pendentes com sucesso.`);
    return { syncedCount, errors: 0 };
  }

  // Cloud Account
  getCloudAccount(): CloudAccount {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOUD_ACCOUNT) || JSON.stringify(INITIAL_CLOUD_ACCOUNT));
    } catch {
      return INITIAL_CLOUD_ACCOUNT;
    }
  }

  saveCloudAccount(acc: CloudAccount): void {
    localStorage.setItem(STORAGE_KEYS.CLOUD_ACCOUNT, JSON.stringify(acc));
  }

  // Activities
  getActivities(): ActivityLog[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    } catch {
      return [];
    }
  }

  logActivity(type: ActivityLog['type'], itemTitle: string, itemType: string, description: string): void {
    const list = this.getActivities();
    const entry: ActivityLog = {
      id: `act_${Date.now()}`,
      type,
      itemTitle,
      itemType,
      timestamp: new Date().toISOString(),
      description,
    };
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list.slice(0, 40)));
  }

  // Reset to sample data
  resetDatabase(): void {
    localStorage.clear();
    this.ensureInitialized();
  }
}

export const storage = new StorageService();
