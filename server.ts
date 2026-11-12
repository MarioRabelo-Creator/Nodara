import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface CollaboratorSession {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  documentId: string;
  activeNodeId?: string;
  lastActive: number;
}

interface SocketClient {
  ws: WebSocket;
  session: CollaboratorSession;
}

const app = express();
app.use(express.json());

const server = http.createServer(app);

// In-memory document rooms & collaboration store
const rooms = new Map<string, Set<SocketClient>>();
const commentsStore = new Map<string, any[]>();
const highlightsStore = new Map<string, any[]>();

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastToRoom(documentId: string, event: string, payload: any, senderWs?: WebSocket) {
  const room = rooms.get(documentId);
  if (!room) return;

  const message = JSON.stringify({ event, payload });
  room.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== senderWs) {
      client.ws.send(message);
    }
  });
}

function getRoomCollaborators(documentId: string): CollaboratorSession[] {
  const room = rooms.get(documentId);
  if (!room) return [];
  return Array.from(room.values()).map(c => c.session);
}

wss.on('connection', (ws: WebSocket) => {
  let clientRef: SocketClient | null = null;

  ws.on('message', (data: string) => {
    try {
      const { event, payload } = JSON.parse(data.toString());

      switch (event) {
        case 'join:room': {
          const { documentId, user } = payload;
          if (!documentId || !user) return;

          // If already in a room, leave it first
          if (clientRef && clientRef.session.documentId) {
            const oldRoom = rooms.get(clientRef.session.documentId);
            if (oldRoom) {
              oldRoom.delete(clientRef);
              broadcastToRoom(clientRef.session.documentId, 'presence:leave', {
                userId: clientRef.session.id,
              });
            }
          }

          const session: CollaboratorSession = {
            id: user.id || `collab_${Math.random().toString(36).substring(2, 7)}`,
            name: user.name || 'Usuário Convidado',
            email: user.email || 'colaborador@nodara.io',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            color: user.color || '#3b82f6',
            role: user.role || 'editor',
            documentId,
            lastActive: Date.now(),
          };

          clientRef = { ws, session };

          if (!rooms.has(documentId)) {
            rooms.set(documentId, new Set());
          }
          rooms.get(documentId)!.add(clientRef);

          // Send current room state to newly joined user
          const currentMembers = getRoomCollaborators(documentId);
          ws.send(
            JSON.stringify({
              event: 'presence:state',
              payload: {
                collaborators: currentMembers,
                comments: commentsStore.get(documentId) || [],
                highlights: highlightsStore.get(documentId) || [],
              },
            })
          );

          // Notify other participants in the room
          broadcastToRoom(documentId, 'presence:join', session, ws);
          break;
        }

        case 'cursor:update': {
          if (!clientRef) return;
          clientRef.session.activeNodeId = payload.activeNodeId;
          clientRef.session.lastActive = Date.now();
          broadcastToRoom(
            clientRef.session.documentId,
            'cursor:update',
            {
              userId: clientRef.session.id,
              activeNodeId: payload.activeNodeId,
              color: clientRef.session.color,
              name: clientRef.session.name,
            },
            ws
          );
          break;
        }

        case 'doc:update': {
          if (!clientRef) return;
          broadcastToRoom(
            clientRef.session.documentId,
            'doc:update',
            {
              documentId: clientRef.session.documentId,
              updatedBy: clientRef.session.name,
              item: payload.item,
            },
            ws
          );
          break;
        }

        case 'comment:create': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          const currentList = commentsStore.get(docId) || [];
          currentList.push(payload.comment);
          commentsStore.set(docId, currentList);

          broadcastToRoom(docId, 'comment:create', payload.comment);
          break;
        }

        case 'comment:reply': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          const currentList = commentsStore.get(docId) || [];
          const comment = currentList.find(c => c.id === payload.commentId);
          if (comment) {
            comment.replies = comment.replies || [];
            comment.replies.push(payload.reply);
          }
          commentsStore.set(docId, currentList);

          broadcastToRoom(docId, 'comment:reply', {
            commentId: payload.commentId,
            reply: payload.reply,
          });
          break;
        }

        case 'comment:resolve': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          const currentList = commentsStore.get(docId) || [];
          const comment = currentList.find(c => c.id === payload.commentId);
          if (comment) {
            comment.resolved = payload.resolved ?? true;
            comment.resolvedBy = clientRef.session.name;
          }
          commentsStore.set(docId, currentList);

          broadcastToRoom(docId, 'comment:resolve', {
            commentId: payload.commentId,
            resolved: comment ? comment.resolved : true,
          });
          break;
        }

        case 'comment:delete': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          let currentList = commentsStore.get(docId) || [];
          currentList = currentList.filter(c => c.id !== payload.commentId);
          commentsStore.set(docId, currentList);

          broadcastToRoom(docId, 'comment:delete', {
            commentId: payload.commentId,
          });
          break;
        }

        case 'highlight:create': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          const currentList = highlightsStore.get(docId) || [];
          currentList.push(payload.highlight);
          highlightsStore.set(docId, currentList);

          broadcastToRoom(docId, 'highlight:create', payload.highlight);
          break;
        }

        case 'highlight:delete': {
          if (!clientRef) return;
          const docId = clientRef.session.documentId;
          let currentList = highlightsStore.get(docId) || [];
          currentList = currentList.filter(h => h.id !== payload.highlightId);
          highlightsStore.set(docId, currentList);

          broadcastToRoom(docId, 'highlight:delete', {
            highlightId: payload.highlightId,
          });
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (clientRef && clientRef.session.documentId) {
      const room = rooms.get(clientRef.session.documentId);
      if (room) {
        room.delete(clientRef);
        broadcastToRoom(clientRef.session.documentId, 'presence:leave', {
          userId: clientRef.session.id,
        });
      }
    }
  });
});

// REST API Health & State endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Nodara', timestamp: new Date().toISOString() });
});

app.get('/api/collab/:documentId', (req, res) => {
  const { documentId } = req.params;
  res.json({
    collaborators: getRoomCollaborators(documentId),
    comments: commentsStore.get(documentId) || [],
    highlights: highlightsStore.get(documentId) || [],
  });
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Nodara server running on http://localhost:${PORT}`);
  });
}

startServer();
