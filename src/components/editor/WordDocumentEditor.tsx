/**
 * Nodara - Professional Microsoft Word-Style Document Editor
 * Features per "ATUALIZAÇÃO DA DOCUMENTAÇÃO — NODARA":
 * - Single direct editing area (no split-screen) occupying maximum available screen space
 * - Comprehensive Word ribbon:
 *   - Font families: Arial, Calibri, Aptos, Times New Roman, Georgia, Verdana, Courier New, Inter, etc.
 *   - Font sizes: 9pt, 10pt, 11pt, 12pt, 14pt, 16pt, 18pt, 24pt, 36pt
 *   - Text styles: Bold, Italic, Underline, Strikethrough, Text Color, Highlight Color
 *   - Alignments: Left, Center, Right, Justified
 *   - Paragraph spacing (1.0, 1.15, 1.5, 2.0) and Indentation (Recuo)
 *   - Bullets and Numbered lists
 *   - Tables with add/remove rows and columns
 *   - Header & Footer native configuration: text, date, page numbering (Página X de Y), different first page
 *   - Page setup: A4, Letter, Legal; Portrait / Landscape; Margins (Normal, Estreita, Moderada, Larga)
 *   - Direct click-to-edit header and footer
 *   - Export to Word (.doc), Print/PDF, and AST JSON
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  TraditionalDocument,
  ASTNode,
  ASTHeadingNode,
  ASTParagraphNode,
  ASTTableNode,
  ASTCalloutNode,
  ASTFootnoteNode,
  PageSize,
  PageOrientation,
  MarginPreset,
} from '../../types';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Table as TableIcon,
  Sparkles,
  Bookmark,
  HelpCircle,
  Settings2,
  Printer,
  Download,
  Code2,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Heading1,
  Heading2,
  Heading3,
  Maximize2,
  Eye,
  Type,
  Baseline,
  Highlighter,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { exportDocumentToWordDoc, exportDocumentToJSON, triggerPrintDialog } from '../../utils/exportUtils';

interface WordDocumentEditorProps {
  document: TraditionalDocument;
  onUpdate: (updatedDoc: TraditionalDocument) => void;
  onOpenNoteByTitle?: (title: string) => void;
}

const FONT_FAMILIES = [
  { name: 'Calibri', value: 'Calibri, sans-serif' },
  { name: 'Aptos', value: 'Aptos, system-ui, sans-serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Newsreader', value: 'Newsreader, serif' },
];

const FONT_SIZES = ['9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '36pt'];

const TEXT_COLORS = [
  '#0f172a', // Default dark
  '#1e293b',
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#475569', // Slate
];

const HIGHLIGHT_COLORS = [
  'transparent',
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#bae6fd', // Blue
  '#fbcfe8', // Pink
  '#fed7aa', // Orange
];

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  document: doc,
  onUpdate,
  onOpenNoteByTitle,
}) => {
  // Ribbon Tab selection: 'inicio' (Página Inicial), 'inserir' (Inserir), 'layout' (Layout da Página)
  const [activeRibbonTab, setActiveRibbonTab] = useState<'inicio' | 'inserir' | 'layout'>('inicio');

  // Currently active selected node for granular styling
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Global & Node formatting controls
  const [currentFont, setCurrentFont] = useState<string>('Calibri, sans-serif');
  const [currentSize, setCurrentSize] = useState<string>('11pt');
  const [currentColor, setCurrentColor] = useState<string>('#0f172a');
  const [currentHighlight, setCurrentHighlight] = useState<string>('transparent');
  const [currentLineHeight, setCurrentLineHeight] = useState<number>(1.15);

  // Modals / Drawers
  const [showPageSetupModal, setShowPageSetupModal] = useState<boolean>(false);
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState<boolean>(false);
  const [showAstInspector, setShowAstInspector] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);

  const { ast } = doc;
  const { pageConfig } = ast;

  // Split nodes into pages by 'page_break' nodes
  const pages = useMemo(() => {
    const pageBuckets: ASTNode[][] = [[]];
    ast.nodes.forEach(node => {
      if (node.type === 'page_break') {
        pageBuckets.push([]);
      } else {
        pageBuckets[pageBuckets.length - 1].push(node);
      }
    });
    return pageBuckets;
  }, [ast.nodes]);

  // Headings for Table of Contents
  const headings = useMemo(() => {
    return ast.nodes.filter(n => n.type === 'heading') as ASTHeadingNode[];
  }, [ast.nodes]);

  // Footnotes
  const footnotes = useMemo(() => {
    return ast.nodes.filter(n => n.type === 'footnote') as ASTFootnoteNode[];
  }, [ast.nodes]);

  // Update a single AST node
  const updateNode = (nodeId: string, updates: Partial<ASTNode>) => {
    const newNodes = ast.nodes.map(n => (n.id === nodeId ? ({ ...n, ...updates } as ASTNode) : n));
    onUpdate({
      ...doc,
      ast: {
        ...ast,
        nodes: newNodes,
      },
    });
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    const newNodes = ast.nodes.filter(n => n.id !== nodeId);
    onUpdate({
      ...doc,
      ast: {
        ...ast,
        nodes: newNodes,
      },
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Add node at end or after selection
  const addNode = (node: ASTNode) => {
    if (!selectedNodeId) {
      onUpdate({
        ...doc,
        ast: {
          ...ast,
          nodes: [...ast.nodes, node],
        },
      });
      setSelectedNodeId(node.id);
      return;
    }

    const idx = ast.nodes.findIndex(n => n.id === selectedNodeId);
    if (idx === -1) {
      onUpdate({
        ...doc,
        ast: { ...ast, nodes: [...ast.nodes, node] },
      });
    } else {
      const nextNodes = [...ast.nodes];
      nextNodes.splice(idx + 1, 0, node);
      onUpdate({
        ...doc,
        ast: { ...ast, nodes: nextNodes },
      });
    }
    setSelectedNodeId(node.id);
  };

  // Update pageConfig
  const updatePageConfig = (partial: Partial<typeof pageConfig>) => {
    onUpdate({
      ...doc,
      ast: {
        ...ast,
        pageConfig: {
          ...pageConfig,
          ...partial,
        },
      },
    });
  };

  // Handlers for adding items
  const handleAddParagraph = (listType: 'none' | 'bullet' | 'number' = 'none') => {
    const newNode: ASTParagraphNode = {
      id: `p_${Date.now()}`,
      type: 'paragraph',
      text: listType !== 'none' ? 'Novo item da lista' : 'Novo parágrafo de texto.',
      alignment: 'justify',
      fontFamily: currentFont,
      fontSize: currentSize,
      color: currentColor,
      backgroundColor: currentHighlight !== 'transparent' ? currentHighlight : undefined,
      lineHeight: currentLineHeight,
      listType,
      indent: 0,
    };
    addNode(newNode);
  };

  const handleAddHeading = (level: 1 | 2 | 3) => {
    const defaultSizes: Record<number, string> = { 1: '20pt', 2: '16pt', 3: '13pt' };
    const newNode: ASTHeadingNode = {
      id: `h_${Date.now()}`,
      type: 'heading',
      level,
      text: level === 1 ? 'Título da Seção' : level === 2 ? 'Subtítulo' : 'Tópico Secundário',
      alignment: 'left',
      fontFamily: currentFont,
      fontSize: defaultSizes[level],
      color: currentColor,
    };
    addNode(newNode);
  };

  const handleAddTable = () => {
    const newNode: ASTTableNode = {
      id: `tbl_${Date.now()}`,
      type: 'table',
      caption: 'Tabela de Dados',
      headers: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
      rows: [
        ['Dado A1', 'Dado A2', 'Dado A3'],
        ['Dado B1', 'Dado B2', 'Dado B3'],
      ],
    };
    addNode(newNode);
  };

  const handleAddCallout = () => {
    const newNode: ASTCalloutNode = {
      id: `callout_${Date.now()}`,
      type: 'callout',
      variant: 'info',
      title: 'Nota em Destaque',
      text: 'Insira aqui observações, diretrizes ou notas de esclarecimento.',
    };
    addNode(newNode);
  };

  const handleAddPageBreak = () => {
    addNode({
      id: `pb_${Date.now()}`,
      type: 'page_break',
    });
  };

  const handleAddFootnote = () => {
    const nextNum = footnotes.length + 1;
    const newNode: ASTFootnoteNode = {
      id: `fn_${Date.now()}`,
      type: 'footnote',
      number: nextNum,
      text: 'Referência bibliográfica ou detalhe complementar do parágrafo.',
    };
    addNode(newNode);
  };

  const handleAddToc = () => {
    addNode({
      id: `toc_${Date.now()}`,
      type: 'table_of_contents',
      title: 'Sumário',
      maxLevel: 3,
    });
  };

  // Formatting actions on the selected node
  const handleToggleBold = () => {
    if (!selectedNodeId) return;
    const node = ast.nodes.find(n => n.id === selectedNodeId) as ASTParagraphNode;
    if (node && node.type === 'paragraph') {
      updateNode(selectedNodeId, { bold: !node.bold });
    }
  };

  const handleToggleItalic = () => {
    if (!selectedNodeId) return;
    const node = ast.nodes.find(n => n.id === selectedNodeId) as ASTParagraphNode;
    if (node && node.type === 'paragraph') {
      updateNode(selectedNodeId, { italic: !node.italic });
    }
  };

  const handleToggleUnderline = () => {
    if (!selectedNodeId) return;
    const node = ast.nodes.find(n => n.id === selectedNodeId) as ASTParagraphNode;
    if (node && node.type === 'paragraph') {
      updateNode(selectedNodeId, { underline: !node.underline });
    }
  };

  const handleToggleStrikethrough = () => {
    if (!selectedNodeId) return;
    const node = ast.nodes.find(n => n.id === selectedNodeId) as ASTParagraphNode;
    if (node && node.type === 'paragraph') {
      updateNode(selectedNodeId, { strikethrough: !node.strikethrough });
    }
  };

  const handleSetAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, { alignment } as any);
  };

  const handleIndent = (dir: 1 | -1) => {
    if (!selectedNodeId) return;
    const node = ast.nodes.find(n => n.id === selectedNodeId) as any;
    if (node) {
      const current = node.indent || 0;
      updateNode(selectedNodeId, { indent: Math.max(0, Math.min(5, current + dir)) });
    }
  };

  const handleFontChange = (fontVal: string) => {
    setCurrentFont(fontVal);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { fontFamily: fontVal });
    }
  };

  const handleSizeChange = (sizeVal: string) => {
    setCurrentSize(sizeVal);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { fontSize: sizeVal });
    }
  };

  const handleColorChange = (hex: string) => {
    setCurrentColor(hex);
    setShowColorPicker(false);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { color: hex });
    }
  };

  const handleHighlightChange = (hex: string) => {
    setCurrentHighlight(hex);
    setShowHighlightPicker(false);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { backgroundColor: hex === 'transparent' ? undefined : hex });
    }
  };

  const handleLineHeightChange = (lh: number) => {
    setCurrentLineHeight(lh);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { lineHeight: lh });
    }
  };

  // Table helpers
  const handleTableCellChange = (tableNode: ASTTableNode, rIdx: number, cIdx: number, val: string) => {
    const newRows = tableNode.rows.map((row, r) =>
      r === rIdx ? row.map((cell, c) => (c === cIdx ? val : cell)) : row
    );
    updateNode(tableNode.id, { rows: newRows });
  };

  const handleTableHeaderChange = (tableNode: ASTTableNode, cIdx: number, val: string) => {
    const newHeaders = tableNode.headers.map((h, c) => (c === cIdx ? val : h));
    updateNode(tableNode.id, { headers: newHeaders });
  };

  const handleAddTableRow = (tableNode: ASTTableNode) => {
    const newRow = new Array(tableNode.headers.length).fill('Nova Célula');
    updateNode(tableNode.id, { rows: [...tableNode.rows, newRow] });
  };

  const handleAddTableCol = (tableNode: ASTTableNode) => {
    const newHeaders = [...tableNode.headers, `Col ${tableNode.headers.length + 1}`];
    const newRows = tableNode.rows.map(row => [...row, 'Item']);
    updateNode(tableNode.id, { headers: newHeaders, rows: newRows });
  };

  // Margins presets
  const handleMarginPreset = (preset: MarginPreset) => {
    const presets: Record<MarginPreset, { top: number; bottom: number; left: number; right: number }> = {
      normal: { top: 25, bottom: 25, left: 30, right: 25 },
      narrow: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 },
      moderate: { top: 25.4, bottom: 25.4, left: 19, right: 19 },
      wide: { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 },
      custom: pageConfig.margins,
    };
    updatePageConfig({
      marginPreset: preset,
      margins: presets[preset],
    });
  };

  // Dimensions
  const isLandscape = pageConfig.orientation === 'landscape';
  const pageDimensions = useMemo(() => {
    if (pageConfig.paperSize === 'A4') {
      return isLandscape ? { width: '297mm', minHeight: '210mm' } : { width: '210mm', minHeight: '297mm' };
    }
    if (pageConfig.paperSize === 'Letter') {
      return isLandscape ? { width: '11in', minHeight: '8.5in' } : { width: '8.5in', minHeight: '11in' };
    }
    return isLandscape ? { width: '14in', minHeight: '8.5in' } : { width: '8.5in', minHeight: '14in' };
  }, [pageConfig.paperSize, isLandscape]);

  // Formatted WikiLinks renderer
  const renderWithWikiLinks = (text: string) => {
    const parts = text.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.slice(2, -2);
        return (
          <button
            key={i}
            onClick={e => {
              e.stopPropagation();
              onOpenNoteByTitle?.(title);
            }}
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:underline px-1 py-0.2 rounded text-xs font-medium border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            title={`Abrir conexão: ${title}`}
          >
            [[{title}]]
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const selectedNode = ast.nodes.find(n => n.id === selectedNodeId) as any;

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900 select-text overflow-hidden">
      {/* =========================================================================
          MICROSOFT WORD RIBBON TOOLBAR (Section 4 & 5)
         ========================================================================= */}
      <div className="no-print bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 shadow-sm shrink-0 z-20">
        {/* Ribbon Tab Bar */}
        <div className="flex items-center px-4 pt-1 gap-1 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-900 text-xs">
          <button
            onClick={() => setActiveRibbonTab('inicio')}
            className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
              activeRibbonTab === 'inicio'
                ? 'bg-white dark:bg-stone-950 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Página Inicial
          </button>
          <button
            onClick={() => setActiveRibbonTab('inserir')}
            className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
              activeRibbonTab === 'inserir'
                ? 'bg-white dark:bg-stone-950 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Inserir
          </button>
          <button
            onClick={() => setActiveRibbonTab('layout')}
            className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
              activeRibbonTab === 'layout'
                ? 'bg-white dark:bg-stone-950 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Layout da Página
          </button>

          {/* Quick Right Actions (Export, Print, AST) */}
          <div className="ml-auto flex items-center gap-1.5 pb-1">
            <button
              onClick={() => exportDocumentToWordDoc(doc)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
              title="Exportar para Microsoft Word (.doc)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOCX</span>
            </button>
            <button
              onClick={triggerPrintDialog}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium shadow-sm transition-colors"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => setShowAstInspector(!showAstInspector)}
              className={`p-1 rounded-md text-xs border ${
                showAstInspector
                  ? 'bg-purple-50 text-purple-600 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
              title="Inspetor AST JSON"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ribbon Tools Container */}
        <div className="px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
          {/* TAB: PÁGINA INICIAL */}
          {activeRibbonTab === 'inicio' && (
            <>
              {/* Grupo 1: Fonte Tipográfica & Tamanho */}
              <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
                <select
                  value={currentFont}
                  onChange={e => handleFontChange(e.target.value)}
                  className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2 py-1 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none w-36"
                  title="Família da Fonte"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.name} value={f.value} style={{ fontFamily: f.value }}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={currentSize}
                  onChange={e => handleSizeChange(e.target.value)}
                  className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2 py-1 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none w-16"
                  title="Tamanho da Fonte"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grupo 2: Estilos Básicos de Texto */}
              <div className="flex items-center gap-0.5 bg-stone-50 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
                <button
                  onClick={handleToggleBold}
                  className={`p-1.5 rounded transition-colors ${
                    selectedNode?.bold
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-bold'
                      : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                  title="Negrito (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleToggleItalic}
                  className={`p-1.5 rounded transition-colors ${
                    selectedNode?.italic
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                  title="Itálico (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleToggleUnderline}
                  className={`p-1.5 rounded transition-colors ${
                    selectedNode?.underline
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                  title="Sublinhado (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleToggleStrikethrough}
                  className={`p-1.5 rounded transition-colors ${
                    selectedNode?.strikethrough
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                  title="Tachado"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                {/* Text Color Picker Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowHighlightPicker(false);
                    }}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center"
                    title="Cor da Fonte"
                  >
                    <Baseline className="w-3.5 h-3.5" style={{ color: currentColor }} />
                    <span className="w-2 h-0.5 rounded-full mt-2 -ml-3" style={{ backgroundColor: currentColor }} />
                  </button>

                  {showColorPicker && (
                    <div className="absolute left-0 top-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-2 z-50 grid grid-cols-4 gap-1.5 w-36 animate-in fade-in">
                      {TEXT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(c)}
                          className="w-6 h-6 rounded-md border border-stone-300 dark:border-stone-700 transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlight Color Picker Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowHighlightPicker(!showHighlightPicker);
                      setShowColorPicker(false);
                    }}
                    className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center"
                    title="Cor de Realce do Texto (Marca-texto)"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                  </button>

                  {showHighlightPicker && (
                    <div className="absolute left-0 top-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-2 z-50 grid grid-cols-3 gap-1.5 w-32 animate-in fade-in">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => handleHighlightChange(c)}
                          className="w-7 h-6 rounded-md border border-stone-300 dark:border-stone-700 text-[10px] flex items-center justify-center transition-transform hover:scale-105"
                          style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                        >
                          {c === 'transparent' ? '✕' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Grupo 3: Alinhamento, Recuo & Espaçamento */}
              <div className="flex items-center gap-0.5 bg-stone-50 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => handleSetAlignment('left')}
                  className={`p-1.5 rounded ${selectedNode?.alignment === 'left' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                  title="Alinhar à Esquerda"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSetAlignment('center')}
                  className={`p-1.5 rounded ${selectedNode?.alignment === 'center' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                  title="Centralizar"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSetAlignment('right')}
                  className={`p-1.5 rounded ${selectedNode?.alignment === 'right' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                  title="Alinhar à Direita"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSetAlignment('justify')}
                  className={`p-1.5 rounded ${selectedNode?.alignment === 'justify' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                  title="Justificado"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

                <button
                  onClick={() => handleIndent(-1)}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                  title="Diminuir Recuo"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleIndent(1)}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                  title="Aumentar Recuo"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

                {/* Espaçamento entre linhas */}
                <select
                  value={currentLineHeight}
                  onChange={e => handleLineHeightChange(parseFloat(e.target.value))}
                  className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-1.5 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  title="Espaçamento entre Linhas"
                >
                  <option value={1.0}>1.0</option>
                  <option value={1.15}>1.15</option>
                  <option value={1.5}>1.5</option>
                  <option value={2.0}>2.0</option>
                </select>
              </div>

              {/* Grupo 4: Estilos Rápidos (Títulos / Parágrafo) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddHeading(1)}
                  className="px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold text-stone-800 dark:text-stone-200"
                  title="Inserir Título 1"
                >
                  Título 1
                </button>
                <button
                  onClick={() => handleAddHeading(2)}
                  className="px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-300"
                  title="Inserir Título 2"
                >
                  Título 2
                </button>
                <button
                  onClick={() => handleAddParagraph('none')}
                  className="px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                  title="Inserir Parágrafo Normal"
                >
                  Normal
                </button>
              </div>
            </>
          )}

          {/* TAB: INSERIR */}
          {activeRibbonTab === 'inserir' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddTable}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
              >
                <TableIcon className="w-4 h-4 text-emerald-600" />
                Tabela
              </button>

              <button
                onClick={handleAddPageBreak}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
              >
                <Bookmark className="w-4 h-4 text-purple-600" />
                Quebra de Página
              </button>

              <button
                onClick={handleAddToc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
              >
                <List className="w-4 h-4 text-blue-600" />
                Sumário
              </button>

              <button
                onClick={handleAddCallout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Caixa de Destaque
              </button>

              <button
                onClick={handleAddFootnote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium"
              >
                <HelpCircle className="w-4 h-4 text-rose-500" />
                Nota de Rodapé
              </button>

              <button
                onClick={() => setShowHeaderFooterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium"
              >
                <Layers className="w-4 h-4" />
                Configurar Cabeçalho & Rodapé
              </button>
            </div>
          )}

          {/* TAB: LAYOUT DA PÁGINA */}
          {activeRibbonTab === 'layout' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Tamanho do papel */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Papel:</span>
                {(['A4', 'Letter', 'Legal'] as PageSize[]).map(size => (
                  <button
                    key={size}
                    onClick={() => updatePageConfig({ paperSize: size })}
                    className={`px-2.5 py-1 rounded font-medium ${
                      pageConfig.paperSize === size
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

              {/* Orientação */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Orientação:</span>
                <button
                  onClick={() => updatePageConfig({ orientation: 'portrait' })}
                  className={`px-2.5 py-1 rounded font-medium ${
                    pageConfig.orientation === 'portrait'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Retrato
                </button>
                <button
                  onClick={() => updatePageConfig({ orientation: 'landscape' })}
                  className={`px-2.5 py-1 rounded font-medium ${
                    pageConfig.orientation === 'landscape'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Paisagem
                </button>
              </div>

              <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

              {/* Margens predefinidas */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Margens:</span>
                {(['normal', 'narrow', 'moderate', 'wide'] as MarginPreset[]).map(m => (
                  <button
                    key={m}
                    onClick={() => handleMarginPreset(m)}
                    className={`px-2 py-1 rounded capitalize ${
                      pageConfig.marginPreset === m
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {m === 'normal' ? 'Normal (2.5cm/3cm)' : m === 'narrow' ? 'Estreita (1.27cm)' : m === 'moderate' ? 'Moderada' : 'Larga'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ÁREA ÚNICA DE EDIÇÃO DO DOCUMENTO (Section 3 - Single Writing Canvas)
         ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center items-start">
        <div className="flex flex-col items-center gap-8 max-w-full">
          {pages.map((pageNodes, pageIndex) => {
            const pageNumber = pageIndex + 1;
            const totalPages = pages.length;
            const isFirstPage = pageIndex === 0;

            const displayHeader =
              isFirstPage && pageConfig.differentFirstPage
                ? pageConfig.firstPageHeaderText || ''
                : pageConfig.headerText || doc.title;

            const displayFooter =
              isFirstPage && pageConfig.differentFirstPage
                ? pageConfig.firstPageFooterText || ''
                : pageConfig.footerText || 'Nodara';

            return (
              <div
                key={`page_${pageIndex}`}
                style={{
                  width: pageDimensions.width,
                  minHeight: pageDimensions.minHeight,
                  paddingTop: `${pageConfig.margins.top}mm`,
                  paddingBottom: `${pageConfig.margins.bottom}mm`,
                  paddingLeft: `${pageConfig.margins.left}mm`,
                  paddingRight: `${pageConfig.margins.right}mm`,
                  fontFamily: currentFont,
                }}
                className="doc-page relative bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col justify-between transition-all"
              >
                {/* Visual Header (Section 4.4) */}
                <div
                  onClick={() => setShowHeaderFooterModal(true)}
                  className="w-full pb-3 mb-6 border-b border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:border-blue-400 group flex items-center justify-between"
                  style={{ textAlign: pageConfig.headerAlignment }}
                >
                  <div className="flex items-center gap-2">
                    <span className="group-hover:text-blue-600 transition-colors">
                      {displayHeader || 'Clique duas vezes para editar o cabeçalho...'}
                    </span>
                    {pageConfig.showDateInHeader && (
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date().toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="text-stone-300 dark:text-stone-600 text-[10px]">
                    {isFirstPage && pageConfig.differentFirstPage ? 'Primeira Página' : ''}
                  </span>
                </div>

                {/* Content Elements Direct Editing */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* First page only: Title */}
                  {pageIndex === 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={doc.title}
                        onChange={e =>
                          onUpdate({
                            ...doc,
                            title: e.target.value,
                            ast: { ...ast, title: e.target.value },
                          })
                        }
                        className="w-full text-2xl font-bold text-stone-900 dark:text-white border-b-2 border-stone-200 dark:border-stone-700 pb-2 focus:outline-none focus:border-blue-600 bg-transparent"
                        placeholder="Título do Documento..."
                      />
                    </div>
                  )}

                  {pageNodes.map(node => {
                    const isSelected = selectedNodeId === node.id;

                    switch (node.type) {
                      case 'table_of_contents':
                        return (
                          <div
                            key={node.id}
                            className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg p-5 my-2"
                          >
                            <div className="font-bold text-base text-stone-800 dark:text-stone-200 mb-3 border-b border-stone-200 dark:border-stone-700 pb-1">
                              {node.title}
                            </div>
                            <div className="flex flex-col gap-1.5 text-xs">
                              {headings.length === 0 ? (
                                <span className="text-stone-400 italic">Nenhum título adicionado ainda.</span>
                              ) : (
                                headings.map((h, hIdx) => (
                                  <div
                                    key={h.id || hIdx}
                                    style={{ paddingLeft: `${(h.level - 1) * 16}px` }}
                                    className="flex justify-between items-center text-stone-700 dark:text-stone-300 hover:text-blue-600 cursor-pointer"
                                  >
                                    <span className="font-medium">{h.text}</span>
                                    <span className="text-stone-400 font-mono text-[10px]">Pág. 1</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );

                      case 'heading': {
                        const levelStyles = {
                          1: 'text-xl font-bold text-stone-900 dark:text-white mt-4 border-b border-stone-100 dark:border-stone-800 pb-1',
                          2: 'text-lg font-semibold text-stone-800 dark:text-stone-100 mt-3',
                          3: 'text-base font-medium text-stone-700 dark:text-stone-200 mt-2',
                          4: 'text-sm font-medium text-stone-700 dark:text-stone-300',
                          5: 'text-xs font-medium text-stone-600',
                          6: 'text-xs text-stone-500',
                        };

                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`group relative p-1 rounded-md transition-colors ${
                              isSelected ? 'ring-1 ring-blue-500 bg-blue-50/20' : 'hover:bg-stone-50/60 dark:hover:bg-stone-900/40'
                            }`}
                          >
                            <input
                              type="text"
                              value={node.text}
                              onChange={e => updateNode(node.id, { text: e.target.value })}
                              style={{
                                textAlign: node.alignment || 'left',
                                fontFamily: node.fontFamily || currentFont,
                                fontSize: node.fontSize || undefined,
                                color: node.color || undefined,
                              }}
                              className={`w-full bg-transparent focus:outline-none ${levelStyles[node.level]}`}
                              placeholder={`Título ${node.level}...`}
                            />
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              className="no-print absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded transition-opacity"
                              title="Excluir Bloco"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      case 'paragraph': {
                        const indentPx = (node.indent || 0) * 36;

                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            style={{ paddingLeft: `${indentPx}px` }}
                            className={`group relative p-1 rounded-md transition-colors ${
                              isSelected ? 'ring-1 ring-blue-500 bg-blue-50/20' : 'hover:bg-stone-50/60 dark:hover:bg-stone-900/40'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {node.listType === 'bullet' && (
                                <span className="text-stone-400 mt-1">•</span>
                              )}
                              {node.listType === 'number' && (
                                <span className="text-stone-400 font-mono mt-1 text-xs">1.</span>
                              )}
                              <textarea
                                rows={Math.max(2, Math.ceil(node.text.length / 80))}
                                value={node.text}
                                onChange={e => updateNode(node.id, { text: e.target.value })}
                                style={{
                                  textAlign: node.alignment || 'justify',
                                  fontFamily: node.fontFamily || currentFont,
                                  fontSize: node.fontSize || currentSize,
                                  color: node.color || currentColor,
                                  backgroundColor: node.backgroundColor || undefined,
                                  lineHeight: node.lineHeight || currentLineHeight,
                                  fontWeight: node.bold ? 'bold' : 'normal',
                                  fontStyle: node.italic ? 'italic' : 'normal',
                                  textDecoration: `${node.underline ? 'underline ' : ''}${node.strikethrough ? 'line-through' : ''}`.trim() || undefined,
                                }}
                                className="w-full bg-transparent focus:outline-none resize-none text-stone-800 dark:text-stone-200"
                                placeholder="Digite o parágrafo... Suporta conexões como [[Nome da Nota]]."
                              />
                            </div>

                            {/* Render wiki link badges if found */}
                            {node.text.includes('[[') && (
                              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                                {renderWithWikiLinks(node.text)}
                              </div>
                            )}

                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              className="no-print absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded transition-opacity"
                              title="Excluir Bloco"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      case 'table':
                        return (
                          <div
                            key={node.id}
                            className="group relative my-3 overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
                          >
                            {node.caption && (
                              <div className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800">
                                {node.caption}
                              </div>
                            )}
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-stone-50 dark:bg-stone-800/80">
                                  {node.headers.map((h, cIdx) => (
                                    <th
                                      key={cIdx}
                                      className="border border-stone-200 dark:border-stone-700 p-2 text-left font-semibold text-stone-800 dark:text-stone-200"
                                    >
                                      <input
                                        type="text"
                                        value={h}
                                        onChange={e => handleTableHeaderChange(node, cIdx, e.target.value)}
                                        className="w-full bg-transparent focus:outline-none"
                                      />
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {node.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={rIdx % 2 === 0 ? 'bg-white dark:bg-stone-900' : 'bg-stone-50/50 dark:bg-stone-800/40'}
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="border border-stone-200 dark:border-stone-700 p-2 text-stone-700 dark:text-stone-300"
                                      >
                                        <input
                                          type="text"
                                          value={cell}
                                          onChange={e => handleTableCellChange(node, rIdx, cIdx, e.target.value)}
                                          className="w-full bg-transparent focus:outline-none"
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="no-print p-2 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center text-xs">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleAddTableRow(node)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Linha
                                </button>
                                <button
                                  onClick={() => handleAddTableCol(node)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Coluna
                                </button>
                              </div>
                              <button
                                onClick={() => deleteNode(node.id)}
                                className="text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Excluir Tabela
                              </button>
                            </div>
                          </div>
                        );

                      case 'callout': {
                        const variantStyles = {
                          info: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-900 dark:text-blue-200',
                          warning: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200',
                          tip: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200',
                          quote: 'bg-stone-50 dark:bg-stone-800/40 border-stone-400 text-stone-800 dark:text-stone-300',
                        };

                        return (
                          <div
                            key={node.id}
                            className={`group relative p-3.5 my-2 border-l-4 rounded-r-lg text-xs ${variantStyles[node.variant]}`}
                          >
                            <input
                              type="text"
                              value={node.title || ''}
                              onChange={e => updateNode(node.id, { title: e.target.value })}
                              className="font-bold w-full bg-transparent focus:outline-none mb-1 text-xs"
                              placeholder="Título do destaque..."
                            />
                            <textarea
                              rows={2}
                              value={node.text}
                              onChange={e => updateNode(node.id, { text: e.target.value })}
                              className="w-full bg-transparent focus:outline-none resize-none leading-relaxed"
                              placeholder="Texto do destaque..."
                            />
                            <button
                              onClick={() => deleteNode(node.id)}
                              className="no-print absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      case 'footnote':
                        return (
                          <div
                            key={node.id}
                            className="group relative flex items-start gap-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 font-sans"
                          >
                            <span className="font-semibold text-stone-700 dark:text-stone-300">[{node.number}]</span>
                            <input
                              type="text"
                              value={node.text}
                              onChange={e => updateNode(node.id, { text: e.target.value })}
                              className="w-full bg-transparent focus:outline-none text-stone-600 dark:text-stone-400"
                              placeholder="Texto da nota de rodapé..."
                            />
                            <button
                              onClick={() => deleteNode(node.id)}
                              className="no-print opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>

                {/* Visual Footer (Section 4.4) */}
                <div
                  onClick={() => setShowHeaderFooterModal(true)}
                  className="w-full pt-4 mt-8 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:border-blue-400 group flex justify-between items-center"
                  style={{ textAlign: pageConfig.footerAlignment }}
                >
                  <span className="group-hover:text-blue-600 transition-colors">
                    {displayFooter || 'Clique para configurar rodapé...'}
                  </span>
                  <span>
                    {pageConfig.pageNumberFormat === 'X_OF_Y'
                      ? `Página ${pageNumber} de ${totalPages}`
                      : pageConfig.pageNumberFormat === 'ROMAN'
                      ? `Pág. ${toRoman(pageNumber)}`
                      : `Página ${pageNumber}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODAL: CONFIGURAR CABEÇALHO E RODAPÉ (Section 4.4)
         ========================================================================= */}
      {showHeaderFooterModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 text-xs text-stone-800 dark:text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-white">
                <Layers className="w-4 h-4 text-blue-600" />
                Configurar Cabeçalho e Rodapé
              </div>
              <button
                onClick={() => setShowHeaderFooterModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Text */}
            <div>
              <label className="font-semibold block mb-1">Texto do Cabeçalho</label>
              <input
                type="text"
                value={pageConfig.headerText}
                onChange={e => updatePageConfig({ headerText: e.target.value })}
                placeholder="Ex: NODARA — RELATÓRIO TÉCNICO"
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {/* Header Alignment & Date Field */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Alinhamento do Cabeçalho</label>
                <select
                  value={pageConfig.headerAlignment}
                  onChange={e => updatePageConfig({ headerAlignment: e.target.value as any })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centralizado</option>
                  <option value="right">Direita</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-date"
                  checked={!!pageConfig.showDateInHeader}
                  onChange={e => updatePageConfig({ showDateInHeader: e.target.checked })}
                  className="rounded border-stone-300 text-blue-600"
                />
                <label htmlFor="chk-date" className="font-semibold cursor-pointer">
                  Inserir data no cabeçalho
                </label>
              </div>
            </div>

            {/* Footer Text */}
            <div>
              <label className="font-semibold block mb-1">Texto do Rodapé</label>
              <input
                type="text"
                value={pageConfig.footerText}
                onChange={e => updatePageConfig({ footerText: e.target.value })}
                placeholder="Ex: Confidencial | Nodara Technologies"
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {/* Page Numbering format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Formato do Número de Página</label>
                <select
                  value={pageConfig.pageNumberFormat}
                  onChange={e => updatePageConfig({ pageNumberFormat: e.target.value as any })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="X_OF_Y">Página X de Y (Ex: Página 1 de 5)</option>
                  <option value="X">Página X (Ex: Página 1)</option>
                  <option value="ROMAN">Algarismos Romanos (Ex: Pág. I, II)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Alinhamento do Rodapé</label>
                <select
                  value={pageConfig.footerAlignment}
                  onChange={e => updatePageConfig({ footerAlignment: e.target.value as any })}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centralizado</option>
                  <option value="right">Direita</option>
                </select>
              </div>
            </div>

            {/* Different First Page (Section 4.4) */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="chk-diff-first"
                  checked={!!pageConfig.differentFirstPage}
                  onChange={e => updatePageConfig({ differentFirstPage: e.target.checked })}
                  className="rounded border-stone-300 text-blue-600"
                />
                <label htmlFor="chk-diff-first" className="font-semibold cursor-pointer">
                  Cabeçalho e rodapé diferentes na primeira página
                </label>
              </div>

              {pageConfig.differentFirstPage && (
                <div className="flex flex-col gap-2 pl-5">
                  <input
                    type="text"
                    value={pageConfig.firstPageHeaderText || ''}
                    onChange={e => updatePageConfig({ firstPageHeaderText: e.target.value })}
                    placeholder="Cabeçalho da 1ª página (ou deixe vazio para sem cabeçalho)"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={pageConfig.firstPageFooterText || ''}
                    onChange={e => updatePageConfig({ firstPageFooterText: e.target.value })}
                    placeholder="Rodapé da 1ª página"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setShowHeaderFooterModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AST JSON Live Inspector */}
      {showAstInspector && (
        <div className="no-print border-t border-stone-300 dark:border-stone-700 bg-stone-950 text-stone-200 p-4 h-64 overflow-y-auto font-mono text-xs shadow-2xl shrink-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-stone-100">Árvore Sintática Abstrata (Document AST v1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportDocumentToJSON(doc)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px]"
              >
                Baixar JSON
              </button>
              <button
                onClick={() => setShowAstInspector(false)}
                className="text-stone-500 hover:text-white px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
          <pre className="text-emerald-400 whitespace-pre-wrap">{JSON.stringify(ast, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

function toRoman(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let res = '';
  for (const [v, s] of romanMap) {
    while (num >= v) {
      res += s;
      num -= v;
    }
  }
  return res || 'I';
}
