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

const LANGUAGE_CHIPS = ['English', 'French', 'Swahili', 'Hausa', 'Yoruba', 'Amharic', 'Portuguese', 'Arabic'];
const EXP_LEVELS: { value: 'beginner' | 'intermediate' | 'expert'; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Growing' },
  { value: 'expert', label: 'Advanced' },
];

const FONT = 'ui-monospace, Menlo, monospace';

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      color: t.faint,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      fontFamily: FONT,
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
      ...(mono ? { fontFamily: FONT } : {}),
    }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: on ? t.text : t.surface,
        border: `1.5px solid ${on ? t.text : t.divider}`,
        padding: 0,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease, border-color 0.2s ease',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: on ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: on ? t.bg : t.label,
        transition: 'left 0.2s ease, background 0.2s ease',
        display: 'block',
      }} />
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

  const toggleLanguage = (lang: string) => {
    const current = userProfile.languages ?? [];
    const next = current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang];
    setUserProfile({ ...userProfile, languages: next });
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
    fontSize: 11,
    fontFamily: FONT,
    fontWeight: 600,
    color: t.faint,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 8,
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 20,
    border: `1.5px solid ${active ? t.text : t.divider}`,
    background: active ? t.text : 'transparent',
    color: active ? t.bg : t.label,
    fontSize: 12,
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  });

  const currentLangs = userProfile.languages ?? [];
  const currentExp = userProfile.experienceLevel ?? '';

  return (
    <>
      <SectionLabel>Profile</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 4 }}>
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

        <div>
          <label style={fieldLabelStyle}>X / Twitter handle <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(optional)</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 15, color: t.faint, pointerEvents: 'none', fontFamily: 'inherit',
            }}>@</span>
            <input
              type="text"
              value={userProfile.xHandle ?? ''}
              placeholder="yourhandle"
              onChange={(e) => handleChange('xHandle', e.target.value.replace(/^@+/, ''))}
              style={{ ...fieldStyle, paddingLeft: 30 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={fieldLabelStyle}>City</label>
            <input
              type="text"
              value={userProfile.city}
              placeholder="e.g. Lagos"
              onChange={(e) => handleChange('city', e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Country</label>
            <input
              type="text"
              value={userProfile.country}
              placeholder="e.g. Nigeria"
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

        <div>
          <label style={fieldLabelStyle}>Experience level</label>
          <div style={{ display: 'flex', gap: 7 }}>
            {EXP_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange('experienceLevel', currentExp === value ? '' : value)}
                style={chipStyle(currentExp === value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={fieldLabelStyle}>Languages</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LANGUAGE_CHIPS.map(lang => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                style={chipStyle(currentLangs.includes(lang))}
              >
                {lang}
              </button>
            ))}
            {currentLangs
              .filter(lang => !LANGUAGE_CHIPS.includes(lang))
              .map(lang => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  style={{ ...chipStyle(true), display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {lang}
                  <span style={{ opacity: 0.7, fontSize: 12, lineHeight: 1 }}>×</span>
                </button>
              ))}
          </div>
        </div>
      </div>
      <p style={{
        fontSize: 10,
        color: t.faint,
        lineHeight: 1.5,
        letterSpacing: '-0.005em',
        paddingTop: 8,
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
            fontFamily: botName ? FONT : 'inherit',
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
              fontFamily: FONT,
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
  const pop = useRouter((s) => s.pop);

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
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28, paddingBottom: 4, gap: 10 }}>
        <button
          onClick={pop}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: t.label,
            fontSize: 18,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back"
        >
          ←
        </button>
        <p style={{
          fontSize: 22,
          fontWeight: 200,
          letterSpacing: '-0.03em',
          color: t.text,
          lineHeight: 1,
          margin: 0,
        }}>
          Settings
        </p>
      </div>

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
