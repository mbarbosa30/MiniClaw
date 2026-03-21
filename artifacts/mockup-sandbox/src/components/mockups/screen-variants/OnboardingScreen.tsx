import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Theme ─── */

const T = {
  bg: '#ffffff', text: '#0a0a0a', label: '#aaa', faint: '#bbb',
  divider: '#f5f5f5', surface: '#f0f0f0',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

/* ─── Persona data ─── */

interface Persona {
  id: string;
  name: string;
  tagline: string;
  color: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/>
    </svg>
  );
}

function ClapperIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4Z"/><path d="m4 11-.88-2.87a2 2 0 0 1 1.33-2.5l11.48-3.5a2 2 0 0 1 2.5 1.32l.87 2.87L4 11.01Z"/><path d="m6.6 4.99 3.38 4.2"/><path d="m11.86 3.38 3.38 4.2"/>
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

const PERSONAS: Persona[] = [
  {
    id: 'family-treasurer',
    name: 'Family Treasurer',
    tagline: 'Budget, bills, remittances, savings',
    color: '#3b82f6',
    icon: <HomeIcon />,
  },
  {
    id: 'ai-hustle-builder',
    name: 'AI Hustle Builder',
    tagline: 'Spot AI side hustles, find clients, track income',
    color: '#6366f1',
    icon: <BotIcon />,
  },
  {
    id: 'digital-creator-coach',
    name: 'Digital Creator Coach',
    tagline: 'Grow on TikTok, YouTube Shorts, turn followers into income',
    color: '#ef4444',
    icon: <ClapperIcon />,
  },
  {
    id: 'vibecoder-apprentice',
    name: 'VibeCoder Apprentice',
    tagline: 'Build apps fast with no-code, ship MVPs in hours',
    color: '#8b5cf6',
    icon: <ZapIcon />,
  },
  {
    id: 'gig-economy-maximizer',
    name: 'Gig Economy Maximizer',
    tagline: 'Optimize Upwork/Fiverr, land high-paying AI gigs',
    color: '#f59e0b',
    icon: <BriefcaseIcon />,
  },
];

/* ─── Loading spinner ─── */

function Spinner({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 16,
        height: 16,
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
      {/* Accent strip */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: selected ? persona.color : 'transparent',
        borderRadius: '0 1px 1px 0',
        transition: 'background 0.2s ease',
      }} />

      {/* Icon container */}
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
        {persona.icon}
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

      {/* Launching state */}
      <AnimatePresence>
        {launching && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <Spinner color={persona.color} />
            <span style={{
              ...MONO,
              fontSize: 9,
              color: persona.color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              launching…
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

      {/* Header area */}
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
          style={{
            fontSize: 12,
            color: T.faint,
            letterSpacing: '-0.01em',
            lineHeight: 1.5,
          }}
        >
          Pick a persona. Start earning.
        </motion.p>
      </div>

      {/* Divider */}
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

        {/* Show more */}
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
              padding: '16px 32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
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
            <span style={{
              fontSize: 14,
              fontWeight: 300,
              color: T.faint,
              letterSpacing: '-0.01em',
            }}>
              Show more personas
            </span>
          </motion.button>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom hint */}
      <div style={{ flexShrink: 0, padding: '12px 32px 32px', borderTop: `1px solid ${T.divider}` }}>
        <p style={{
          ...MONO,
          fontSize: 9,
          color: T.faint,
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          You can switch or add agents anytime
        </p>
      </div>
    </div>
  );
}
