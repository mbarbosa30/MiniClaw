import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Star,
  Bot, FileText, TrendingUp, Globe, Code2, BarChart2,
  Megaphone, Languages, Image, Music, Zap, ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import {
  useMarketplaceServices,
  usePlaceOrder,
  useMyOrders,
  useIncomingOrders,
  useOrderAction,
  useRateOrder,
} from '@/hooks/use-agents';
import type { MarketplaceService, MarketplaceOrder, MarketplaceOrderStatus } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

function fmtPrice(service: MarketplaceService): string {
  if (service.isFree) return 'Free';
  if (service.price && service.priceToken) return `${service.price} ${service.priceToken}`;
  if (service.price) return service.price;
  return 'Free';
}

function fmtRelTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  research:    Search,
  writing:     FileText,
  content:     FileText,
  trading:     TrendingUp,
  finance:     TrendingUp,
  web:         Globe,
  internet:    Globe,
  code:        Code2,
  dev:         Code2,
  development: Code2,
  data:        BarChart2,
  analytics:   BarChart2,
  marketing:   Megaphone,
  social:      Megaphone,
  translation: Languages,
  language:    Languages,
  image:       Image,
  art:         Image,
  music:       Music,
  audio:       Music,
  automation:  Zap,
  shopping:    ShoppingBag,
  commerce:    ShoppingBag,
};

function categoryIcon(cat?: string): LucideIcon {
  if (!cat) return Bot;
  const key = cat.toLowerCase().trim();
  return CATEGORY_ICONS[key] ?? Bot;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: '#f59e0b' },
  accepted:    { label: 'Accepted',    color: '#3b82f6' },
  'in-progress': { label: 'In Progress', color: '#3b82f6' },
  delivered:   { label: 'Delivered',   color: '#22c55e' },
  confirmed:   { label: 'Confirmed',   color: '#22c55e' },
  rated:       { label: 'Rated',       color: '#888888' },
  rejected:    { label: 'Rejected',    color: '#ef4444' },
};

function getStatusConfig(status: MarketplaceOrderStatus): { label: string; color: string } {
  return STATUS_CONFIG[status] ?? { label: status, color: '#888888' };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ServiceSkeleton() {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{ background: t.surface, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ height: 12, width: '60%', background: t.divider, borderRadius: 3 }} />
          <div style={{ height: 9, width: '35%', background: t.divider, borderRadius: 2 }} />
          <div style={{ height: 9, width: '80%', background: t.divider, borderRadius: 2 }} />
          <div style={{ height: 9, width: '25%', background: t.divider, borderRadius: 2 }} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({ service, onTap }: { service: MarketplaceService; onTap: () => void }) {
  const t = useTheme();
  const Icon = categoryIcon(service.category);
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onTap}
      style={{
        background: t.surface,
        border: 'none',
        borderRadius: 12,
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Row 1: icon + name + category badge + price */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, background: t.divider,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={14} strokeWidth={1.5} color={t.label} />
        </span>
        <span style={{ fontSize: 13, fontWeight: 400, color: t.text, letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {service.name}
        </span>
        {service.category && (
          <span style={{ ...MONO, fontSize: 8, color: t.faint, background: t.bg, border: `1px solid ${t.divider}`, borderRadius: 4, padding: '2px 5px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
            {service.category}
          </span>
        )}
        <span style={{ ...MONO, fontSize: 11, color: t.text, fontWeight: 400, flexShrink: 0 }}>
          {fmtPrice(service)}
        </span>
      </div>

      {/* Row 2: agent name */}
      {service.agentName && (
        <span style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 36 }}>
          by {service.agentName}
        </span>
      )}

      {/* Row 3: description */}
      {service.description && (
        <p style={{ fontSize: 11, fontWeight: 300, color: t.label, lineHeight: 1.5, paddingLeft: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
          {service.description}
        </p>
      )}

      {/* Row 4: delivery + rating (no wrapping tags) */}
      {(service.estimatedDelivery || service.averageRating != null) && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 36 }}>
          {service.estimatedDelivery && (
            <span style={{ ...MONO, fontSize: 8, color: t.faint, letterSpacing: '0.04em' }}>
              {service.estimatedDelivery}
            </span>
          )}
          {service.averageRating != null && (
            <span style={{ ...MONO, fontSize: 8, color: t.faint, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Star size={8} strokeWidth={1.5} fill="#f59e0b" color="#f59e0b" />
              {(service.averageRating as number).toFixed(1)}
              {service.ratingCount != null && <span> ({service.ratingCount})</span>}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

// ── Service detail + order sheet ──────────────────────────────────────────────

function ServiceDetailSheet({
  service,
  onClose,
}: {
  service: MarketplaceService;
  onClose: () => void;
}) {
  const t = useTheme();
  const { mutate: placeOrder, isPending, isSuccess, isError, error } = usePlaceOrder();
  const [input, setInput] = useState('');
  const [ordered, setOrdered] = useState(false);

  function handleOrder() {
    if (isPending) return;
    placeOrder(
      { serviceId: service.id, input: input.trim() || undefined },
      {
        onSuccess: () => setOrdered(true),
      },
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
      />
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
          padding: '20px 24px 40px',
          zIndex: 50,
          maxHeight: '80%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 300, color: t.text, letterSpacing: '-0.015em', lineHeight: 1.3, marginBottom: 4 }}>
              {service.name}
            </p>
            {service.agentName && (
              <span style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                by {service.agentName}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: t.faint, flexShrink: 0 }}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ ...MONO, fontSize: 13, color: t.text, fontWeight: 400 }}>{fmtPrice(service)}</span>
          {service.estimatedDelivery && (
            <span style={{ ...MONO, fontSize: 10, color: t.faint, alignSelf: 'center' }}>· {service.estimatedDelivery}</span>
          )}
        </div>

        {service.description && (
          <p style={{ fontSize: 12, fontWeight: 300, color: t.label, lineHeight: 1.65 }}>
            {service.description}
          </p>
        )}

        {service.tags && service.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {service.tags.map(tag => (
              <span key={tag} style={{ ...MONO, fontSize: 8, color: t.faint, background: t.surface, borderRadius: 4, padding: '2px 6px' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {ordered ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: t.surface, borderRadius: 10, padding: '16px', textAlign: 'center' }}
          >
            <p style={{ fontSize: 22, marginBottom: 8 }}>✓</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: t.text, letterSpacing: '-0.01em' }}>Order placed!</p>
            <p style={{ fontSize: 11, color: t.faint, fontWeight: 300, marginTop: 4 }}>You can track it in the Orders tab.</p>
          </motion.div>
        ) : (
          <>
            {service.inputSchema && Object.keys(service.inputSchema).length > 0 && (
              <div>
                <label style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                  {Object.keys(service.inputSchema).join(', ')}
                </label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe your requirements…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: t.surface, border: 'none', borderRadius: 8,
                    padding: '10px 12px', fontSize: 12, color: t.text,
                    fontFamily: 'inherit', lineHeight: 1.55, resize: 'none', outline: 'none',
                  }}
                />
              </div>
            )}

            {isError && (
              <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 300 }}>
                {(error as Error)?.message ?? 'Failed to place order.'}
              </p>
            )}

            <button
              onClick={handleOrder}
              disabled={isPending}
              style={{
                background: isPending ? t.surface : t.text,
                color: isPending ? t.faint : t.bg,
                border: 'none', borderRadius: 10, padding: '12px',
                fontSize: 13, fontFamily: 'inherit', cursor: isPending ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s', fontWeight: 400,
              }}
            >
              {isPending ? 'Placing order…' : `Order — ${fmtPrice(service)}`}
            </button>
          </>
        )}
      </motion.div>
    </>
  );
}

// ── Rating widget ──────────────────────────────────────────────────────────────

function RatingSheet({
  order,
  onClose,
}: {
  order: MarketplaceOrder;
  onClose: () => void;
}) {
  const t = useTheme();
  const { mutate: rateOrder, isPending, isSuccess } = useRateOrder();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  function handleRate() {
    if (stars === 0 || isPending) return;
    rateOrder({ orderId: order.id, rating: stars, comment: comment.trim() || undefined }, {
      onSuccess: () => setDone(true),
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: t.bg, borderTop: `1px solid ${t.divider}`,
          borderRadius: '16px 16px 0 0', padding: '20px 24px 40px',
          zIndex: 50, display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 300, color: t.text }}>Rate this order</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: t.faint }}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 22, marginBottom: 8 }}>★</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: t.text }}>Thanks for your feedback!</p>
          </motion.div>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 300, color: t.label }}>
              {order.serviceTitle ?? 'Order'} {order.providerName ? `· ${order.providerName}` : ''}
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <Star
                    size={28}
                    strokeWidth={1.5}
                    fill={n <= stars ? '#f59e0b' : 'none'}
                    color={n <= stars ? '#f59e0b' : t.faint}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Optional comment…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: t.surface, border: 'none', borderRadius: 8,
                padding: '10px 12px', fontSize: 12, color: t.text,
                fontFamily: 'inherit', lineHeight: 1.55, resize: 'none', outline: 'none',
              }}
            />

            <button
              onClick={handleRate}
              disabled={stars === 0 || isPending}
              style={{
                background: stars > 0 && !isPending ? t.text : t.surface,
                color: stars > 0 && !isPending ? t.bg : t.faint,
                border: 'none', borderRadius: 10, padding: '12px',
                fontSize: 13, fontFamily: 'inherit', cursor: stars > 0 && !isPending ? 'pointer' : 'default',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {isPending ? 'Submitting…' : 'Submit Rating'}
            </button>
          </>
        )}
      </motion.div>
    </>
  );
}

// ── Order status timeline ──────────────────────────────────────────────────────

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'pending',     label: 'Placed' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'in-progress', label: 'Working' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'rated',      label: 'Rated' },
];

const TIMELINE_ORDER = ['pending', 'accepted', 'in-progress', 'delivered', 'confirmed', 'rated'];

function OrderTimeline({ status }: { status: MarketplaceOrderStatus }) {
  const t = useTheme();
  const rejected = status === 'rejected';
  const activeIdx = TIMELINE_ORDER.indexOf(status);

  if (rejected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <span style={{ ...MONO, fontSize: 8, color: '#ef4444', letterSpacing: '0.05em' }}>Rejected</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 0, overflowX: 'auto' }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= activeIdx;
        const active = idx === activeIdx;
        const isLast = idx === TIMELINE_STEPS.length - 1;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: active ? 9 : 6,
                height: active ? 9 : 6,
                borderRadius: '50%',
                background: done ? (active ? t.text : '#22c55e') : t.divider,
                border: active ? `2px solid ${t.text}` : 'none',
                transition: 'all 0.2s',
                flexShrink: 0,
              }} />
              <span style={{
                ...MONO, fontSize: 7, color: done ? (active ? t.text : t.label) : t.divider,
                letterSpacing: '0.04em', marginTop: 3, whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 1,
                background: idx < activeIdx ? '#22c55e' : t.divider,
                margin: '0 3px', marginBottom: 14, transition: 'background 0.2s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  direction,
}: {
  order: MarketplaceOrder;
  direction: 'outgoing' | 'incoming';
}) {
  const t = useTheme();
  const { mutate: doAction, isPending } = useOrderAction();
  const [ratingOpen, setRatingOpen] = useState(false);
  const cfg = getStatusConfig(order.status);

  function action(a: 'accept' | 'reject' | 'deliver' | 'confirm') {
    if (isPending) return;
    doAction({ orderId: order.id, action: a });
  }

  const completedStatuses = ['delivered', 'confirmed', 'rated'];
  const canRate = !order.rating && completedStatuses.includes(order.status);

  return (
    <>
      <div style={{ background: t.surface, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 400, color: t.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.serviceTitle ?? `Order #${order.id.slice(-6)}`}
            </p>
            <span style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
              {direction === 'outgoing'
                ? order.providerName
                  ? <><span style={{ width: 14, height: 14, borderRadius: '50%', background: t.divider, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><User size={8} strokeWidth={1.5} color={t.label} /></span>{`from ${order.providerName}`}</>
                  : 'Outgoing'
                : order.buyerName
                  ? <><span style={{ width: 14, height: 14, borderRadius: '50%', background: t.divider, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><User size={8} strokeWidth={1.5} color={t.label} /></span>{`from ${order.buyerName}`}</>
                  : 'Incoming'
              }
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 }}>
            <span style={{
              ...MONO, fontSize: 8, color: cfg.color, background: `${cfg.color}1a`,
              border: `1px solid ${cfg.color}40`, borderRadius: 4, padding: '2px 6px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {cfg.label}
            </span>
            {order.createdAt && (
              <span style={{ ...MONO, fontSize: 8, color: t.faint }}>{fmtRelTime(order.createdAt)}</span>
            )}
          </div>
        </div>

        <OrderTimeline status={order.status} />

        {order.input && (
          <p style={{ fontSize: 11, fontWeight: 300, color: t.label, lineHeight: 1.5, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {order.input}
          </p>
        )}

        {order.output && completedStatuses.includes(order.status) && (
          <div style={{ background: t.bg, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <p style={{ ...MONO, fontSize: 8, color: t.faint, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delivery</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>{order.output}</p>
          </div>
        )}

        {order.priceCelo != null && (
          <span style={{ ...MONO, fontSize: 9, color: t.faint, display: 'block', marginBottom: 10 }}>
            {order.priceCelo} CELO{order.priceUsd != null ? ` · $${order.priceUsd.toFixed(2)}` : ''}
          </span>
        )}

        {/* Action buttons — incoming */}
        {direction === 'incoming' && order.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => action('accept')} disabled={isPending} style={btnStyle(t.text, t.bg, isPending)}>
              {isPending ? '…' : 'Accept'}
            </button>
            <button onClick={() => action('reject')} disabled={isPending} style={btnStyle(t.surface, '#ef4444', isPending)}>
              Reject
            </button>
          </div>
        )}

        {direction === 'incoming' && (order.status === 'accepted' || order.status === 'in-progress') && (
          <button onClick={() => action('deliver')} disabled={isPending} style={btnStyle(t.text, t.bg, isPending)}>
            {isPending ? '…' : 'Mark Delivered'}
          </button>
        )}

        {/* Rate buyer — incoming completed */}
        {direction === 'incoming' && canRate && (
          <button onClick={() => setRatingOpen(true)} style={btnStyle(t.surface, t.label, false)}>
            Rate buyer
          </button>
        )}

        {/* Action buttons — outgoing */}
        {direction === 'outgoing' && order.status === 'delivered' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => action('confirm')} disabled={isPending} style={btnStyle(t.text, t.bg, isPending)}>
              {isPending ? '…' : 'Confirm'}
            </button>
            {canRate && (
              <button onClick={() => setRatingOpen(true)} style={btnStyle(t.surface, t.label, false)}>
                Rate
              </button>
            )}
          </div>
        )}

        {direction === 'outgoing' && order.status !== 'delivered' && canRate && (
          <button onClick={() => setRatingOpen(true)} style={btnStyle(t.surface, t.label, false)}>
            Rate service
          </button>
        )}

        {order.rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={12} strokeWidth={1.5} fill={n <= order.rating! ? '#f59e0b' : 'none'} color={n <= order.rating! ? '#f59e0b' : t.faint} />
            ))}
            {order.ratingComment && <span style={{ fontSize: 10, color: t.faint, marginLeft: 4 }}>{order.ratingComment}</span>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {ratingOpen && <RatingSheet order={order} onClose={() => setRatingOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function btnStyle(bg: string, color: string, disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#88888820' : bg,
    color: disabled ? '#888888' : color,
    border: 'none', borderRadius: 8, padding: '8px 14px',
    fontSize: 11, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s', fontWeight: 400,
  };
}

// ── Browse tab ────────────────────────────────────────────────────────────────

function BrowseTab({ onSelectService }: { onSelectService: (s: MarketplaceService) => void }) {
  const t = useTheme();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(v: string) {
    setSearch(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(v), 400);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const { data: services = [], isLoading, isError } = useMarketplaceServices(debouncedSearch || undefined);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category).filter(Boolean) as string[]))];

  useEffect(() => {
    if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
      setActiveCategory('all');
    }
  }, [categories.join(',')]);

  const visible = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
      {/* Search bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} strokeWidth={1.5} color={t.faint} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search services…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: t.surface, border: 'none', borderRadius: 10,
            padding: '10px 12px 10px 34px', fontSize: 12, color: t.text,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); }}
            style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.faint }}
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      {!isLoading && !isError && categories.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {categories.map(cat => {
            const active = cat === activeCategory;
            const Icon = cat === 'all' ? null : categoryIcon(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  flexShrink: 0,
                  background: active ? t.text : t.surface,
                  color: active ? t.bg : t.label,
                  border: 'none', borderRadius: 20,
                  padding: '5px 10px',
                  fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
                  letterSpacing: '0.01em',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {Icon && <Icon size={11} strokeWidth={1.5} />}
                {cat === 'all' ? 'All' : cat}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <ServiceSkeleton />
      ) : isError ? (
        <p style={{ fontSize: 12, color: t.faint, fontWeight: 300 }}>Unable to load services. Check back soon.</p>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300 }}>
            {debouncedSearch ? `No services found for "${debouncedSearch}".` : activeCategory !== 'all' ? `No services in "${activeCategory}".` : 'No services listed yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(s => (
            <ServiceCard key={s.id} service={s} onTap={() => onSelectService(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrderSkeleton() {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{ background: t.surface, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 11, width: '55%', background: t.divider, borderRadius: 3 }} />
          <div style={{ height: 8, width: '30%', background: t.divider, borderRadius: 2 }} />
          <div style={{ height: 8, width: '70%', background: t.divider, borderRadius: 2 }} />
        </motion.div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const t = useTheme();
  const { data: myOrders = [], isLoading: myLoading } = useMyOrders();
  const { data: incomingOrders = [], isLoading: incomingLoading } = useIncomingOrders();
  const isLoading = myLoading || incomingLoading;

  if (isLoading) return <OrderSkeleton />;

  const hasOrders = myOrders.length > 0 || incomingOrders.length > 0;

  if (!hasOrders) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 32 }}>
        <p style={{ fontSize: 13, color: t.faint, fontWeight: 300, lineHeight: 1.65 }}>
          No orders yet. Browse services to place your first one.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {myOrders.length > 0 && (
        <>
          <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Outgoing · {myOrders.length}
          </p>
          {myOrders.map(o => <OrderCard key={o.id} order={o} direction="outgoing" />)}
        </>
      )}

      {incomingOrders.length > 0 && (
        <div style={{ marginTop: myOrders.length > 0 ? 16 : 0 }}>
          <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Incoming · {incomingOrders.length}
          </p>
          {incomingOrders.map(o => <OrderCard key={o.id} order={o} direction="incoming" />)}
        </div>
      )}
    </div>
  );
}

// ── MarketplaceView ───────────────────────────────────────────────────────────

type MarketplaceTab = 'browse' | 'orders';

export function MarketplaceView() {
  const t = useTheme();
  const [tab, setTab] = useState<MarketplaceTab>('browse');
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);

  const tabBtn = (id: MarketplaceTab, label: string): React.CSSProperties => ({
    background: tab === id ? t.text : 'none',
    color: tab === id ? t.bg : t.faint,
    border: 'none', borderRadius: 8, padding: '6px 18px',
    fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease', minHeight: 0, position: 'relative' }}>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '8px 24px 40px', overflowX: 'hidden' }}>
        <p style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.03em', color: t.text, lineHeight: 1, paddingTop: 20, marginBottom: 20 }}>
          Marketplace
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: t.surface, borderRadius: 10, padding: 4, marginBottom: 24, alignSelf: 'flex-start' }}>
          <button style={tabBtn('browse', 'Browse')} onClick={() => setTab('browse')}>Browse</button>
          <button style={tabBtn('orders', 'Orders')} onClick={() => setTab('orders')}>Orders</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'browse' ? <BrowseTab onSelectService={setSelectedService} /> : <OrdersTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedService && (
          <ServiceDetailSheet service={selectedService} onClose={() => setSelectedService(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
