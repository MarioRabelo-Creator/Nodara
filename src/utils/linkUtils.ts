/**
 * Link & Tag Utilities
 * Handles:
 * - Parsing Obsidian-style [[WikiLinks]]
 * - Parsing #tags
 * - Graph nodes & edges resolution for Graph View
 * - Backlinks lookup
 */

import { Note, TraditionalDocument } from '../types';

export interface GraphNode {
  id: string;
  title: string;
  type: 'note' | 'document' | 'tag';
  val: number; // importance / degree
  color?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export function extractWikiLinks(text: string): string[] {
  const matches = text.match(/\[\[(.*?)\]\]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(2, -2).trim()).filter(Boolean);
}

export function extractTags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_\-]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.slice(1).toLowerCase())));
}

export function buildGraph(
  notes: Note[],
  documents: TraditionalDocument[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const tagSet = new Set<string>();

  // Add notes
  notes.forEach(note => {
    if (note.isDeleted) return;
    nodesMap.set(note.id, {
      id: note.id,
      title: note.title,
      type: 'note',
      val: 8,
      color: '#10b981', // Emerald for Markdown Notes
    });
    note.tags.forEach(t => tagSet.add(t));
  });

  // Add documents
  documents.forEach(doc => {
    if (doc.isDeleted) return;
    nodesMap.set(doc.id, {
      id: doc.id,
      title: doc.title,
      type: 'document',
      val: 10,
      color: '#3b82f6', // Indigo/Blue for Word AST Docs
    });
  });

  // Helper title lookup
  const titleToIdMap = new Map<string, string>();
  notes.forEach(n => !n.isDeleted && titleToIdMap.set(n.title.toLowerCase(), n.id));
  documents.forEach(d => !d.isDeleted && titleToIdMap.set(d.title.toLowerCase(), d.id));

  // Connect notes
  notes.forEach(note => {
    if (note.isDeleted) return;
    const links = extractWikiLinks(note.content);
    links.forEach(targetTitle => {
      const targetId = titleToIdMap.get(targetTitle.toLowerCase());
      if (targetId && targetId !== note.id) {
        edges.push({
          id: `${note.id}->${targetId}`,
          source: note.id,
          target: targetId,
        });
        const targetNode = nodesMap.get(targetId);
        if (targetNode) targetNode.val += 2;
      }
    });

    // Tag edges
    note.tags.forEach(tag => {
      const tagId = `tag_${tag}`;
      if (!nodesMap.has(tagId)) {
        nodesMap.set(tagId, {
          id: tagId,
          title: `#${tag}`,
          type: 'tag',
          val: 5,
          color: '#f59e0b', // Amber for Tags
        });
      }
      edges.push({
        id: `${note.id}->${tagId}`,
        source: note.id,
        target: tagId,
      });
    });
  });

  // Connect documents AST text
  documents.forEach(doc => {
    if (doc.isDeleted) return;
    let docFullText = '';
    doc.ast.nodes.forEach(n => {
      if ((n as any).text) docFullText += ' ' + (n as any).text;
    });
    const links = extractWikiLinks(docFullText);
    links.forEach(targetTitle => {
      const targetId = titleToIdMap.get(targetTitle.toLowerCase());
      if (targetId && targetId !== doc.id) {
        edges.push({
          id: `${doc.id}->${targetId}`,
          source: doc.id,
          target: targetId,
        });
        const targetNode = nodesMap.get(targetId);
        if (targetNode) targetNode.val += 2;
      }
    });
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}

export function findBacklinks(
  targetTitle: string,
  targetId: string,
  notes: Note[],
  documents: TraditionalDocument[]
): { id: string; title: string; type: 'note' | 'document'; snippet: string }[] {
  const results: { id: string; title: string; type: 'note' | 'document'; snippet: string }[] = [];
  const query = `[[${targetTitle}]]`.toLowerCase();

  notes.forEach(note => {
    if (note.id === targetId || note.isDeleted) return;
    if (note.content.toLowerCase().includes(query)) {
      // Find snippet around match
      const idx = note.content.toLowerCase().indexOf(query);
      const start = Math.max(0, idx - 40);
      const end = Math.min(note.content.length, idx + query.length + 60);
      const snippet = '...' + note.content.substring(start, end).replace(/\n/g, ' ') + '...';
      results.push({
        id: note.id,
        title: note.title,
        type: 'note',
        snippet,
      });
    }
  });

  documents.forEach(doc => {
    if (doc.id === targetId || doc.isDeleted) return;
    let combined = '';
    doc.ast.nodes.forEach(n => {
      if ((n as any).text) combined += ' ' + (n as any).text;
    });
    if (combined.toLowerCase().includes(query)) {
      const idx = combined.toLowerCase().indexOf(query);
      const start = Math.max(0, idx - 40);
      const end = Math.min(combined.length, idx + query.length + 60);
      const snippet = '...' + combined.substring(start, end).replace(/\n/g, ' ') + '...';
      results.push({
        id: doc.id,
        title: doc.title,
        type: 'document',
        snippet,
      });
    }
  });

  return results;
}
