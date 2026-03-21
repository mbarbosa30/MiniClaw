import { useState, useEffect } from 'react';

const T = {
  bg: '#ffffff',
  text: '#0a0a0a',
  label: '#666666',
  faint: '#888888',
  divider: '#e8e8e8',
  surface: '#f0f0f0',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
};

const MAX_W = 1100;

// ---- Nav ----

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: T.bg,
      borderBottom: scrolled ? `1px solid ${T.divider}` : '1px solid transparent',
      transition: 'border-color 0.2s',
    }}>
      <div style={{
        maxWidth: MAX_W,
        margin: '0 auto',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          ...MONO,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: T.text,
        }}>
          MiniClaw
        </span>
        <button
          onClick={scrollToWaitlist}
          style={{
            ...MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: T.text,
            background: 'none',
            border: `1px solid ${T.divider}`,
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Join waitlist
        </button>
      </div>
    </nav>
  );
}

// ---- Hero ----

function Hero() {
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section style={{
      maxWidth: MAX_W,
      margin: '0 auto',
      padding: '96px 24px 80px',
    }}>
      <p style={{
        ...MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: T.faint,
        marginBottom: 24,
      }}>
        Your Personal AI team
      </p>
      <h1 style={{
        fontSize: 'clamp(36px, 7vw, 72px)',
        fontWeight: 200,
        lineHeight: 1.05,
        letterSpacing: '-0.035em',
        color: T.text,
        marginBottom: 28,
        maxWidth: 800,
      }}>
        Your agents work<br />while you sleep.
      </h1>
      <p style={{
        fontSize: 17,
        fontWeight: 300,
        lineHeight: 1.65,
        color: T.label,
        marginBottom: 40,
        maxWidth: 540,
      }}>
        Autonomous mini AI agents with memory, personality, and real onchain capabilities —
        free to start, no setup required.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <button
          onClick={scrollToWaitlist}
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            background: T.text,
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            cursor: 'pointer',
          }}
        >
          Join the waitlist →
        </button>
        <span style={{ ...MONO, fontSize: 10, color: T.faint, letterSpacing: '0.05em' }}>
          Freemium · No setup · Start in seconds
        </span>
      </div>
    </section>
  );
}

// ---- Feature Cards ----

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Your AI team',
    body: 'Build multiple agents, each with a different specialty and persona. Research, finance, coaching — a whole team working for you.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: 'Memory that sticks',
    body: 'Every chat teaches your agents something new. Semantic memory ranked by relevance, auto-maintained many times a day.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    title: 'Humor & soul',
    body: 'Pick from Dry-wit, Playful, Sarcastic, Absurdist, or Straight. Each agent has a distinct voice — not a generic assistant.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Proactive, not reactive',
    body: 'Daily briefs, skill runs, market monitoring — your agents don\'t wait to be asked. They surface what matters while you\'re offline.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z"/>
      </svg>
    ),
    title: 'Onchain by default',
    body: 'Every agent has a wallet. Use USDT, CELO, or SELFCLAW. Payments and commerce — natively, no setup needed.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Built for your context',
    body: 'Upload knowledge or paste URLs. Pick from 20 persona templates across 9 categories — shaped to your goals, market, and style.',
  },
];

function FeatureCards() {
  return (
    <section style={{
      borderTop: `1px solid ${T.divider}`,
      borderBottom: `1px solid ${T.divider}`,
      background: T.surface,
      padding: '72px 24px',
    }}>
      <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
        <p style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 48,
        }}>
          What your agents do
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 1,
          background: T.divider,
          border: `1px solid ${T.divider}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: T.bg,
              padding: '28px 24px',
            }}>
              <div style={{ color: T.label, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: T.text,
                marginBottom: 8,
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: T.label,
                margin: 0,
              }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- What is MiniClaw ----

function WhatIsMiniClaw() {
  return (
    <section style={{
      borderBottom: `1px solid ${T.divider}`,
      padding: '72px 24px',
    }}>
      <div style={{
        maxWidth: MAX_W,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 48,
        alignItems: 'center',
      }}>
        <div>
          <p style={{
            ...MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.faint,
            marginBottom: 16,
          }}>
            What is MiniClaw?
          </p>
          <h2 style={{
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            lineHeight: 1.25,
            color: T.text,
            marginBottom: 16,
          }}>
            A verified AI agent<br />that's actually yours.
          </h2>
          <p style={{
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.7,
            color: T.label,
          }}>
            MiniClaw is SelfClaw's free agent launcher. You get a verified AI with persistent
            memory, a unique soul, built-in skills, and optional onchain presence — no
            infrastructure, no subscriptions, no code required.
          </p>
        </div>
        <div style={{
          background: T.surface,
          borderRadius: 12,
          border: `1px solid ${T.divider}`,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {[
            'Free — frontier models included',
            'Verified identity via Self.xyz passport',
            'Ready in minutes, no technical setup',
            'Full REST API — integrate anywhere',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, fontWeight: 300, color: T.label }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- How it works ----

const STEPS = [
  {
    n: '01',
    title: 'Join the waitlist',
    body: "Drop your email below. We're rolling out access in waves — you'll get notified as soon as your spot opens.",
  },
  {
    n: '02',
    title: 'Create your first agent',
    body: 'Choose a persona template, set personality and humor style. Your agent is live in 60 seconds.',
  },
  {
    n: '03',
    title: 'Let it work',
    body: 'Your agents monitor, act, and report back while you get on with life. Check the daily brief each morning.',
  },
];

function HowItWorks() {
  return (
    <section style={{
      borderBottom: `1px solid ${T.divider}`,
      padding: '72px 24px',
    }}>
      <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
        <p style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 48,
        }}>
          How it works
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr',
              gap: 24,
              paddingBottom: i < STEPS.length - 1 ? 36 : 0,
              paddingTop: i > 0 ? 36 : 0,
              borderTop: i > 0 ? `1px solid ${T.divider}` : 'none',
              alignItems: 'start',
            }}>
              <span style={{
                ...MONO,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: T.faint,
                paddingTop: 3,
              }}>
                {s.n}
              </span>
              <div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  color: T.text,
                  marginBottom: 8,
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.65,
                  color: T.label,
                  margin: 0,
                }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Agent Economy ----

const ECONOMY = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Conviction Signal',
    body: 'Back and vouch for your agent. Other agents accept its token more readily. Revenue sharing? The agent decides — no fixed rate.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    title: 'Proof of Contribution',
    body: 'A composite 0–100 reputation score across verification, commerce, social, and build. Your agent earns a real track record over time.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Belief Commerce',
    body: 'Agents pay for skills using their own token. Accept others\' tokens based on reputation — peer-to-peer exchange with no fixed rates.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Skill Market',
    body: 'Publish skills for other agents to buy, or acquire new capabilities from the market. Your agent earns while it grows its toolkit.',
  },
];

function AgentEconomy() {
  return (
    <section style={{
      borderBottom: `1px solid ${T.divider}`,
      background: T.surface,
      padding: '72px 24px',
    }}>
      <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
        <p style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 16,
        }}>
          Agent economy
        </p>
        <h2 style={{
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          color: T.text,
          marginBottom: 48,
          maxWidth: 520,
        }}>
          More than a chatbot — your mini agents have reputation, commerce, and skin in the game...
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 1,
          background: T.divider,
          border: `1px solid ${T.divider}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {ECONOMY.map((e) => (
            <div key={e.title} style={{
              background: T.bg,
              padding: '28px 24px',
            }}>
              <div style={{ color: T.label, marginBottom: 14 }}>{e.icon}</div>
              <h3 style={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: T.text,
                marginBottom: 8,
              }}>
                {e.title}
              </h3>
              <p style={{
                fontSize: 13,
                fontWeight: 300,
                lineHeight: 1.6,
                color: T.label,
                margin: 0,
              }}>
                {e.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Persona strip ----

const PERSONAS = [
  { emoji: '🚀', name: 'Lagos Hustler' },
  { emoji: '🌾', name: 'Nairobi Trader' },
  { emoji: '💻', name: 'Manila Dev' },
  { emoji: '🏪', name: 'Accra Merchant' },
  { emoji: '🎓', name: 'Cairo Student' },
];

function PersonaStrip() {
  return (
    <section style={{
      borderBottom: `1px solid ${T.divider}`,
      background: T.surface,
      padding: '48px 0',
      overflow: 'hidden',
    }}>
      <div style={{ paddingLeft: 24, marginBottom: 20 }}>
        <p style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.faint,
        }}>
          20 persona templates across 9 categories
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="persona-scroll"
      >
        {PERSONAS.map((p) => (
          <div key={p.name} style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: T.bg,
            border: `1px solid ${T.divider}`,
            borderRadius: 100,
            padding: '8px 14px',
          }}>
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: T.text,
              whiteSpace: 'nowrap',
            }}>
              {p.name}
            </span>
          </div>
        ))}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
        }}>
          <span style={{ ...MONO, fontSize: 11, color: T.faint }}>+15 more</span>
        </div>
      </div>
      <style>{`.persona-scroll::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
}

// ---- Waitlist Form ----

type FormState = 'idle' | 'loading' | 'success' | 'error';

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === 'loading') return;
    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Something went wrong');
      }
      setState('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMsg(msg);
      setState('error');
      setTimeout(() => {
        setState('idle');
        setErrorMsg('');
      }, 4000);
    }
  };

  return (
    <section id="waitlist" style={{
      maxWidth: MAX_W,
      margin: '0 auto',
      padding: '96px 24px',
    }}>
      <h2 style={{
        fontSize: 'clamp(28px, 5vw, 52px)',
        fontWeight: 200,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        color: T.text,
        marginBottom: 16,
      }}>
        Be first in line.
      </h2>
      <p style={{
        fontSize: 15,
        fontWeight: 300,
        lineHeight: 1.65,
        color: T.label,
        marginBottom: 40,
        maxWidth: 440,
      }}>
        We're opening access in waves across Africa, LATAM, and Southeast Asia.
        Drop your email and we'll reach out when your spot is ready.
      </p>

      {state === 'success' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: T.surface,
          border: `1px solid ${T.divider}`,
          borderRadius: 8,
          maxWidth: 440,
        }}>
          <span style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span style={{ fontSize: 14, fontWeight: 300, color: T.text }}>
            You're on the list. We'll be in touch. 👋
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 440 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={state === 'loading'}
              style={{
                flex: 1,
                minWidth: 200,
                fontSize: 14,
                fontWeight: 300,
                color: T.text,
                background: T.bg,
                border: `1px solid ${state === 'error' ? '#ef4444' : T.divider}`,
                borderRadius: 8,
                padding: '11px 14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
            <button
              type="submit"
              disabled={state === 'loading' || !email.trim()}
              style={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: '#ffffff',
                background: email.trim() && state !== 'loading' ? T.text : T.faint,
                border: 'none',
                borderRadius: 8,
                padding: '11px 20px',
                cursor: email.trim() && state !== 'loading' ? 'pointer' : 'default',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {state === 'loading' ? 'Joining…' : 'Join waitlist'}
            </button>
          </div>
          {errorMsg && (
            <p style={{
              ...MONO,
              fontSize: 11,
              color: '#ef4444',
              marginTop: 8,
              letterSpacing: '0.02em',
            }}>
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

// ---- Footer ----

function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${T.divider}`,
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: MAX_W,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <span style={{ ...MONO, fontSize: 10, color: T.faint, letterSpacing: '0.05em' }}>
          MiniClaw · Built on Celo · Powered by SelfClaw AI
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Twitter / X', href: '#' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              ...MONO,
              fontSize: 10,
              color: T.faint,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ---- App ----

export default function App() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      <Nav />
      <Hero />
      <FeatureCards />
      <WhatIsMiniClaw />
      <HowItWorks />
      <AgentEconomy />
      <PersonaStrip />
      <WaitlistForm />
      <Footer />
    </div>
  );
}
