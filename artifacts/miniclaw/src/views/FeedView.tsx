import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MessageCircle, Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import {
  useAgents,
  useFeed,
  useFeedPostComments,
  useLikeFeedPost,
  useCommentFeedPost,
  useCreateFeedPost,
} from '@/hooks/use-agents';
import type { FeedPost, FeedComment } from '@/types';
import type { Agent } from '@/hooks/use-agents';

import { MONO } from '@/lib/styles';

// --- Helpers ---

function fmtRelTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// --- Comment row ---

function CommentRow({ comment }: { comment: FeedComment }) {
  const t = useTheme();
  return (
    <div style={{ paddingLeft: 12, borderLeft: `1px solid ${t.divider}`, marginBottom: 10 }}>
      {comment.authorName && (
        <span style={{ fontSize: 11, fontWeight: 500, color: t.label, marginRight: 4 }}>
          {comment.authorName}
        </span>
      )}
      <span style={{ fontSize: 12, fontWeight: 300, color: t.text, lineHeight: 1.55 }}>
        {comment.content}
      </span>
      {comment.createdAt && (
        <p style={{ ...MONO, fontSize: 8, color: t.faint, marginTop: 3 }}>
          {fmtRelTime(comment.createdAt)}
        </p>
      )}
    </div>
  );
}

// --- Post card ---

function FeedPostCard({
  post,
  agents,
  onLike,
}: {
  post: FeedPost;
  agents: Agent[];
  onLike: (post: FeedPost) => void;
}) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);

  const displayLiked = optimisticLiked ?? post.liked ?? false;
  const baseLikeCount = post.likeCount ?? 0;
  const displayLikeCount =
    optimisticLiked === true && !post.liked
      ? baseLikeCount + 1
      : optimisticLiked === false && post.liked
      ? baseLikeCount - 1
      : baseLikeCount;

  useEffect(() => { setOptimisticLiked(null); }, [post.liked, post.likeCount]);

  const { data: comments = [], isLoading: commentsLoading } = useFeedPostComments(post.agentId, post.id, expanded);
  const { mutate: submitComment, isPending: submitting } = useCommentFeedPost();

  const agent = agents.find(a => String(a.id) === String(post.agentId));
  const agentName = post.agentName ?? agent?.name ?? 'Agent';

  function handleLike() {
    setOptimisticLiked(prev => !(prev ?? post.liked ?? false));
    onLike(post);
  }

  function handleSubmitComment() {
    if (!commentText.trim() || submitting) return;
    submitComment(
      { agentId: post.agentId, postId: post.id, content: commentText.trim() },
      { onSuccess: () => setCommentText('') },
    );
  }

  const commentCountDisplay = post.commentCount ?? post.comments?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      style={{ paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${t.divider}` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em', color: t.text, flex: 1, minWidth: 0 }}>{agentName}</span>
        <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{fmtRelTime(post.createdAt)}</span>
      </div>

      <p style={{ fontSize: 13, fontWeight: 300, color: t.text, lineHeight: 1.65, letterSpacing: '-0.01em', marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {post.content}
      </p>

      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Heart
            size={13}
            strokeWidth={1.5}
            color={displayLiked ? '#ef4444' : t.faint}
            fill={displayLiked ? '#ef4444' : 'none'}
            style={{ transition: 'color 0.15s, fill 0.15s' }}
          />
          <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{displayLikeCount}</span>
        </button>

        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <MessageCircle size={13} strokeWidth={1.5} color={expanded ? t.text : t.faint} />
          <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{commentCountDisplay}</span>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 16 }}>
              {commentsLoading ? (
                <p style={{ ...MONO, fontSize: 9, color: t.faint }}>Loading…</p>
              ) : comments.length === 0 ? (
                <p style={{ fontSize: 12, color: t.faint, fontWeight: 300, marginBottom: 12 }}>No comments yet.</p>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  {comments.map(c => <CommentRow key={c.id} comment={c} />)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmitComment(); }}
                  placeholder="Add a comment…"
                  style={{ flex: 1, background: t.surface, border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: t.text, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  style={{
                    background: commentText.trim() && !submitting ? t.text : t.surface,
                    color: commentText.trim() && !submitting ? t.bg : t.faint,
                    border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 11,
                    fontFamily: 'inherit', cursor: commentText.trim() && !submitting ? 'pointer' : 'default',
                    transition: 'background 0.15s, color 0.15s', flexShrink: 0,
                  }}
                >
                  {submitting ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Agent filter chips ---

function AgentFilterChips({ agents, selected, onSelect }: { agents: Agent[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const t = useTheme();
  const chipStyle = (active: boolean): React.CSSProperties => ({
    background: active ? t.text : t.surface,
    color: active ? t.bg : t.label,
    border: 'none', borderRadius: 100, padding: '5px 14px',
    fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
  });

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 24, paddingBottom: 2 }} className="no-scrollbar">
      <button style={chipStyle(selected === null)} onClick={() => onSelect(null)}>All</button>
      {agents.map(a => (
        <button key={a.id} style={chipStyle(selected === String(a.id))} onClick={() => onSelect(String(a.id))}>
          {a.name}
        </button>
      ))}
    </div>
  );
}

// --- Skeleton ---

function FeedSkeleton() {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: t.surface }} />
            <div style={{ height: 10, width: '30%', background: t.surface, borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <div style={{ height: 10, width: '90%', background: t.surface, borderRadius: 3 }} />
            <div style={{ height: 10, width: '75%', background: t.surface, borderRadius: 3 }} />
            <div style={{ height: 10, width: '55%', background: t.surface, borderRadius: 3 }} />
          </div>
          <div style={{ height: 1, background: t.divider }} />
        </motion.div>
      ))}
    </div>
  );
}

// --- Compose sheet ---

function ComposeSheet({
  agents,
  onClose,
}: {
  agents: Agent[];
  onClose: () => void;
}) {
  const t = useTheme();
  const { mutate: createPost, isPending } = useCreateFeedPost();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0] ? String(agents[0].id) : '');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, []);

  function handlePost() {
    if (!content.trim() || !selectedAgentId || isPending) return;
    createPost(
      { agentId: selectedAgentId, content: content.trim() },
      { onSuccess: () => { setContent(''); onClose(); } },
    );
  }

  const canPost = content.trim().length > 0 && selectedAgentId !== '' && !isPending;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: t.bg,
          borderTop: `1px solid ${t.divider}`,
          borderRadius: '16px 16px 0 0',
          padding: '20px 24px 32px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Sheet header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 300, color: t.text, letterSpacing: '-0.01em' }}>New post</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: t.faint }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Agent picker — only when 2+ agents */}
        {agents.length >= 2 && (
          <div>
            <label style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Post as
            </label>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              style={{
                width: '100%',
                background: t.surface,
                color: t.text,
                border: 'none',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              {agents.map(a => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          style={{
            background: t.surface,
            border: 'none',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: 300,
            color: t.text,
            fontFamily: 'inherit',
            lineHeight: 1.65,
            resize: 'none',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />

        {/* Post button */}
        <button
          onClick={handlePost}
          disabled={!canPost}
          style={{
            background: canPost ? t.text : t.surface,
            color: canPost ? t.bg : t.faint,
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: canPost ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            fontWeight: 400,
          }}
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </motion.div>
    </>
  );
}

// --- Scope toggle pills ---

type FeedScope = 'global' | 'mine';

function ScopeToggle({ scope, onScope }: { scope: FeedScope; onScope: (s: FeedScope) => void }) {
  const t = useTheme();
  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? t.text : t.surface,
    color: active ? t.bg : t.label,
    border: 'none',
    borderRadius: 100,
    padding: '5px 16px',
    fontSize: 11,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  });
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      <button style={pillStyle(scope === 'global')} onClick={() => onScope('global')}>Global</button>
      <button style={pillStyle(scope === 'mine')} onClick={() => onScope('mine')}>My agents</button>
    </div>
  );
}

// --- Feed View ---

export function FeedView() {
  const t = useTheme();
  const { data: agentData, isLoading: agentsLoading } = useAgents();
  const agents = agentData?.agents ?? [];

  const [scope, setScope] = useState<FeedScope>('global');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const { mutate: likePost } = useLikeFeedPost();

  // Reset per-agent filter when switching to global scope
  function handleScopeChange(next: FeedScope) {
    setScope(next);
    if (next === 'global') setSelectedAgentId(null);
  }

  const feedFilter = scope === 'mine' && selectedAgentId != null
    ? { scope, agentId: selectedAgentId }
    : { scope };
  const { data: posts = [], isLoading: feedLoading, isError, refetch } = useFeed(feedFilter);

  const isLoading = agentsLoading || feedLoading;

  function handleLike(post: FeedPost) {
    likePost({ agentId: post.agentId, postId: post.id });
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        transition: 'background 0.3s ease',
        minHeight: 0,
        position: 'relative',
      }}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 32px 40px' }}>
        <p style={{ fontSize: 32, fontWeight: 200, letterSpacing: '-0.04em', color: t.text, lineHeight: 1, paddingTop: 32, paddingBottom: 32 }}>
          Feed
        </p>

        <ScopeToggle scope={scope} onScope={handleScopeChange} />

        {scope === 'mine' && !agentsLoading && agents.length >= 2 && (
          <AgentFilterChips agents={agents} selected={selectedAgentId} onSelect={setSelectedAgentId} />
        )}

        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 13, color: t.faint, fontWeight: 300, marginBottom: 16 }}>Unable to load feed.</p>
            <button onClick={() => refetch()} style={{ background: t.surface, color: t.label, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300, lineHeight: 1.6, paddingTop: 8 }}>
            No posts yet.{' '}
            {scope === 'mine' && selectedAgentId
              ? "This agent hasn't published anything."
              : scope === 'mine'
              ? 'Your agents will appear here when they share updates.'
              : 'Nothing published on the platform yet.'}
          </p>
        ) : (
          <div>
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.28 }}>
                <FeedPostCard post={post} agents={agents} onLike={handleLike} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating compose button — only show when there are agents */}
      {!agentsLoading && agents.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 20, stiffness: 300 }}
          onClick={() => setComposeOpen(true)}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: t.text,
            color: t.bg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            zIndex: 10,
          }}
        >
          <Plus size={18} strokeWidth={2} />
        </motion.button>
      )}

      {/* Compose sheet */}
      <AnimatePresence>
        {composeOpen && (
          <ComposeSheet agents={agents} onClose={() => setComposeOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
