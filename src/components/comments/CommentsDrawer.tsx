import React, { useState } from 'react';
import { DocumentComment, DocumentHighlight, Collaborator } from '../../types';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Trash2,
  CornerDownRight,
  Send,
  X,
  Filter,
  Highlighter,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: DocumentComment[];
  highlights: DocumentHighlight[];
  activePersona: Collaborator;
  activeNodeId?: string | null;
  onAddComment: (targetNodeId: string | undefined, selectedText: string, content: string) => void;
  onAddReply: (commentId: string, replyText: string) => void;
  onToggleResolve: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  highlights,
  activePersona,
  activeNodeId,
  onAddComment,
  onAddReply,
  onToggleResolve,
  onDeleteComment,
  onDeleteHighlight,
  onSelectNode,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'highlights'>('open');
  const [replyInputId, setReplyInputId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [showNewCommentForm, setShowNewCommentForm] = useState<boolean>(false);

  if (!isOpen) return null;

  const openComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  const displayedComments =
    filter === 'open' ? openComments : filter === 'resolved' ? resolvedComments : comments;

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    onAddComment(activeNodeId || undefined, '', newCommentText.trim());
    setNewCommentText('');
    setShowNewCommentForm(false);
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onAddReply(commentId, replyText.trim());
    setReplyText('');
    setReplyInputId(null);
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-text">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-stone-900 dark:text-white">
              Comentários & Marcações
            </h3>
            <p className="text-[11px] text-stone-500">
              {openComments.length} pendentes · {highlights.length} marcações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewCommentForm(true)}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="Novo comentário"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            title="Fechar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 px-3 pt-2 gap-1 text-xs bg-stone-50/40 dark:bg-stone-900/40">
        <button
          onClick={() => setFilter('open')}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
            filter === 'open'
              ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Pendentes ({openComments.length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
            filter === 'resolved'
              ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Resolvidos ({resolvedComments.length})
        </button>
        <button
          onClick={() => setFilter('highlights')}
          className={`px-3 py-1.5 rounded-t-lg font-medium transition-colors ${
            filter === 'highlights'
              ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 font-semibold'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Marcações ({highlights.length})
        </button>
      </div>

      {/* New Comment Box (Form) */}
      {showNewCommentForm && (
        <form
          onSubmit={handleCreateComment}
          className="p-3 border-b border-stone-200 dark:border-stone-800 bg-blue-50/40 dark:bg-blue-950/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <img
              src={activePersona.avatar}
              alt={activePersona.name}
              className="w-5 h-5 rounded-full object-cover"
              style={{ border: `2px solid ${activePersona.color}` }}
            />
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Comentando como {activePersona.name}
            </span>
          </div>
          <textarea
            rows={3}
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            placeholder="Escreva seu comentário, observação ou sugestão..."
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowNewCommentForm(false)}
              className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
            >
              <Send className="w-3 h-3" /> Comentar
            </button>
          </div>
        </form>
      )}

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {filter === 'highlights' ? (
          // Highlights List View
          highlights.length === 0 ? (
            <div className="text-center py-12 text-stone-400 flex flex-col items-center gap-2">
              <Highlighter className="w-8 h-8 opacity-40 text-amber-500" />
              <p className="text-xs">Nenhuma marcação de texto neste arquivo.</p>
              <p className="text-[11px] text-stone-400 max-w-xs">
                Selecione um trecho de texto no documento e use o botão de realce para destacar com notas.
              </p>
            </div>
          ) : (
            highlights.map(hl => (
              <div
                key={hl.id}
                onClick={() => hl.targetNodeId && onSelectNode?.(hl.targetNodeId)}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-stone-300"
                      style={{ backgroundColor: hl.color }}
                    />
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                      {hl.author.name}
                    </span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteHighlight(hl.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 p-1 transition-opacity"
                    title="Excluir marcação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  className="p-2 rounded text-xs font-serif leading-relaxed mb-2 text-stone-800 dark:text-stone-200"
                  style={{ backgroundColor: `${hl.color}40`, borderLeft: `3px solid ${hl.color}` }}
                >
                  "{hl.text}"
                </div>
                {hl.note && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 italic mb-1.5">
                    Nota: {hl.note}
                  </p>
                )}
                <span className="text-[10px] text-stone-400 font-mono">
                  {formatTimestamp(hl.createdAt)}
                </span>
              </div>
            ))
          )
        ) : (
          // Comments List View
          displayedComments.length === 0 ? (
            <div className="text-center py-12 text-stone-400 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 opacity-40 text-blue-500" />
              <p className="text-xs">
                {filter === 'open'
                  ? 'Nenhum comentário pendente.'
                  : filter === 'resolved'
                  ? 'Nenhum comentário resolvido.'
                  : 'Nenhum comentário adicionado ainda.'}
              </p>
              <button
                onClick={() => setShowNewCommentForm(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1"
              >
                + Adicionar o primeiro comentário
              </button>
            </div>
          ) : (
            displayedComments.map(comment => (
              <div
                key={comment.id}
                onClick={() => comment.targetNodeId && onSelectNode?.(comment.targetNodeId)}
                className={`p-3.5 rounded-xl border transition-all ${
                  comment.resolved
                    ? 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 opacity-75'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 shadow-xs'
                }`}
              >
                {/* Author & Actions header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      style={{ border: `2px solid ${comment.author.color}` }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                        {comment.author.name}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {formatTimestamp(comment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleResolve(comment.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        comment.resolved
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-stone-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                      title={comment.resolved ? 'Reabrir discussão' : 'Marcar como resolvido'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteComment(comment.id);
                      }}
                      className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                      title="Excluir comentário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quoted selected text (if attached to snippet) */}
                {comment.selectedText && (
                  <div className="mb-2 p-2 rounded bg-amber-50/60 dark:bg-amber-950/30 border-l-2 border-amber-400 text-[11px] text-stone-700 dark:text-stone-300 italic">
                    "{comment.selectedText}"
                  </div>
                )}

                {/* Comment Content */}
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Resolved badge if resolved */}
                {comment.resolved && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    <span>Resolvido por {comment.resolvedBy || 'Eduardo'}</span>
                  </div>
                )}

                {/* Thread Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex items-start gap-2 text-xs">
                        <img
                          src={reply.author.avatar}
                          alt={reply.author.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                          style={{ border: `1.5px solid ${reply.author.color}` }}
                        />
                        <div className="flex-1 bg-stone-50 dark:bg-stone-900/60 rounded-lg p-2 border border-stone-100 dark:border-stone-800">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-[11px] text-stone-800 dark:text-stone-200">
                              {reply.author.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {formatTimestamp(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Button or Reply Form */}
                <div className="mt-2 pt-1 flex flex-col gap-2">
                  {replyInputId === comment.id ? (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[11px] text-stone-500">
                          Respondendo como {activePersona.name}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSendReply(comment.id);
                          }}
                          placeholder="Escreva uma resposta..."
                          className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSendReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setReplyInputId(null);
                            setReplyText('');
                          }}
                          className="px-2 py-1 text-stone-400 hover:text-stone-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setReplyInputId(comment.id);
                      }}
                      className="self-start text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Responder</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-[11px] text-stone-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activePersona.color }}
          />
          <span>Você: {activePersona.name}</span>
        </div>
        <button
          onClick={() => setShowNewCommentForm(true)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          + Adicionar Comentário
        </button>
      </div>
    </div>
  );
};
