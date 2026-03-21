import { useTheme } from '@/lib/theme';
import { useAuthStore, useAppStore, useRouter } from '@/lib/store';
import type { UserProfile } from '@/lib/store';
import { useLogout } from '@/hooks/use-auth';
import { useAgents, useTelegramStatus, useUpdateTelegramSettings } from '@/hooks/use-agents';
import { formatAddress } from '@/lib/utils';
import type { TelegramNotificationLevel } from '@/types';

const NOTIF_LEVELS: TelegramNotificationLevel[] = ['all', 'important', 'none'];
const NOTIF_LABEL: Record<TelegramNotificationLevel, string> = {
  all: 'All',
  important: 'Important',
  none: 'Off',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{
      fontSize: 9,
      fontWeight: 600,
      color: t.faint,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      fontFamily: 'ui-monospace, Menlo, monospace',
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

function ProfileSection() {
  const t = useTheme();
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setUserProfile({ ...userProfile, [field]: value });
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: t.surface,
    border: `1px solid ${t.divider}`,
    borderRadius: 10,
    padding: '13px 16px',
    fontSize: 15,
    color: t.text,
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 9,
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontWeight: 600,
    color: t.faint,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 8,
  };

  return (
    <>
      <SectionLabel>Profile</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
        <div>
          <label style={fieldLabelStyle}>Name</label>
          <input
            type="text"
            value={userProfile.name}
            placeholder="e.g. Amara"
            onChange={(e) => handleChange('name', e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={fieldLabelStyle}>City</label>
            <input
              type="text"
              value={userProfile.city}
              placeholder="e.g. Lagos, Nairobi"
              onChange={(e) => handleChange('city', e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Country</label>
            <input
              type="text"
              value={userProfile.country}
              placeholder="e.g. Nigeria, Kenya"
              onChange={(e) => handleChange('country', e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
        <div>
          <label style={fieldLabelStyle}>Current focus</label>
          <input
            type="text"
            value={userProfile.goal}
            placeholder="e.g. freelancing on Fiverr"
            onChange={(e) => handleChange('goal', e.target.value)}
            style={fieldStyle}
          />
        </div>
      </div>
      <p style={{
        fontSize: 10,
        color: t.faint,
        lineHeight: 1.5,
        letterSpacing: '-0.005em',
        paddingTop: 6,
        paddingBottom: 4,
      }}>
        Pre-fills when you create a new agent
      </p>
    </>
  );
}

function TelegramSection() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const { data: agentData } = useAgents();
  const firstAgent = agentData?.agents?.[0];
  const { data: tgStatus, isLoading } = useTelegramStatus(firstAgent?.id);
  const updateTg = useUpdateTelegramSettings();

  const handleCycleNotif = async () => {
    if (!firstAgent || !tgStatus?.connected) return;
    const current = tgStatus.notificationLevel ?? 'all';
    const idx = NOTIF_LEVELS.indexOf(current);
    const next = NOTIF_LEVELS[(idx + 1) % NOTIF_LEVELS.length];
    await updateTg.mutateAsync({ agentId: firstAgent.id, data: { notificationLevel: next } });
  };

  const handleGoToTelegram = () => {
    if (!firstAgent) return;
    push('telegram', { id: String(firstAgent.id) });
  };

  if (!firstAgent) {
    return (
      <>
        <SectionLabel>Telegram</SectionLabel>
        <Row label="Connection">
          <Val>No agents yet</Val>
        </Row>
      </>
    );
  }

  const isConnected = tgStatus?.connected ?? false;
  const botName = tgStatus?.botUsername;
  const notifLevel = tgStatus?.notificationLevel ?? 'all';

  return (
    <>
      <SectionLabel>Telegram</SectionLabel>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 13,
          paddingBottom: 13,
          borderBottom: `1px solid ${t.divider}`,
          cursor: firstAgent ? 'pointer' : 'default',
        }}
        onClick={handleGoToTelegram}
      >
        <span style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em' }}>Telegram</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isLoading && (
            <span style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : t.faint,
              flexShrink: 0,
            }} />
          )}
          <span style={{
            fontSize: botName ? 10 : 12,
            color: isConnected ? t.text : t.faint,
            letterSpacing: '-0.01em',
            fontFamily: botName ? 'ui-monospace, Menlo, monospace' : 'inherit',
          }}>
            {isLoading ? '…' : isConnected ? (botName ?? 'connected') : 'not connected →'}
          </span>
        </div>
      </div>

      {isConnected && (
        <Row label="Notifications">
          <button
            onClick={handleCycleNotif}
            disabled={updateTg.isPending}
            style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 10,
              color: t.text,
              letterSpacing: '0.04em',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: updateTg.isPending ? 0.5 : 1,
            }}
          >
            {NOTIF_LABEL[notifLevel]}
            <span style={{ color: t.faint, fontSize: 8 }}>▼</span>
          </button>
        </Row>
      )}
    </>
  );
}

export function SettingsView() {
  const t = useTheme();
  const address = useAuthStore((s) => s.address);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const activityAlerts = useAppStore((s) => s.activityAlerts);
  const toggleActivityAlerts = useAppStore((s) => s.toggleActivityAlerts);
  const logout = useLogout();

  return (
    <div
      className="overflow-y-auto no-scrollbar"
      style={{
        height: '100%',
        padding: '0 32px 32px',
        background: t.bg,
        transition: 'background 0.3s ease',
      }}
    >
      <p style={{
        fontSize: 22,
        fontWeight: 200,
        letterSpacing: '-0.03em',
        color: t.text,
        paddingTop: 28,
        paddingBottom: 4,
        lineHeight: 1,
      }}>
        Settings
      </p>

      {/* ── PROFILE ── */}
      <ProfileSection />

      {/* ── APPEARANCE ── */}
      <SectionLabel>Appearance</SectionLabel>
      <Row label="Dark mode">
        <Toggle on={darkMode} onToggle={toggleDarkMode} />
      </Row>

      {/* ── ACCOUNT ── */}
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

      {/* ── TELEGRAM ── */}
      <TelegramSection />

      {/* ── NOTIFICATIONS ── */}
      <SectionLabel>Notifications</SectionLabel>
      <Row label="Activity alerts">
        <Toggle on={activityAlerts} onToggle={toggleActivityAlerts} />
      </Row>
      <p style={{
        fontSize: 10,
        color: t.faint,
        lineHeight: 1.5,
        letterSpacing: '-0.005em',
        paddingTop: 6,
        paddingBottom: 4,
      }}>
        Notify when an agent completes a task (Telegram required)
      </p>

      {/* ── ABOUT ── */}
      <SectionLabel>About</SectionLabel>
      <Row label="Platform">
        <Val mono>selfclaw.ai</Val>
      </Row>
      <Row label="Version">
        <Val mono>{import.meta.env.VITE_APP_VERSION ?? '1.0'}</Val>
      </Row>
      <Row label="API connection">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <Val>Active</Val>
        </span>
      </Row>

      {/* ── SESSION ── */}
      <SectionLabel>Session</SectionLabel>
      <ActionRow label="Sign out" onClick={() => logout.mutate()} />

      <div style={{ height: 32 }} />
    </div>
  );
}
