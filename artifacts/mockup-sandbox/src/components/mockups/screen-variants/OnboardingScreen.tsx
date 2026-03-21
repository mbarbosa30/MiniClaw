import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bot, Clapperboard, Zap, Briefcase } from 'lucide-react';

/* ─── Theme ─── */

const T = {
  bg: '#ffffff', text: '#0a0a0a', label: '#aaa', faint: '#bbb',
  divider: '#f5f5f5', surface: '#f0f0f0',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

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

/* ─── Spinner ─── */

function Spinner({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 13,
        height: 13,
        borderRadius: '50%',
        border: `2px solid ${color}30`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Persona row ─── */

function PersonaRow({
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onSelect}
      style={{
        width: '100%',
        background: selected ? `${persona.color}07` : 'none',
        border: 'none',
        borderBottom: `1px solid ${T.divider}`,
        padding: '24px 32px 24px 20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        position: 'relative',
        textAlign: 'left',
        transition: 'background 0.2s ease',
        fontFamily: FONT,
      }}
    >
      {/* Accent strip */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: persona.color,
        borderRadius: '0 1px 1px 0',
      }} />

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
        <p style={{
          fontSize: 30,
          fontWeight: 300,
          letterSpacing: '-0.03em',
          color: T.text,
          lineHeight: 1.1,
          marginBottom: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {persona.name}
        </p>
        <p style={{
          fontSize: 12,
          fontStyle: 'italic',
          color: T.faint,
          letterSpacing: '-0.005em',
          lineHeight: 1.4,
        }}>
          {persona.tagline}
        </p>
      </div>

      {/* Right side: icon (faint) or launching state */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
        <AnimatePresence mode="wait">
          {launching && selected ? (
            <motion.div
              key="launching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
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
                Launching…
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Icon
                size={18}
                strokeWidth={1.25}
                color={selected ? persona.color : T.faint}
                style={{ transition: 'color 0.2s ease' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
      fontFamily: FONT,
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '56px 32px 28px', flexShrink: 0 }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: 34,
            fontWeight: 200,
            letterSpacing: '-0.04em',
            color: T.text,
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          Your AI team<br />starts here.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          style={{ fontSize: 13, color: T.label, letterSpacing: '-0.01em', lineHeight: 1.5 }}
        >
          Pick a persona. Start earning.
        </motion.p>
      </div>

      <div style={{ height: 1, background: T.divider, flexShrink: 0 }} />

      {/* Persona list */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {visible.map((persona, i) => (
          <PersonaRow
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
            transition={{ delay: 0.32 }}
            onClick={() => setShowMore(true)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              borderBottom: `1px solid ${T.divider}`,
              padding: '22px 32px 22px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              position: 'relative',
              fontFamily: FONT,
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: 3,
              background: T.divider,
              borderRadius: '0 1px 1px 0',
            }} />
            <span style={{
              paddingLeft: 12,
              fontSize: 26,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              color: T.faint,
            }}>
              + more personas
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
