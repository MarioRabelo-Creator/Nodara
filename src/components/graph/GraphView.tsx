/**
 * Obsidian-Style Interactive Knowledge Graph
 * Visualizes bi-directional links between Markdown Notes, Word Documents, and Tags
 */

import React, { useEffect, useRef, useState } from 'react';
import { buildGraph, GraphNode, GraphEdge } from '../../utils/linkUtils';
import { Note, TraditionalDocument } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  Sparkles,
  Layers,
  FileText,
  Tag,
  Share2
} from 'lucide-react';

interface GraphViewProps {
  notes: Note[];
  documents: TraditionalDocument[];
  onOpenItem: (id: string, type: 'note' | 'document') => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  documents,
  onOpenItem,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [showTags, setShowTags] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Transform / camera state
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Build graph on data changes
  useEffect(() => {
    const raw = buildGraph(notes, documents);
    // Filter tags if disabled
    let filteredNodes = raw.nodes;
    if (!showTags) {
      filteredNodes = filteredNodes.filter(n => n.type !== 'tag');
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filteredNodes = filteredNodes.filter(n => n.title.toLowerCase().includes(q));
    }

    const validNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = raw.edges.filter(
      e => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    // Initialize random positions if not set
    const initializedNodes = filteredNodes.map((n, i) => {
      const angle = (i / filteredNodes.length) * 2 * Math.PI;
      const radius = 120 + Math.random() * 140;
      return {
        ...n,
        x: n.x ?? Math.cos(angle) * radius,
        y: n.y ?? Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initializedNodes);
    setEdges(filteredEdges);
  }, [notes, documents, showTags, searchFilter]);

  // Force-directed simulation loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      setNodes(prevNodes => {
        if (prevNodes.length === 0) return prevNodes;
        const newNodes = prevNodes.map(n => ({ ...n }));
        const nodeMap = new Map(newNodes.map(n => [n.id, n]));

        // Repulsion between nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const a = newNodes[i];
            const b = newNodes[j];
            const dx = (b.x || 0) - (a.x || 0);
            const dy = (b.y || 0) - (a.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 300) {
              const force = (300 - dist) / dist * 0.08;
              if (a !== draggedNodeRef.current) {
                a.vx = (a.vx || 0) - dx * force;
                a.vy = (a.vy || 0) - dy * force;
              }
              if (b !== draggedNodeRef.current) {
                b.vx = (b.vx || 0) + dx * force;
                b.vy = (b.vy || 0) + dy * force;
              }
            }
          }
        }

        // Attraction along edges
        edges.forEach(edge => {
          const a = nodeMap.get(edge.source);
          const b = nodeMap.get(edge.target);
          if (a && b) {
            const dx = (b.x || 0) - (a.x || 0);
            const dy = (b.y || 0) - (a.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desiredDist = 110;
            const force = (dist - desiredDist) * 0.02;

            if (a !== draggedNodeRef.current) {
              a.vx = (a.vx || 0) + (dx / dist) * force;
              a.vy = (a.vy || 0) + (dy / dist) * force;
            }
            if (b !== draggedNodeRef.current) {
              b.vx = (b.vx || 0) - (dx / dist) * force;
              b.vy = (b.vy || 0) - (dy / dist) * force;
            }
          }
        });

        // Center gravity and damping
        newNodes.forEach(n => {
          if (n === draggedNodeRef.current) return;
          const distToCenter = Math.sqrt((n.x || 0) ** 2 + (n.y || 0) ** 2) || 1;
          n.vx = (n.vx || 0) * 0.88 - ((n.x || 0) / distToCenter) * 0.3;
          n.vy = (n.vy || 0) * 0.88 - ((n.y || 0) / distToCenter) * 0.3;
          n.x = (n.x || 0) + (n.vx || 0);
          n.y = (n.y || 0) + (n.vy || 0);
        });

        return newNodes;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [edges]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.save();
    ctx.translate(width / 2 + cameraRef.current.x, height / 2 + cameraRef.current.y);
    ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

    // Draw edges
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    edges.forEach(edge => {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (a && b) {
        const isConnectedToHovered =
          hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id);

        ctx.beginPath();
        ctx.moveTo(a.x || 0, a.y || 0);
        ctx.lineTo(b.x || 0, b.y || 0);
        ctx.strokeStyle = isConnectedToHovered
          ? 'rgba(99, 102, 241, 0.8)'
          : 'rgba(160, 174, 192, 0.25)';
        ctx.lineWidth = isConnectedToHovered ? 2 : 1;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const radius = isHovered ? node.val + 4 : node.val;

      // Glow effect for hovered or key nodes
      if (isHovered) {
        ctx.shadowColor = node.color || '#3b82f6';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || '#6366f1';
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label
      ctx.font = isHovered
        ? 'bold 12px Inter, sans-serif'
        : '10px Inter, sans-serif';
      ctx.fillStyle = isHovered ? '#0f172a' : '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x || 0, (node.y || 0) + radius + 12);
    });

    ctx.restore();
  }, [nodes, edges, hoveredNode]);

  // Mouse handlers for pan, drag, and click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2 - cameraRef.current.x;
    const mouseY = e.clientY - rect.top - rect.height / 2 - cameraRef.current.y;
    const simX = mouseX / cameraRef.current.zoom;
    const simY = mouseY / cameraRef.current.zoom;

    // Check if clicked a node
    const clicked = nodes.find(n => {
      const dx = (n.x || 0) - simX;
      const dy = (n.y || 0) - simY;
      return Math.sqrt(dx * dx + dy * dy) <= n.val + 4;
    });

    if (clicked) {
      draggedNodeRef.current = clicked;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const mouseX = e.clientX - rect.left - rect.width / 2 - cameraRef.current.x;
    const mouseY = e.clientY - rect.top - rect.height / 2 - cameraRef.current.y;
    const simX = mouseX / cameraRef.current.zoom;
    const simY = mouseY / cameraRef.current.zoom;

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = simX;
      draggedNodeRef.current.y = simY;
      return;
    }

    // Hover detect
    const found = nodes.find(n => {
      const dx = (n.x || 0) - simX;
      const dy = (n.y || 0) - simY;
      return Math.sqrt(dx * dx + dy * dy) <= n.val + 4;
    });
    setHoveredNode(found || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2 - cameraRef.current.x;
    const mouseY = e.clientY - rect.top - rect.height / 2 - cameraRef.current.y;
    const simX = mouseX / cameraRef.current.zoom;
    const simY = mouseY / cameraRef.current.zoom;

    const clicked = nodes.find(n => {
      const dx = (n.x || 0) - simX;
      const dy = (n.y || 0) - simY;
      return Math.sqrt(dx * dx + dy * dy) <= n.val + 4;
    });

    if (clicked) {
      if (clicked.type === 'note') {
        onOpenItem(clicked.id, 'note');
      } else if (clicked.type === 'document') {
        onOpenItem(clicked.id, 'document');
      } else if (clicked.type === 'tag') {
        setSearchFilter(clicked.title);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    cameraRef.current.zoom = Math.max(0.3, Math.min(3, cameraRef.current.zoom * zoomFactor));
  };

  const resetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-900 text-stone-100 overflow-hidden select-none">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 shadow-xl">
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs tracking-wide uppercase text-stone-300">
            Grafo de Conexões (Obsidian Engine)
          </span>
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full font-mono">
            {nodes.length} nós • {edges.length} conexões
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Filtrar notas no grafo..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="bg-stone-950/80 backdrop-blur-md text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-xl border border-stone-800 focus:outline-none focus:border-indigo-500 w-48 shadow-lg transition-all focus:w-64"
            />
          </div>

          <button
            onClick={() => setShowTags(!showTags)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-colors ${
              showTags
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Mostrar / Ocultar nós de etiquetas"
          >
            <Tag className="w-3.5 h-3.5" />
            Etiquetas
          </button>

          <button
            onClick={resetCamera}
            className="p-1.5 bg-stone-950/80 backdrop-blur-md border border-stone-800 rounded-xl text-stone-300 hover:text-white transition-colors"
            title="Centralizar Visualização"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Legend & Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-950/85 backdrop-blur-md p-3 rounded-2xl border border-stone-800 shadow-2xl flex flex-col gap-2 text-xs text-stone-400 pointer-events-auto max-w-xs">
        <div className="font-semibold text-stone-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Legenda de Nós
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Nota .md</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span>Doc Word</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>#Etiqueta</span>
          </div>
        </div>
        <p className="text-[10px] text-stone-500 leading-relaxed border-t border-stone-800/60 pt-1.5">
          Dica: Arraste nós para reorganizar, use scroll para zoom e clique duas vezes para abrir o documento.
        </p>
      </div>

      {/* Hovered node details tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 right-4 z-10 bg-stone-950/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-indigo-500/40 shadow-2xl text-xs text-stone-200 pointer-events-none max-w-sm flex items-start gap-3 animate-fade-in">
          {hoveredNode.type === 'note' && <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {hoveredNode.type === 'document' && <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
          {hoveredNode.type === 'tag' && <Tag className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          <div>
            <div className="font-semibold text-stone-100 text-sm">{hoveredNode.title}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Tipo: {hoveredNode.type === 'note' ? 'Nota Markdown (.md)' : hoveredNode.type === 'document' ? 'Documento Tradicional (AST)' : 'Etiqueta de Conexão'}
            </div>
            <div className="text-[10px] text-indigo-400 mt-1">Clique para abrir o editor</div>
          </div>
        </div>
      )}
    </div>
  );
};
