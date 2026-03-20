import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { useAuthStore, useAppStore } from '@/lib/store';
import { useLogout } from '@/hooks/use-auth';
import { formatAddress } from '@/lib/utils';

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{
      fontSize: 9,
      fontWeight: 600,
      color: t.faint,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      paddingTop: 28,
      paddingBottom: 10,
    }}>
      {children}
    </p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 13,
      paddingBottom: 13,
      borderBottom: `1px solid ${t.divider}`,
    }}>
      <span style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </div>
  );
}

function Val({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  const t = useTheme();
  return (
    <span style={{
      fontSize: mono ? 10 : 12,
      color: t.text,
      letterSpacing: mono ? '0.02em' : '-0.01em',
      ...(mono ? { fontFamily: 'ui-monospace, Menlo, monospace' } : {}),
    }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <button
      onClick={onToggle}
      style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: on ? t.text : t.faint,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontWeight: on ? 600 : 400,
      }}
    >
      {on ? 'on' : 'off'}
    </button>
  );
}

function Picker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const i = options.indexOf(value);
  return (
    <button
      onClick={() => onChange(options[(i + 1) % options.length])}
      style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 10,
        color: t.text,
        letterSpacing: '0.02em',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {value}
      <span style={{ color: t.faint, fontSize: 8 }}>▼</span>
    </button>
  );
}

function ActionRow({ label, color, onClick }: { label: string; color?: string; onClick?: () => void }) {
  const t = useTheme();
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <button
        onClick={onClick}
        style={{
          fontSize: 12,
          color: color ?? t.label,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </button>
    </div>
  );
}

export function SettingsView() {
  const t = useTheme();
  const address = useAuthStore((s) => s.address);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const logout = useLogout();

  const [streaming, setStreaming] = useState(true);
  const [pocTracking, setPocTracking] = useState(true);
  const [autoMemory, setAutoMemory] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [format, setFormat] = useState('text');

  return (
    <div
      className="overflow-y-auto no-scrollbar"
      style={{
        height: '100%',
        padding: '36px 32px 32px',
        background: t.bg,
        transition: 'background 0.3s ease',
      }}
    >
      <SectionLabel>Appearance</SectionLabel>
      <Row label="Dark mode">
        <Toggle on={darkMode} onToggle={toggleDarkMode} />
      </Row>

      <SectionLabel>Account</SectionLabel>
      <Row label="Wallet">
        <Val mono>{address ? formatAddress(address) : '—'}</Val>
      </Row>
      <Row label="Network">
        <Val>Celo Mainnet</Val>
      </Row>
      <Row label="Session">
        <Val>MiniPay</Val>
      </Row>

      <SectionLabel>selfclaw API</SectionLabel>
      <Row label="Platform">
        <Val mono>selfclaw.ai</Val>
      </Row>
      <Row label="Key status">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <Val>Active</Val>
        </span>
      </Row>
      <Row label="Rate limit">
        <Val mono>100 req / min</Val>
      </Row>
      <Row label="Streaming">
        <Toggle on={streaming} onToggle={() => setStreaming((v) => !v)} />
      </Row>
      <Row label="Response format">
        <Picker options={['text', 'json', 'markdown']} value={format} onChange={setFormat} />
      </Row>

      <SectionLabel>Agent defaults</SectionLabel>
      <Row label="Default model">
        <Picker options={['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-1.5-pro']} value={model} onChange={setModel} />
      </Row>
      <Row label="Temperature"><Val mono>0.7</Val></Row>
      <Row label="Max tokens"><Val mono>4,096</Val></Row>
      <Row label="Context window"><Val mono>16k</Val></Row>
      <Row label="Memory per agent"><Val mono>8 MB</Val></Row>
      <Row label="Auto-compress memory">
        <Toggle on={autoMemory} onToggle={() => setAutoMemory((v) => !v)} />
      </Row>

      <SectionLabel>PoC & Economics</SectionLabel>
      <Row label="Contribution tracking">
        <Toggle on={pocTracking} onToggle={() => setPocTracking((v) => !v)} />
      </Row>
      <Row label="PoC threshold"><Val mono>50 pts</Val></Row>
      <Row label="Earnings wallet">
        <Val mono>{address ? formatAddress(address) : '—'}</Val>
      </Row>
      <Row label="Holdings currency"><Val>CELO</Val></Row>

      <SectionLabel>Notifications</SectionLabel>
      <Row label="Agent alerts">
        <Toggle on={notifications} onToggle={() => setNotifications((v) => !v)} />
      </Row>
      <Row label="Webhook URL"><Val mono>—</Val></Row>

      <SectionLabel>Data</SectionLabel>
      <ActionRow label="Export conversation history" />
      <ActionRow label="Export agent configs" />
      <ActionRow label="Clear all agent memory" color="#f87171" />

      <SectionLabel>Session</SectionLabel>
      <ActionRow label="Sign out" onClick={() => logout.mutate()} />

      <div style={{ height: 32 }} />
    </div>
  );
}
