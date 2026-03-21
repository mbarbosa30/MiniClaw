import { useState, useEffect, useRef } from 'react';

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
        Personal AI team · Inside MiniPay
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
        Your Claws work<br />while you don't.
      </h1>
      <p style={{
        fontSize: 17,
        fontWeight: 300,
        lineHeight: 1.65,
        color: T.label,
        marginBottom: 40,
        maxWidth: 540,
      }}>
        Autonomous AI agents with memory, personality, and real onchain capabilities —
        built for builders in MiniPay.
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
          Free during beta · Works in MiniPay on Celo
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
    body: 'Create multiple Claws, each with their own specialty, personality, and focus. They collaborate so you don\'t have to do everything alone.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: 'Memory that sticks',
    body: 'Every conversation teaches your Claws something new. Semantic memory maintained automatically — they remember what matters.',
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
    body: 'Choose from Dry-wit, Playful, Sarcastic, Absurdist, or Straight. Your agents have real personality — they\'re not boring.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Proactive, not reactive',
    body: 'Daily briefs, market monitoring, and skill runs — your Claws don\'t wait to be asked. They keep you in the loop.',
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
    body: 'Send and receive cUSD, CELO, cEUR. Gifts, commerce, payments — all built into every agent from day one.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Built for your context',
    body: 'Teach your agents your domain: upload knowledge, set personal context, pick from 17 local personas shaped for real markets.',
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
          What your Claws bring
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

// ---- MiniPay Context Strip ----

function ContextStrip() {
  return (
    <section style={{
      maxWidth: MAX_W,
      margin: '0 auto',
      padding: '72px 24px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
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
          What is MiniPay?
        </p>
        <h2 style={{
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          color: T.text,
          marginBottom: 16,
        }}>
          A wallet for the<br />next billion users.
        </h2>
        <p style={{
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.7,
          color: T.label,
        }}>
          MiniPay is a lightweight crypto wallet by Opera — the browser used by
          hundreds of millions across Africa, Asia, and Latin America. MiniClaw
          lives inside it: no separate app to install, no complicated setup.
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
        {['Built on Celo', 'No crypto knowledge needed', 'Works on any Android phone', 'Lightweight — under 500 KB'].map((item) => (
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
      <style>{`
        @media (max-width: 640px) {
          .context-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ---- How it works ----

const STEPS = [
  { n: '01', title: 'Open MiniPay', body: 'Find MiniPay in the Opera Mini browser or download it on Android. It\'s free and takes under a minute to set up.' },
  { n: '02', title: 'Create your first Claw', body: 'Choose a persona, set your agent\'s personality and humor style. Your Claw is live in 60 seconds.' },
  { n: '03', title: 'Let it work', body: 'Your Claw monitors, acts, and reports back while you get on with life. Check the daily brief each morning.' },
];

function HowItWorks() {
  return (
    <section style={{
      borderTop: `1px solid ${T.divider}`,
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

// ---- Persona strip ----

const PERSONAS = [
  { emoji: '🚀', name: 'Lagos Hustler' },
  { emoji: '🌾', name: 'Nairobi Trader' },
  { emoji: '💻', name: 'Manila Dev' },
  { emoji: '🏪', name: 'Accra Merchant' },
  { emoji: '🎓', name: 'Cairo Student' },
  { emoji: '📡', name: 'Dakar Creator' },
  { emoji: '💊', name: 'Kampala Healer' },
];

function PersonaStrip() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section style={{
      borderTop: `1px solid ${T.divider}`,
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
          17 locally-shaped personas
        </p>
      </div>
      <div
        ref={ref}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 4,
          scrollbarWidth: 'none',
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
          <span style={{ ...MONO, fontSize: 11, color: T.faint }}>+10 more</span>
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
      const data = await res.json();
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
            You're on the list. We'll be in touch.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 440 }}>
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
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
        gap: 12,
      }}>
        <span style={{ ...MONO, fontSize: 10, color: T.faint, letterSpacing: '0.06em' }}>
          MiniClaw · Built on Celo · Powered by SelfClaw AI
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Twitter / X'].map((link) => (
            <a key={link} href="#" style={{
              ...MONO,
              fontSize: 10,
              color: T.faint,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}>
              {link}
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
      <ContextStrip />
      <HowItWorks />
      <PersonaStrip />
      <WaitlistForm />
      <Footer />
    </div>
  );
}
