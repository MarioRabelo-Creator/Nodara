/**
 * Nodara - Core Types & Data Models
 * Specifications updated per "ATUALIZAÇÃO DA DOCUMENTAÇÃO — NODARA":
 * - Unified single editing area (eliminated split-screen preview).
 * - Full Microsoft Word formatting: fonts, sizes, colors, highlights, alignments, spacing, indentation.
 * - Header and footer native configurations with page numbering, different first page, date fields.
 * - Removed Graph of Connections from primary navigation while preserving [[internal links]].
 * - Clean, distraction-free interface.
 */

export type ContentType = 'note' | 'document';

export interface UserProfile {
  id: string;
  googleId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'sepia';
    fontFamily: string;
    autoSaveIntervalSeconds: number;
    defaultPaperSize: 'A4' | 'Letter' | 'Legal';
    defaultPageOrientation: 'portrait' | 'landscape';
    driveSyncEnabled: boolean;
    driveFolder: string;
  };
}

export interface Workspace {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notebook {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  notebookId: string;
  parentFolderId?: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================================
   Nodara Note (.md) - Single Writing Area
   ========================================================================= */
export interface Note {
  id: string;
  profileId: string;
  notebookId: string;
  folderId?: string | null;
  title: string;
  content: string; // Markdown formatted string (.md)
  tags: string[];
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  attachments?: string[];
}

/* =========================================================================
   Traditional Document (Microsoft Word AST)
   ========================================================================= */

export type PageSize = 'A4' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'narrow' | 'moderate' | 'wide' | 'custom';

export interface PageMargins {
  top: number; // in millimeters (mm)
  bottom: number;
  left: number;
  right: number;
}

export interface PageConfig {
  paperSize: PageSize;
  orientation: PageOrientation;
  margins: PageMargins;
  marginPreset: MarginPreset;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  pageNumberFormat: 'X' | 'X_OF_Y' | 'ROMAN';
  headerAlignment: 'left' | 'center' | 'right';
  footerAlignment: 'left' | 'center' | 'right';
  differentFirstPage?: boolean;
  firstPageHeaderText?: string;
  firstPageFooterText?: string;
  showDateInHeader?: boolean;
}

export type ASTNodeType =
  | 'heading'
  | 'paragraph'
  | 'table'
  | 'image'
  | 'callout'
  | 'page_break'
  | 'section_break'
  | 'table_of_contents'
  | 'footnote';

export interface ASTBaseNode {
  id: string;
  type: ASTNodeType;
  fontFamily?: string;
  fontSize?: string; // e.g. '11pt', '12pt', '14pt', '18pt'
  color?: string; // hex color for text
  backgroundColor?: string; // hex highlight color
  lineHeight?: number; // 1.0, 1.15, 1.5, 2.0
  indent?: number; // 0, 1, 2, 3 (each is ~1.25cm)
}

export interface ASTHeadingNode extends ASTBaseNode {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface ASTParagraphNode extends ASTBaseNode {
  type: 'paragraph';
  text: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  isQuote?: boolean;
  listType?: 'none' | 'bullet' | 'number';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export interface ASTTableCell {
  id: string;
  text: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface ASTTableNode extends ASTBaseNode {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ASTImageNode extends ASTBaseNode {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
  widthPercentage?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface ASTCalloutNode extends ASTBaseNode {
  type: 'callout';
  variant: 'info' | 'warning' | 'tip' | 'quote';
  title?: string;
  text: string;
}

export interface ASTPageBreakNode extends ASTBaseNode {
  type: 'page_break';
}

export interface ASTSectionBreakNode extends ASTBaseNode {
  type: 'section_break';
  title?: string;
}

export interface ASTTableOfContentsNode extends ASTBaseNode {
  type: 'table_of_contents';
  title: string;
  maxLevel: number;
}

export interface ASTFootnoteNode extends ASTBaseNode {
  type: 'footnote';
  number: number;
  text: string;
}

export type ASTNode =
  | ASTHeadingNode
  | ASTParagraphNode
  | ASTTableNode
  | ASTImageNode
  | ASTCalloutNode
  | ASTPageBreakNode
  | ASTSectionBreakNode
  | ASTTableOfContentsNode
  | ASTFootnoteNode;

export interface DocumentAST {
  version: '1.0';
  title: string;
  metadata: {
    author: string;
    createdAt: string;
    lastModifiedBy: string;
    wordCount: number;
    charCount: number;
  };
  pageConfig: PageConfig;
  nodes: ASTNode[];
}

export interface TraditionalDocument {
  id: string;
  profileId: string;
  notebookId: string;
  folderId?: string | null;
  title: string;
  ast: DocumentAST;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  pageCount: number;
  attachments?: string[];
}

/* =========================================================================
   Internal Links & Attachments & Versions
   ========================================================================= */

export interface InternalLink {
  id: string;
  sourceId: string;
  sourceType: ContentType;
  sourceTitle: string;
  targetTitle: string;
  targetId?: string | null;
  createdAt: string;
}

export interface Attachment {
  id: string;
  profileId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
  referencedInItemIds: string[];
  createdAt: string;
}

export interface VersionSnapshot {
  id: string;
  itemId: string;
  itemType: ContentType;
  title: string;
  contentSnapshot: string | DocumentAST;
  timestamp: string;
  savedBy: string;
  changeSummary: string;
}

/* =========================================================================
   Synchronization Protocol & SQLite Emulation
   ========================================================================= */

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';

export interface SyncQueueItem {
  id: string;
  profileId: string;
  itemId: string;
  itemType: 'note' | 'document' | 'folder' | 'notebook' | 'workspace' | 'attachment';
  operation: SyncOperation;
  payload: any;
  status: SyncStatus;
  createdAt: string;
  attemptCount: number;
  error?: string;
  cloudFileId?: string;
}

export interface CloudAccount {
  email: string;
  connected: boolean;
  driveFolder: string;
  usedBytes: number;
  totalBytes: number;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

/* =========================================================================
   UI App State
   ========================================================================= */

export type ActiveView = 'dashboard' | 'editor' | 'architecture' | 'trash' | 'search';

export interface EditorTab {
  id: string;
  type: ContentType;
  itemId: string;
  title: string;
  hasUnsavedChanges: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'restore' | 'sync' | 'export';
  itemTitle: string;
  itemType: string;
  timestamp: string;
  description: string;
}
