import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bot, Clapperboard, Zap, Briefcase } from 'lucide-react';

/* ─── Theme ─── */

const T = {
  bg: '#ffffff', text: '#0a0a0a', label: '#aaa', faint: '#bbb',
  divider: '#f5f5f5', surface: '#f0f0f0',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

/* ─── Persona data (icons from ICON_MAP, matching CreateAgentView) ─── */

interface Persona {
  id: string;
  name: string;
  tagline: string;
  color: string;
  Icon: React.ElementType;
}

const PERSONAS: Persona[] = [
  {
    id: 'family-treasurer',
    name: 'Family Treasurer',
    tagline: 'Budget, bills, remittances, savings',
    color: '#3b82f6',
    Icon: Home,
  },
  {
    id: 'ai-hustle-builder',
    name: 'AI Hustle Builder',
    tagline: 'Spot AI side hustles, find clients, track income',
    color: '#6366f1',
    Icon: Bot,
  },
  {
    id: 'digital-creator-coach',
    name: 'Digital Creator Coach',
    tagline: 'Grow on TikTok, YouTube Shorts, turn followers into income',
    color: '#ef4444',
    Icon: Clapperboard,
  },
  {
    id: 'vibecoder-apprentice',
    name: 'VibeCoder Apprentice',
    tagline: 'Build apps fast with no-code, ship MVPs in hours',
    color: '#8b5cf6',
    Icon: Zap,
  },
  {
    id: 'gig-economy-maximizer',
    name: 'Gig Economy Maximizer',
    tagline: 'Optimize Upwork/Fiverr, land high-paying AI gigs',
    color: '#f59e0b',
    Icon: Briefcase,
  },
];

/* ─── Loading spinner ─── */

function Spinner({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: `2px solid ${color}30`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Persona card ─── */

function PersonaCard({
  persona,
  selected,
  launching,
  onSelect,
  index,
}: {
  persona: Persona;
  selected: boolean;
  launching: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { Icon } = persona;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onSelect}
      style={{
        width: '100%',
        background: selected ? `${persona.color}08` : 'none',
        border: 'none',
        borderBottom: `1px solid ${T.divider}`,
        padding: '18px 32px 18px 36px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        textAlign: 'left',
        transition: 'background 0.2s ease',
      }}
    >
      {/* Accent strip — always visible in persona color, full opacity */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: persona.color,
        borderRadius: '0 1px 1px 0',
      }} />

      {/* Icon */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: selected ? `${persona.color}15` : T.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: selected ? persona.color : T.label,
        transition: 'background 0.2s ease, color 0.2s ease',
      }}>
        <Icon size={16} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 18,
          fontWeight: 300,
          letterSpacing: '-0.02em',
          color: T.text,
          lineHeight: 1.2,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {persona.name}
        </p>
        <p style={{
          fontSize: 11,
          fontStyle: 'italic',
          color: T.faint,
          letterSpacing: '-0.005em',
          lineHeight: 1.4,
        }}>
          {persona.tagline}
        </p>
      </div>

      {/* Launching overlay */}
      <AnimatePresence>
        {launching && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}
          >
            <Spinner color={persona.color} />
            <span style={{
              ...MONO,
              fontSize: 9,
              color: persona.color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              Launching {persona.name}…
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Root ─── */

export function OnboardingScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLaunchingId(id);
    setTimeout(() => setLaunchingId(null), 2800);
  };

  const visible = showMore ? PERSONAS : PERSONAS.slice(0, 4);

  return (
    <div style={{
      width: 390,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: T.bg,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '52px 32px 32px', flexShrink: 0 }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '-0.03em',
            color: T.text,
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          Your AI team<br />starts here.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          style={{ fontSize: 12, color: T.faint, letterSpacing: '-0.01em', lineHeight: 1.5 }}
        >
          Pick a persona. Start earning.
        </motion.p>
      </div>

      <div style={{ height: 1, background: T.divider, flexShrink: 0 }} />

      {/* Persona list */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {visible.map((persona, i) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            selected={selectedId === persona.id}
            launching={launchingId === persona.id}
            onSelect={() => handleSelect(persona.id)}
            index={i}
          />
        ))}

        {!showMore && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            onClick={() => setShowMore(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              borderBottom: `1px solid ${T.divider}`,
              padding: '16px 32px 16px 36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              position: 'relative',
            }}
          >
            {/* Gray accent strip placeholder */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              background: T.divider,
              borderRadius: '0 1px 1px 0',
            }} />
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: T.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 300, color: T.faint, letterSpacing: '-0.01em' }}>
              Show more personas
            </span>
          </motion.button>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom hint */}
      <div style={{ flexShrink: 0, padding: '12px 32px 32px', borderTop: `1px solid ${T.divider}` }}>
        <p style={{ ...MONO, fontSize: 9, color: T.faint, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          You can switch or add agents anytime
        </p>
      </div>
    </div>
  );
}
