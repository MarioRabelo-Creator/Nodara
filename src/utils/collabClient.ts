import { useState, useEffect, useCallback, useRef } from 'react';
import { Collaborator, DocumentComment, CommentReply, DocumentHighlight, UserRole } from '../types';
import { storage } from '../db/storage';

interface CollabMessage {
  event: string;
  payload: any;
}

export function useCollaboration(documentId: string, onRemoteDocUpdate?: (item: any, author: string) => void) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activePersona, setActivePersona] = useState<Collaborator>(() => storage.getActiveCollaborator());
  const [comments, setComments] = useState<DocumentComment[]>(() => storage.getComments(documentId));
  const [highlights, setHighlights] = useState<DocumentHighlight[]>(() => storage.getHighlights(documentId));
  const [activeNodeFocus, setActiveNodeFocus] = useState<Record<string, Collaborator>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const activePersonaRef = useRef<Collaborator>(activePersona);

  useEffect(() => {
    activePersonaRef.current = activePersona;
  }, [activePersona]);

  // Load from storage whenever documentId changes
  useEffect(() => {
    setComments(storage.getComments(documentId));
    setHighlights(storage.getHighlights(documentId));
    setActiveNodeFocus({});
  }, [documentId]);

  // Handle outgoing broadcast via WS and BroadcastChannel
  const sendEvent = useCallback((event: string, payload: any) => {
    const msg: CollabMessage = { event, payload };
    const serialized = JSON.stringify(msg);

    // Send through WebSocket if open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(serialized);
    }

    // Also mirror to BroadcastChannel for multi-tab zero latency
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({ event, payload, senderId: activePersonaRef.current.id, documentId });
      } catch (e) {
        // BroadcastChannel send error ignored
      }
    }
  }, [documentId]);

  // Switch persona (e.g. Eduardo, Dra. Beatriz, Carlos, Lucas)
  const switchPersona = useCallback((collabId: string) => {
    const all = storage.getCollaborators();
    const target = all.find(c => c.id === collabId);
    if (!target) return;

    storage.setActiveCollaboratorId(collabId);
    setActivePersona(target);
    activePersonaRef.current = target;

    // Notify presence change
    sendEvent('join:room', {
      documentId,
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        avatar: target.avatar,
        color: target.color,
        role: target.role,
      },
    });
  }, [documentId, sendEvent]);

  // Add Comment
  const addComment = useCallback((targetNodeId: string | undefined, selectedText: string, content: string) => {
    if (!content.trim()) return;

    const currentAuthor = activePersonaRef.current;
    const newComment: DocumentComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      documentId,
      targetNodeId,
      selectedText: selectedText || undefined,
      author: {
        id: currentAuthor.id,
        name: currentAuthor.name,
        email: currentAuthor.email,
        avatar: currentAuthor.avatar,
        color: currentAuthor.color,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    storage.saveComment(newComment);
    setComments(prev => [newComment, ...prev.filter(c => c.id !== newComment.id)]);
    sendEvent('comment:create', { comment: newComment });
  }, [documentId, sendEvent]);

  // Reply to Comment
  const addReply = useCallback((commentId: string, replyText: string) => {
    if (!replyText.trim()) return;

    const currentAuthor = activePersonaRef.current;
    const reply: CommentReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: {
        id: currentAuthor.id,
        name: currentAuthor.name,
        email: currentAuthor.email,
        avatar: currentAuthor.avatar,
        color: currentAuthor.color,
      },
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    storage.addCommentReply(commentId, reply);
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return { ...c, replies: [...c.replies, reply] };
        }
        return c;
      })
    );
    sendEvent('comment:reply', { commentId, reply });
  }, [sendEvent]);

  // Toggle Resolve Comment
  const toggleResolveComment = useCallback((commentId: string) => {
    const currentAuthor = activePersonaRef.current;
    storage.resolveComment(commentId, currentAuthor.name);

    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const resolved = !c.resolved;
          return {
            ...c,
            resolved,
            resolvedBy: resolved ? currentAuthor.name : undefined,
            resolvedAt: resolved ? new Date().toISOString() : undefined,
          };
        }
        return c;
      })
    );

    const comment = storage.getComments(documentId).find(c => c.id === commentId);
    sendEvent('comment:resolve', { commentId, resolved: comment ? comment.resolved : true });
  }, [documentId, sendEvent]);

  // Delete Comment
  const deleteComment = useCallback((commentId: string) => {
    storage.deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    sendEvent('comment:delete', { commentId });
  }, [sendEvent]);

  // Add Highlight
  const addHighlight = useCallback((targetNodeId: string | undefined, text: string, color: string, note?: string) => {
    if (!text.trim()) return;

    const currentAuthor = activePersonaRef.current;
    const newHighlight: DocumentHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      documentId,
      targetNodeId,
      text: text.trim(),
      color: color || '#fef08a',
      note: note?.trim() || undefined,
      author: {
        id: currentAuthor.id,
        name: currentAuthor.name,
        color: currentAuthor.color,
      },
      createdAt: new Date().toISOString(),
    };

    storage.saveHighlight(newHighlight);
    setHighlights(prev => [newHighlight, ...prev.filter(h => h.id !== newHighlight.id)]);
    sendEvent('highlight:create', { highlight: newHighlight });
  }, [documentId, sendEvent]);

  // Delete Highlight
  const deleteHighlight = useCallback((highlightId: string) => {
    storage.deleteHighlight(highlightId);
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    sendEvent('highlight:delete', { highlightId });
  }, [sendEvent]);

  // Broadcast Node Focus (shows who is actively editing or hovering a paragraph/section)
  const setFocusedNode = useCallback((activeNodeId: string | null) => {
    sendEvent('cursor:update', { activeNodeId });
  }, [sendEvent]);

  // Broadcast Document Change
  const broadcastDocUpdate = useCallback((item: any) => {
    sendEvent('doc:update', { item });
  }, [sendEvent]);

  // WebSocket & BroadcastChannel initialization
  useEffect(() => {
    if (!documentId) return;

    // 1. Set up BroadcastChannel for instant local cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('nodara_collab_bus');
        broadcastRef.current = bc;
        bc.onmessage = (event) => {
          const data = event.data;
          if (!data || data.documentId !== documentId) return;
          if (data.senderId === activePersonaRef.current.id) return; // avoid echo

          switch (data.event) {
            case 'comment:create':
              setComments(prev => [data.payload.comment, ...prev.filter(c => c.id !== data.payload.comment.id)]);
              break;
            case 'comment:reply':
              setComments(prev =>
                prev.map(c =>
                  c.id === data.payload.commentId ? { ...c, replies: [...c.replies, data.payload.reply] } : c
                )
              );
              break;
            case 'comment:resolve':
              setComments(prev =>
                prev.map(c =>
                  c.id === data.payload.commentId ? { ...c, resolved: data.payload.resolved } : c
                )
              );
              break;
            case 'comment:delete':
              setComments(prev => prev.filter(c => c.id !== data.payload.commentId));
              break;
            case 'highlight:create':
              setHighlights(prev => [data.payload.highlight, ...prev.filter(h => h.id !== data.payload.highlight.id)]);
              break;
            case 'highlight:delete':
              setHighlights(prev => prev.filter(h => h.id !== data.payload.highlightId));
              break;
            case 'cursor:update':
              setActiveNodeFocus(prev => {
                const next = { ...prev };
                if (data.payload.activeNodeId) {
                  next[data.payload.activeNodeId] = {
                    id: data.payload.userId,
                    name: data.payload.name,
                    color: data.payload.color,
                  } as Collaborator;
                }
                return next;
              });
              break;
            case 'doc:update':
              if (onRemoteDocUpdate && data.payload.item) {
                onRemoteDocUpdate(data.payload.item, data.payload.updatedBy);
              }
              break;
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }

    // 2. Set up WebSocket connection
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          const currentAuthor = activePersonaRef.current;
          ws?.send(
            JSON.stringify({
              event: 'join:room',
              payload: {
                documentId,
                user: {
                  id: currentAuthor.id,
                  name: currentAuthor.name,
                  email: currentAuthor.email,
                  avatar: currentAuthor.avatar,
                  color: currentAuthor.color,
                  role: currentAuthor.role,
                },
              },
            })
          );
        };

        ws.onmessage = (msgEvent) => {
          try {
            const data: CollabMessage = JSON.parse(msgEvent.data);
            switch (data.event) {
              case 'presence:state': {
                const collabs: Collaborator[] = data.payload.collaborators || [];
                // Combine with known collaborators from storage
                const allKnown = storage.getCollaborators();
                const mergedMap = new Map<string, Collaborator>();
                allKnown.forEach(k => mergedMap.set(k.id, k));
                collabs.forEach(c => mergedMap.set(c.id, { ...mergedMap.get(c.id), ...c }));
                setCollaborators(Array.from(mergedMap.values()));
                break;
              }
              case 'presence:join': {
                const newMember: Collaborator = data.payload;
                setCollaborators(prev => {
                  const filtered = prev.filter(c => c.id !== newMember.id);
                  return [...filtered, newMember];
                });
                break;
              }
              case 'presence:leave': {
                const { userId } = data.payload;
                setCollaborators(prev => prev.filter(c => c.id !== userId));
                setActiveNodeFocus(prev => {
                  const next = { ...prev };
                  Object.keys(next).forEach(k => {
                    if (next[k]?.id === userId) delete next[k];
                  });
                  return next;
                });
                break;
              }
              case 'cursor:update': {
                const { userId, activeNodeId, color, name } = data.payload;
                setActiveNodeFocus(prev => {
                  const next: Record<string, Collaborator> = {};
                  // Keep others
                  Object.entries(prev).forEach(([k, v]) => {
                    if (v.id !== userId) next[k] = v;
                  });
                  if (activeNodeId) {
                    next[activeNodeId] = {
                      id: userId,
                      name,
                      color,
                    } as Collaborator;
                  }
                  return next;
                });
                break;
              }
              case 'doc:update': {
                if (onRemoteDocUpdate && data.payload.item) {
                  onRemoteDocUpdate(data.payload.item, data.payload.updatedBy);
                }
                break;
              }
              case 'comment:create': {
                const newC = data.payload;
                storage.saveComment(newC);
                setComments(prev => [newC, ...prev.filter(c => c.id !== newC.id)]);
                break;
              }
              case 'comment:reply': {
                const { commentId, reply } = data.payload;
                storage.addCommentReply(commentId, reply);
                setComments(prev =>
                  prev.map(c => (c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c))
                );
                break;
              }
              case 'comment:resolve': {
                const { commentId, resolved } = data.payload;
                setComments(prev =>
                  prev.map(c => (c.id === commentId ? { ...c, resolved } : c))
                );
                break;
              }
              case 'comment:delete': {
                const { commentId } = data.payload;
                storage.deleteComment(commentId);
                setComments(prev => prev.filter(c => c.id !== commentId));
                break;
              }
              case 'highlight:create': {
                const newH = data.payload;
                storage.saveHighlight(newH);
                setHighlights(prev => [newH, ...prev.filter(h => h.id !== newH.id)]);
                break;
              }
              case 'highlight:delete': {
                const { highlightId } = data.payload;
                storage.deleteHighlight(highlightId);
                setHighlights(prev => prev.filter(h => h.id !== highlightId));
                break;
              }
            }
          } catch (e) {
            console.error('Error handling WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws?.close();
        };
      } catch (err) {
        console.warn('WebSocket connection error:', err);
      }
    };

    connectWebSocket();

    // Default room presence initialization from storage
    setCollaborators(storage.getCollaborators());

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, [documentId, onRemoteDocUpdate]);

  return {
    isConnected,
    collaborators,
    activePersona,
    switchPersona,
    comments,
    highlights,
    activeNodeFocus,
    addComment,
    addReply,
    toggleResolveComment,
    deleteComment,
    addHighlight,
    deleteHighlight,
    setFocusedNode,
    broadcastDocUpdate,
  };
}
