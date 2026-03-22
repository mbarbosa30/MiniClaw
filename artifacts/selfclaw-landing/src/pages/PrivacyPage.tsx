import { useState, useEffect } from 'react';
import { Link } from 'wouter';

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

function PrivacyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{
              ...MONO,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: T.text,
            }}>
              MiniClaw
            </span>
          </Link>
          <span style={{
            ...MONO,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: T.faint,
          }}>
            Privacy Policy
          </span>
        </div>
        <Link href="/#waitlist" style={{ textDecoration: 'none' }}>
          <span style={{
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
            display: 'inline-block',
          }}>
            Join waitlist
          </span>
        </Link>
      </div>
    </nav>
  );
}

type SectionItem = { label: string; body: string };

type BodySection = {
  id: string;
  title: string;
  body: string;
};

type ItemsSection = {
  id: string;
  title: string;
  items: SectionItem[];
};

type PolicySection = BodySection | ItemsSection;

function isBodySection(s: PolicySection): s is BodySection {
  return 'body' in s;
}

const SECTIONS: PolicySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: `MiniClaw is a lightweight AI agent built to run inside MiniPay, Opera's mobile wallet. This policy explains what information we collect when you use MiniClaw, how we use it, and how long we keep it. We do not sell your data, we do not run ads, and we do not share your information with third parties for marketing purposes.`,
  },
  {
    id: 'what-we-collect',
    title: 'Data we collect',
    items: [
      {
        label: 'Wallet address',
        body: 'When you connect MiniClaw through MiniPay, we receive your MiniPay wallet address. This is used solely to authenticate your session and link your agent to your identity within the SelfClaw network. We do not collect private keys or seed phrases — these never leave your device.',
      },
      {
        label: 'Waitlist email',
        body: 'If you submit your email address on our landing page waitlist, we store that address to notify you when MiniClaw becomes available. You can request removal at any time.',
      },
      {
        label: 'Usage and analytics',
        body: 'We collect anonymised usage signals — such as which features are used and how often — to understand how the product is working and where to improve it. These signals are not linked to individual users or wallet addresses.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: 'How we use your data',
    items: [
      { label: 'Authentication', body: 'Your wallet address is used to identify your session and associate your agent with your activity in the marketplace. It is not used for any other purpose.' },
      { label: 'Waitlist communication', body: 'Waitlist emails are used exclusively to notify you about MiniClaw availability and product updates. We will not send marketing from third parties.' },
      { label: 'Product improvement', body: 'Anonymised usage signals help us understand what is working and what needs improvement. No personally identifiable information is included in these signals.' },
    ],
  },
  {
    id: 'third-parties',
    title: 'MiniPay & third parties',
    body: `MiniClaw runs inside MiniPay, a product by Opera. When you use MiniClaw, you are also subject to MiniPay's own terms and privacy policy. We receive your wallet address from MiniPay as part of the authentication flow, but we do not share additional data back to MiniPay beyond what the integration requires.\n\nThe SelfClaw marketplace connects your agent to third-party service providers (human professionals and other AI agents). Transactions on the marketplace are recorded on-chain and are publicly visible by nature of the blockchain. We do not control or have access to any personally identifiable information held by individual providers.`,
  },
  {
    id: 'data-retention',
    title: 'Data retention',
    items: [
      { label: 'Wallet addresses', body: 'Retained for as long as you have an active account. If you request deletion, we will remove your wallet address from our systems within 30 days.' },
      { label: 'Waitlist emails', body: 'Retained until you request removal or the waitlist period ends, whichever comes first.' },
      { label: 'Usage signals', body: 'Anonymised usage data is retained for up to 24 months for product analysis, after which it is deleted or further aggregated.' },
    ],
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: `You have the right to access, correct, or delete any personal data we hold about you. Because MiniClaw is in early access, our primary personal data point is your waitlist email — you may request its removal at any time. For wallet-address-linked data, you can request deletion once the product launches. We will respond to all requests within 30 days.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: `For privacy-related questions or data requests, contact us at privacy@selfclaw.ai. This policy may be updated as MiniClaw evolves. Material changes will be communicated via the waitlist email if you are subscribed. Last updated: March 2026.`,
  },
];

function Section({ section }: { section: PolicySection }) {
  return (
    <div id={section.id} style={{ paddingBottom: 56, borderBottom: `1px solid ${T.divider}`, marginBottom: 56 }}>
      <p style={{
        ...MONO,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: T.faint,
        marginBottom: 16,
      }}>
        {section.title}
      </p>
      {isBodySection(section) && (
        section.body.split('\n\n').map((paragraph, i) => (
          <p key={i} style={{
            fontSize: 15,
            fontWeight: 300,
            lineHeight: 1.75,
            color: T.label,
            maxWidth: 680,
            marginBottom: 16,
          }}>
            {paragraph}
          </p>
        ))
      )}
      {!isBodySection(section) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
          {section.items.map((item) => (
            <div key={item.label}>
              <p style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: T.text,
                marginBottom: 6,
              }}>
                {item.label}
              </p>
              <p style={{
                fontSize: 14,
                fontWeight: 300,
                lineHeight: 1.7,
                color: T.label,
                margin: 0,
              }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrivacyFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${T.divider}`, padding: '32px 24px' }}>
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
          MiniClaw · Powered by SelfClaw AI
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/" style={{ ...MONO, fontSize: 10, color: T.faint, textDecoration: 'none', letterSpacing: '0.04em' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      <PrivacyNav />

      <div style={{ maxWidth: MAX_W, margin: '0 auto', padding: '80px 24px 0' }}>
        <p style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 24,
        }}>
          Legal
        </p>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 200,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: T.text,
          marginBottom: 16,
        }}>
          Privacy Policy
        </h1>
        <p style={{
          fontSize: 15,
          fontWeight: 300,
          lineHeight: 1.7,
          color: T.label,
          maxWidth: 560,
          marginBottom: 80,
        }}>
          What we collect, how we use it, and how to reach us.
        </p>
      </div>

      <div style={{ maxWidth: MAX_W, margin: '0 auto', padding: '0 24px 80px' }}>
        {SECTIONS.map(section => (
          <Section key={section.id} section={section} />
        ))}
      </div>

      <PrivacyFooter />
    </div>
  );
}
