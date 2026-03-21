import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates, useCreateAgent, useSpawningStatus } from '@/hooks/use-agents';
import { useRouter, useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { resolveIcon } from '@/lib/agent-icon';
import { ScreenHeader } from '@/components/ui';
import { PERSONAS, HUSTLE_MODE_SOUL_APPEND } from '@/lib/personas';
import type { PersonaConfig } from '@/lib/personas';
import type { HumorStyle, SpawningProgressStep } from '@/types';

interface UserInfo {
  name: string;
  country: string;
  goal: string;
}

interface ProjectEntry {
  id: string;
  url: string;
  title?: string;
  description?: string;
  fetchStatus: 'loading' | 'ready' | 'error';
}

const HUMOR_STYLES: HumorStyle[] = ['straight', 'dry-wit', 'playful', 'sarcastic', 'absurdist'];
const HUMOR_LABEL: Record<HumorStyle, string> = {
  straight: 'No fluff',
  'dry-wit': 'Sharp',
  playful: 'Fun',
  sarcastic: 'Edgy',
  absurdist: 'Weird',
};

const MAX_PROJECTS = 5;

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

function OnboardingSpinner({ color }: { color: string }) {
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

function OnboardingPersonaRow({
  persona,
  selected,
  onSelect,
  index,
  dividerColor,
  faintColor,
  textColor,
}: {
  persona: PersonaConfig;
  selected: boolean;
  onSelect: () => void;
  index: number;
  dividerColor: string;
  faintColor: string;
  textColor: string;
}) {
  const Icon = resolveIcon(persona.icon);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onSelect}
      style={{
        width: '100%',
        background: selected ? `${persona.color}0d` : 'none',
        border: 'none',
        borderBottom: `1px solid ${dividerColor}`,
        padding: '20px 32px 20px 20px',
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
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: persona.color,
        borderRadius: '0 1px 1px 0',
      }} />

      <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
        <p style={{
          fontSize: 24,
          fontWeight: 300,
          letterSpacing: '-0.03em',
          color: textColor,
          lineHeight: 1.1,
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
          color: faintColor,
          letterSpacing: '-0.005em',
          lineHeight: 1.4,
        }}>
          {persona.tagline}
        </p>
      </div>

      <div style={{ flexShrink: 0, paddingTop: 4 }}>
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.25}
            color={selected ? persona.color : faintColor}
            style={{ transition: 'color 0.2s ease' }}
          />
        )}
      </div>
    </motion.button>
  );
}

const AUDIENCE_AWARE_PERSONAS = new Set([
  'ai-hustle-builder',
  'digital-creator-coach',
  'online-biz-launcher',
  'gig-economy-maximizer',
  'social-media-marketer',
  'local-business-builder',
  'distribution-strategist',
]);

const LANGUAGE_CHIPS = ['English', 'French', 'Swahili', 'Hausa', 'Yoruba', 'Amharic', 'Portuguese', 'Arabic'];

const EXP_LEVELS: { value: 'beginner' | 'intermediate' | 'expert'; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Growing' },
  { value: 'expert', label: 'Advanced' },
];

function PersonalizeStep({
  persona,
  agentCustomName,
  userName,
  userCountry,
  userXHandle,
  userGoal,
  userExperienceLevel,
  userLanguages,
  userChallenges,
  userTargetAudience,
  humorStyle,
  projects,
  onChangeAgentName,
  onChangeName,
  onChangeCountry,
  onChangeXHandle,
  onChangeGoal,
  onChangeExperienceLevel,
  onChangeLanguages,
  onChangeChallenges,
  onChangeTargetAudience,
  onChangeHumorStyle,
  onAddProject,
  onRemoveProject,
  onBack,
  onSkip,
  onLaunch,
  creating,
  error,
}: {
  persona: PersonaConfig;
  agentCustomName: string;
  userName: string;
  userCountry: string;
  userXHandle: string;
  userGoal: string;
  userExperienceLevel: '' | 'beginner' | 'intermediate' | 'expert';
  userLanguages: string[];
  userChallenges: string;
  userTargetAudience: string;
  humorStyle: HumorStyle;
  projects: ProjectEntry[];
  onChangeAgentName: (v: string) => void;
  onChangeName: (v: string) => void;
  onChangeCountry: (v: string) => void;
  onChangeXHandle: (v: string) => void;
  onChangeGoal: (v: string) => void;
  onChangeExperienceLevel: (v: '' | 'beginner' | 'intermediate' | 'expert') => void;
  onChangeLanguages: (v: string[]) => void;
  onChangeChallenges: (v: string) => void;
  onChangeTargetAudience: (v: string) => void;
  onChangeHumorStyle: (s: HumorStyle) => void;
  onAddProject: (url: string) => void;
  onRemoveProject: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onLaunch: () => void;
  creating: boolean;
  error: string | null;
}) {
  const t = useTheme();
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const hasAdvancedData = !!userExperienceLevel || userLanguages.length > 0 || !!userChallenges || !!userTargetAudience;
  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedData);

  const showAudienceField = AUDIENCE_AWARE_PERSONAS.has(persona.id);

  const toggleLanguage = (lang: string) => {
    if (userLanguages.includes(lang)) {
      onChangeLanguages(userLanguages.filter(l => l !== lang));
    } else {
      onChangeLanguages([...userLanguages, lang]);
    }
  };

  const [otherLangInput, setOtherLangInput] = useState('');

  const commitOtherLang = () => {
    const trimmed = otherLangInput.trim();
    if (!trimmed) return;
    if (!userLanguages.includes(trimmed)) {
      onChangeLanguages([...userLanguages, trimmed]);
    }
    setOtherLangInput('');
  };

  const handleAddUrl = () => {
    const raw = urlInput.trim();
    if (!raw) return;
    const candidate = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    try {
      new URL(candidate);
    } catch {
      setUrlError('Enter a valid URL, e.g. tiktok.com/@yourhandle');
      return;
    }
    setUrlError(null);
    setUrlInput('');
    onAddProject(candidate);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: t.surface,
    border: `1px solid ${t.divider}`,
    borderRadius: 10,
    padding: '13px 16px',
    fontSize: 15,
    color: t.text,
    fontFamily: FONT,
    letterSpacing: '-0.01em',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <motion.div
      key="personalize"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        fontFamily: FONT,
      }}
    >
      <ScreenHeader title={persona.name} onBack={onBack} />

      <div style={{ padding: '24px 32px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 3, height: 24, background: persona.color, borderRadius: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.04em', color: t.text, lineHeight: 1.1 }}>
            Tell us a bit about yourself.
          </p>
        </div>
        <p style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em', lineHeight: 1.5 }}>
          Helps your agent know you from the start. Everything is optional.
        </p>
      </div>

      <div style={{ height: 1, background: t.divider, flexShrink: 0 }} />

      {error && (
        <div style={{ padding: '10px 32px', background: 'rgba(248,113,113,0.08)', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>
        </div>
      )}

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Agent name */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Agent name <span style={{ textTransform: 'none', fontStyle: 'normal', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
            </p>
            <input type="text" value={agentCustomName} onChange={e => onChangeAgentName(e.target.value)}
              placeholder={`e.g. Alex, Maya, ${persona.name.split(' ')[0]}`} disabled={creating} style={inputStyle} />
            <p style={{ fontSize: 10, color: t.faint, marginTop: 6, letterSpacing: '-0.005em' }}>
              If set, your agent will introduce itself by this name.
            </p>
          </div>

          {/* First name */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Your first name
            </p>
            <input type="text" value={userName} onChange={e => onChangeName(e.target.value)}
              placeholder="e.g. Amara" disabled={creating} style={inputStyle} />
          </div>

          {/* Country */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Country / Region
            </p>
            <input type="text" value={userCountry} onChange={e => onChangeCountry(e.target.value)}
              placeholder="e.g. Nigeria, Kenya, Brazil" disabled={creating} style={inputStyle} />
          </div>

          {/* X / Twitter handle */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              X / Twitter handle <span style={{ textTransform: 'none', fontStyle: 'normal', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: t.faint, pointerEvents: 'none', fontFamily: FONT }}>
                @
              </span>
              <input
                type="text"
                value={userXHandle}
                onChange={e => onChangeXHandle(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                disabled={creating}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <p style={{ fontSize: 10, color: t.faint, marginTop: 6, letterSpacing: '-0.005em' }}>
              Helps your agent research your public profile and voice.
            </p>
          </div>

          {/* Goal */}
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              What are you working on?
            </p>
            <input type="text" value={userGoal} onChange={e => onChangeGoal(e.target.value)}
              placeholder="e.g. Starting a TikTok shop, freelancing on Fiverr…" disabled={creating} style={inputStyle} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: t.divider }} />
              <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                Vibe
              </p>
              <div style={{ flex: 1, height: 1, background: t.divider }} />
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {HUMOR_STYLES.map(style => {
                const active = humorStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => onChangeHumorStyle(style)}
                    disabled={creating}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 100,
                      border: `1.5px solid ${active ? persona.color : t.divider}`,
                      background: active ? `${persona.color}18` : 'transparent',
                      color: active ? persona.color : t.label,
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      letterSpacing: '-0.01em',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: FONT,
                    }}
                  >
                    {HUMOR_LABEL[style]}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 10, color: t.faint, marginTop: 8, letterSpacing: '-0.005em' }}>
              How your agent communicates — optional, change anytime.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: t.divider }} />
              <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                My projects
              </p>
              <div style={{ flex: 1, height: 1, background: t.divider }} />
            </div>

            <p style={{ fontSize: 11, color: t.label, letterSpacing: '-0.005em', lineHeight: 1.5, marginBottom: 12 }}>
              Share links to your work — your agent will read them so it knows your projects from the start.
            </p>

            {/* URL input row */}
            {projects.length < MAX_PROJECTS && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                  placeholder="e.g. tiktok.com/@yourhandle"
                  disabled={creating}
                  style={{
                    flex: 1,
                    background: t.surface,
                    border: `1px solid ${t.divider}`,
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 13,
                    color: t.text,
                    fontFamily: FONT,
                    letterSpacing: '-0.01em',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleAddUrl}
                  disabled={creating || !urlInput.trim()}
                  style={{
                    flexShrink: 0,
                    padding: '11px 16px',
                    background: urlInput.trim() ? persona.color : t.surface,
                    border: 'none',
                    borderRadius: 10,
                    color: urlInput.trim() ? '#fff' : t.faint,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: urlInput.trim() ? 'pointer' : 'default',
                    fontFamily: FONT,
                    transition: 'all 0.15s',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Add
                </button>
              </div>
            )}
            {urlError && (
              <p style={{ ...MONO, fontSize: 10, color: '#f87171', marginBottom: 8, marginTop: -4 }}>
                {urlError}
              </p>
            )}

            {projects.length >= MAX_PROJECTS && (
              <p style={{ ...MONO, fontSize: 10, color: t.faint, marginBottom: 10 }}>
                Max {MAX_PROJECTS} projects reached.
              </p>
            )}

            {/* Project cards */}
            {projects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: t.surface,
                      border: `1px solid ${t.divider}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {p.fetchStatus === 'loading' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <OnboardingSpinner color={t.faint} />
                          <span style={{ fontSize: 11, color: t.faint, letterSpacing: '-0.01em' }}>
                            Fetching info…
                          </span>
                        </div>
                      ) : (
                        <>
                          <p style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: p.fetchStatus === 'error' ? t.faint : t.text,
                            letterSpacing: '-0.01em',
                            marginBottom: p.description ? 2 : 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {p.title ?? safeHostname(p.url)}
                          </p>
                          {p.description && (
                            <p style={{
                              fontSize: 10,
                              color: t.faint,
                              letterSpacing: '-0.005em',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {p.description}
                            </p>
                          )}
                          <p style={{ ...MONO, fontSize: 9, color: t.faint, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.url}
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveProject(p.id)}
                      disabled={creating}
                      style={{
                        flexShrink: 0,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: t.label,
                        fontSize: 16,
                        lineHeight: 1,
                        padding: '0 2px',
                        fontFamily: FONT,
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced section toggle */}
          <div>
            <button
              onClick={() => setAdvancedOpen(v => !v)}
              disabled={creating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                borderTop: `1px solid ${t.divider}`,
                padding: '16px 0 0',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              <span style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                More detail → better research
              </span>
              <span style={{
                fontSize: 11,
                color: t.faint,
                transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-block',
              }}>▾</span>
            </button>

            <AnimatePresence initial={false}>
              {advancedOpen && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>

                    {/* Experience level */}
                    <div>
                      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Your experience level
                      </p>
                      <div style={{ display: 'flex', gap: 7 }}>
                        {EXP_LEVELS.map(({ value, label }) => {
                          const active = userExperienceLevel === value;
                          return (
                            <button
                              key={value}
                              onClick={() => onChangeExperienceLevel(active ? '' : value)}
                              disabled={creating}
                              style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: 100,
                                border: `1.5px solid ${active ? persona.color : t.divider}`,
                                background: active ? `${persona.color}18` : 'transparent',
                                color: active ? persona.color : t.label,
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                letterSpacing: '-0.01em',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: FONT,
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Languages you work in
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {LANGUAGE_CHIPS.map(lang => {
                          const active = userLanguages.includes(lang);
                          return (
                            <button
                              key={lang}
                              onClick={() => toggleLanguage(lang)}
                              disabled={creating}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 100,
                                border: `1.5px solid ${active ? persona.color : t.divider}`,
                                background: active ? `${persona.color}18` : 'transparent',
                                color: active ? persona.color : t.label,
                                fontSize: 11,
                                fontWeight: active ? 600 : 400,
                                letterSpacing: '-0.01em',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: FONT,
                              }}
                            >
                              {lang}
                            </button>
                          );
                        })}
                        {/* Custom (non-preset) selected languages */}
                        {userLanguages
                          .filter(l => !LANGUAGE_CHIPS.includes(l))
                          .map(lang => (
                            <button
                              key={lang}
                              onClick={() => toggleLanguage(lang)}
                              disabled={creating}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 100,
                                border: `1.5px solid ${persona.color}`,
                                background: `${persona.color}18`,
                                color: persona.color,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '-0.01em',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontFamily: FONT,
                              }}
                            >
                              {lang}
                              <span style={{ opacity: 0.7, fontSize: 12, lineHeight: 1 }}>×</span>
                            </button>
                          ))}
                      </div>
                      {/* Other language free-text */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input
                          type="text"
                          value={otherLangInput}
                          onChange={e => setOtherLangInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitOtherLang(); } }}
                          onBlur={commitOtherLang}
                          placeholder="Other language…"
                          disabled={creating}
                          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                        />
                      </div>
                    </div>

                    {/* Challenges */}
                    <div>
                      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Biggest challenge <span style={{ textTransform: 'none', fontStyle: 'normal', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
                      </p>
                      <input
                        type="text"
                        value={userChallenges}
                        onChange={e => onChangeChallenges(e.target.value)}
                        placeholder="e.g. Getting my first paying client"
                        disabled={creating}
                        style={inputStyle}
                      />
                    </div>

                    {/* Target audience — only for commerce/creator personas */}
                    {showAudienceField && (
                      <div>
                        <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Who do you sell to / serve? <span style={{ textTransform: 'none', fontStyle: 'normal', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
                        </p>
                        <input
                          type="text"
                          value={userTargetAudience}
                          onChange={e => onChangeTargetAudience(e.target.value)}
                          placeholder="e.g. Small business owners in Lagos"
                          disabled={creating}
                          style={inputStyle}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '16px 32px 32px', borderTop: `1px solid ${t.divider}` }}>
        <button
          onClick={onLaunch}
          disabled={creating}
          style={{
            width: '100%',
            padding: '16px',
            background: creating ? `${persona.color}80` : persona.color,
            border: 'none',
            borderRadius: 14,
            cursor: creating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: FONT,
            marginBottom: 12,
            transition: 'opacity 0.2s ease',
          }}
        >
          {creating ? (
            <>
              <OnboardingSpinner color="rgba(255,255,255,0.9)" />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
                Setting up your agent…
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
              Launch {agentCustomName.trim() || persona.name}
            </span>
          )}
        </button>

        <button
          onClick={onSkip}
          disabled={creating}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: creating ? 'default' : 'pointer',
            padding: '8px',
            fontFamily: FONT,
          }}
        >
          <span style={{ fontSize: 12, color: t.faint, letterSpacing: '-0.01em' }}>
            Skip — launch without personalizing
          </span>
        </button>
      </div>
    </motion.div>
  );
}

// --- Spawning screen helpers ---

function buildDefaultSteps(fields: {
  xHandle?: string;
  urls?: string[];
  location?: string;
  domain?: string;
  experienceLevel?: string;
  languages?: string[];
  targetAudience?: string;
}): SpawningProgressStep[] {
  const steps: SpawningProgressStep[] = [];
  if (fields.xHandle) steps.push({ step: `Researching @${fields.xHandle} on X`, status: 'waiting' });
  if (fields.urls?.length) steps.push({ step: `Analyzing your website${fields.urls.length > 1 ? 's' : ''}`, status: 'waiting' });
  if (fields.location) steps.push({ step: `Mapping local context — ${fields.location}`, status: 'waiting' });
  if (fields.domain) steps.push({ step: `Researching your domain`, status: 'waiting' });
  steps.push({ step: 'Identifying opportunities & challenges', status: 'waiting' });
  steps.push({ step: 'Building knowledge base', status: 'waiting' });
  steps.push({ step: 'Generating starter tasks', status: 'waiting' });
  steps.push({ step: 'Training complete', status: 'waiting' });
  if (steps.length > 0) steps[0] = { ...steps[0], status: 'active' };
  return steps;
}

function SpawningScreen({
  agentId,
  agentName,
  agentEmoji,
  personaColor,
  providedFields,
  onReady,
  onFailed,
}: {
  agentId: string | number;
  agentName: string;
  agentEmoji: string;
  personaColor: string;
  providedFields: { xHandle?: string; urls?: string[]; location?: string; domain?: string; experienceLevel?: string; languages?: string[]; targetAudience?: string };
  onReady: () => void;
  onFailed: () => void;
}) {
  const t = useTheme();
  const { data } = useSpawningStatus(agentId);
  const status = data?.status ?? 'researching';
  const isReady = status === 'ready';
  const isFailed = status === 'failed';

  const steps: SpawningProgressStep[] = (data?.progress?.length)
    ? data.progress
    : buildDefaultSteps(providedFields);

  return (
    <motion.div
      key="spawning"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: FONT }}
    >
      {/* Identity */}
      <div style={{ flexShrink: 0, padding: '56px 32px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>{agentEmoji}</div>
        <p style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1.1, marginBottom: 6 }}>
          {agentName}
        </p>
        <p style={{ fontSize: 12, color: t.faint, letterSpacing: '-0.005em' }}>
          {isFailed ? 'Your agent is ready' : isReady ? 'Research complete' : 'Getting to know you…'}
        </p>
      </div>

      <div style={{ height: 1, background: t.divider, flexShrink: 0 }} />

      {/* Progress steps */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 32px' }}>
        {steps.map((s, i) => {
          const isDone = s.status === 'done';
          const isActive = s.status === 'active';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, paddingBottom: 14, borderBottom: i < steps.length - 1 ? `1px solid ${t.divider}` : 'none' }}
            >
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                flexShrink: 0,
                background: isDone ? '#22c55e' : isActive ? personaColor : t.divider,
                transition: 'background 0.4s ease',
              }} />
              <p style={{
                fontSize: 13,
                fontWeight: isActive ? 400 : 300,
                color: isDone ? t.label : isActive ? t.text : t.faint,
                letterSpacing: '-0.01em',
                transition: 'color 0.3s ease',
              }}>
                {s.step}{isActive && !isReady ? '…' : ''}
              </p>
              {isDone && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ height: 1, background: t.divider, flexShrink: 0 }} />

      {/* CTA */}
      <div style={{ flexShrink: 0, padding: '20px 32px 32px' }}>
        {isFailed && (
          <p style={{ fontSize: 11, color: t.faint, letterSpacing: '-0.005em', textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
            Your agent is ready — some research is still processing in the background.
          </p>
        )}
        <button
          onClick={isReady ? onReady : isFailed ? onFailed : undefined}
          disabled={!isReady && !isFailed}
          style={{
            width: '100%',
            padding: '16px',
            background: (isReady || isFailed) ? personaColor : t.surface,
            border: 'none',
            borderRadius: 14,
            cursor: (isReady || isFailed) ? 'pointer' : 'default',
            opacity: (isReady || isFailed) ? 1 : 0.5,
            transition: 'all 0.3s ease',
            fontFamily: FONT,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: (isReady || isFailed) ? '#fff' : t.faint, letterSpacing: '-0.01em' }}>
            {isReady ? `Meet ${agentName}` : isFailed ? 'Continue anyway' : 'Preparing your agent…'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export function CreateAgentView() {
  const t = useTheme();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const create = useCreateAgent();
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const fromOnboarding = useRouter(s => s.currentView.params?.fromOnboarding === 'true');
  const { setHasSeenOnboard, userProfile, setUserProfile } = useAppStore();

  type Step = 'persona' | 'personalize' | 'spawning';
  const [step, setStep] = useState<Step>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig | null>(null);
  const [spawningAgent, setSpawningAgent] = useState<{ id: string | number; name: string; emoji: string } | null>(null);
  const [spawningBriefContext, setSpawningBriefContext] = useState<string>('');

  const [agentCustomName, setAgentCustomName] = useState('');
  const [userName, setUserName] = useState(() => userProfile.name);
  const [userCountry, setUserCountry] = useState(() => userProfile.country);
  const [userXHandle, setUserXHandle] = useState(() => userProfile.xHandle);
  const [userGoal, setUserGoal] = useState(() => userProfile.goal);
  const [userExperienceLevel, setUserExperienceLevel] = useState<'' | 'beginner' | 'intermediate' | 'expert'>(() => userProfile.experienceLevel);
  const [userLanguages, setUserLanguages] = useState<string[]>(() => userProfile.languages);
  const [userChallenges, setUserChallenges] = useState('');
  const [userTargetAudience, setUserTargetAudience] = useState('');

  const shuffledPersonas = useMemo(() => {
    const arr = [...PERSONAS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);
  const [userHumorStyle, setUserHumorStyle] = useState<HumorStyle>('straight');
  const [userProjects, setUserProjects] = useState<ProjectEntry[]>([]);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPersona) {
      setAgentCustomName('');
      setUserChallenges('');
      setUserTargetAudience('');
      setUserHumorStyle(selectedPersona.humorStyle ?? 'straight');
      setUserProjects([]);
    }
  }, [selectedPersona]);

  const resolveTemplate = (preferredTemplateId: string): string => {
    if (!templates || templates.length === 0) return preferredTemplateId;
    const verified = templates.find(tmpl => tmpl.id === preferredTemplateId);
    if (verified) return verified.id;
    const fallback = templates.find(tmpl => tmpl.id === 'general') ?? templates.find(tmpl => tmpl.id === 'coach') ?? templates[0];
    return fallback?.id ?? preferredTemplateId;
  };

  const fetchProjectMeta = async (url: string): Promise<{ title?: string; description?: string }> => {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'success') throw new Error('microlink returned non-success');
    return {
      title: data.data?.title ?? undefined,
      description: data.data?.description ?? undefined,
    };
  };

  const handleAddProject = (url: string) => {
    if (userProjects.length >= MAX_PROJECTS) return;
    const id = crypto.randomUUID();
    const entry: ProjectEntry = { id, url, fetchStatus: 'loading' };
    setUserProjects(prev => [...prev, entry]);
    fetchProjectMeta(url).then(meta => {
      setUserProjects(prev =>
        prev.map(p => p.id === id ? { ...p, ...meta, fetchStatus: 'ready' } : p)
      );
    }).catch(() => {
      setUserProjects(prev =>
        prev.map(p => p.id === id ? { ...p, fetchStatus: 'error' } : p)
      );
    });
  };

  const handleRemoveProject = (id: string) => {
    setUserProjects(prev => prev.filter(p => p.id !== id));
  };

  const buildBriefContext = (persona: PersonaConfig, agentCustomName: string, info: UserInfo, projects: ProjectEntry[]): string => {
    const namePart = info.name.trim();
    const countryPart = info.country.trim();
    const goalPart = info.goal.trim();
    const customName = agentCustomName.trim();

    let intro = 'Hi!';
    if (namePart && countryPart) intro = `Hi! I'm ${namePart} from ${countryPart}.`;
    else if (namePart) intro = `Hi! I'm ${namePart}.`;
    else if (countryPart) intro = `Hi! I'm based in ${countryPart}.`;

    let context = `${intro} `;
    if (goalPart) context += `I'm working on: ${goalPart}. `;

    const readyProjects = projects.filter(p => p.fetchStatus === 'ready' || p.fetchStatus === 'error');
    if (readyProjects.length > 0) {
      const projectList = readyProjects.map(p => `${p.title ?? safeHostname(p.url)} (${p.url})`).join(', ');
      context += `My projects: ${projectList}. `;
    }

    const agentIntro = customName
      ? `Please introduce yourself as ${customName}, my ${persona.name}`
      : `Please introduce yourself as my ${persona.name}`;
    context += `${agentIntro} — ${persona.tagline.endsWith('.') ? persona.tagline.slice(0, -1).toLowerCase() : persona.tagline.toLowerCase()} — and ask me one focused question to understand what I want to achieve with you.`;

    return context;
  };

  const handleLaunch = async (
    persona: PersonaConfig,
    agentCustomName: string,
    info: UserInfo,
    xHandle: string,
    humor: HumorStyle,
    projects: ProjectEntry[],
    experienceLevel: '' | 'beginner' | 'intermediate' | 'expert',
    languages: string[],
    challenges: string,
    targetAudience: string
  ) => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const templateId = resolveTemplate(persona.personaTemplate);
      const urlList = projects.map(p => p.url);
      const result = await create.mutateAsync({
        name: agentCustomName.trim() || persona.name,
        description: persona.tagline,
        icon: persona.icon,
        emoji: persona.emoji,
        humorStyle: humor,
        personaTemplate: templateId,
        interests: persona.interests,
        topicsToWatch: persona.topicsToWatch,
        enabledSkills: persona.enabledSkills,
        // Spawning pipeline fields
        ownerName: info.name.trim() || undefined,
        location: info.country.trim() || undefined,
        xHandle: xHandle.trim() || undefined,
        urls: urlList.length > 0 ? urlList : undefined,
        domain: info.goal.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        languages: languages.length > 0 ? languages : undefined,
        challenges: challenges.trim() ? [challenges.trim()] : undefined,
        targetAudience: targetAudience.trim() || undefined,
      });

      const newAgent = result.agent;
      const agentName = agentCustomName.trim() || persona.name;
      const agentEmoji = persona.emoji;

      setHasSeenOnboard(true);
      setUserProfile({
        name: info.name.trim(),
        city: '',
        country: info.country.trim(),
        goal: info.goal.trim(),
        xHandle: xHandle.trim(),
        experienceLevel: experienceLevel,
        languages,
      });

      // Store fallback brief context in case spawning fails
      const briefCtx = buildBriefContext(persona, agentCustomName, info, projects);
      setSpawningBriefContext(briefCtx);
      setSpawningAgent({ id: newAgent.id, name: agentName, emoji: agentEmoji });
      setCreating(false);
      setStep('spawning');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent. Please try again.');
      setCreating(false);
    }
  };

  const handlePersonaSelect = (persona: PersonaConfig) => {
    if (templatesLoading || creating) return;
    setSelectedPersona(persona);
    setError(null);
    setStep('personalize');
  };

  const handleBack = () => {
    if (step === 'personalize') {
      setStep('persona');
      setError(null);
      return;
    }
    if (fromOnboarding) {
      setHasSeenOnboard(true);
    }
    pop();
  };

  if (step === 'spawning' && spawningAgent && selectedPersona) {
    return (
      <SpawningScreen
        agentId={spawningAgent.id}
        agentName={spawningAgent.name}
        agentEmoji={spawningAgent.emoji}
        personaColor={selectedPersona.color}
        providedFields={{
          xHandle: userXHandle.trim() || undefined,
          urls: userProjects.map(p => p.url),
          location: userCountry.trim() || undefined,
          domain: userGoal.trim() || undefined,
          experienceLevel: userExperienceLevel || undefined,
          languages: userLanguages.length > 0 ? userLanguages : undefined,
          targetAudience: userTargetAudience.trim() || undefined,
        }}
        onReady={() => {
          pop();
          push('agent-detail', { id: String(spawningAgent.id) });
        }}
        onFailed={() => {
          pop();
          push('agent-detail', { id: String(spawningAgent.id), briefContext: spawningBriefContext });
        }}
      />
    );
  }

  if (step === 'personalize' && selectedPersona) {
    return (
      <AnimatePresence mode="wait">
        <PersonalizeStep
          key="personalize"
          persona={selectedPersona}
          agentCustomName={agentCustomName}
          userName={userName}
          userCountry={userCountry}
          userXHandle={userXHandle}
          userGoal={userGoal}
          userExperienceLevel={userExperienceLevel}
          userLanguages={userLanguages}
          userChallenges={userChallenges}
          userTargetAudience={userTargetAudience}
          humorStyle={userHumorStyle}
          projects={userProjects}
          onChangeAgentName={setAgentCustomName}
          onChangeName={setUserName}
          onChangeCountry={setUserCountry}
          onChangeXHandle={setUserXHandle}
          onChangeGoal={setUserGoal}
          onChangeExperienceLevel={setUserExperienceLevel}
          onChangeLanguages={setUserLanguages}
          onChangeChallenges={setUserChallenges}
          onChangeTargetAudience={setUserTargetAudience}
          onChangeHumorStyle={setUserHumorStyle}
          onAddProject={handleAddProject}
          onRemoveProject={handleRemoveProject}
          onBack={handleBack}
          onSkip={() => handleLaunch(selectedPersona, '', { name: '', country: '', goal: '' }, '', selectedPersona.humorStyle, [], '', [], '', '')}
          onLaunch={() => handleLaunch(selectedPersona, agentCustomName, { name: userName, country: userCountry, goal: userGoal }, userXHandle, userHumorStyle, userProjects, userExperienceLevel, userLanguages, userChallenges, userTargetAudience)}
          creating={creating}
          error={error}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="persona"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: t.bg,
          transition: 'background 0.3s ease',
          fontFamily: FONT,
        }}
      >
        <div style={{ padding: '56px 32px 24px', flexShrink: 0, position: 'relative' }}>
          {!fromOnboarding && (
            <button
              onClick={handleBack}
              style={{
                position: 'absolute',
                top: 20,
                right: 24,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: t.label,
                fontSize: 20,
                lineHeight: 1,
                fontFamily: FONT,
              }}
            >
              ×
            </button>
          )}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: 34,
              fontWeight: 200,
              letterSpacing: '-0.04em',
              color: t.text,
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
            style={{ fontSize: 13, color: t.label, letterSpacing: '-0.01em', lineHeight: 1.5 }}
          >
            Pick a persona. Start earning.
          </motion.p>
        </div>

        <div style={{ height: 1, background: t.divider, flexShrink: 0 }} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {shuffledPersonas.map((persona, i) => (
            <OnboardingPersonaRow
              key={persona.id}
              persona={persona}
              selected={selectedPersona?.id === persona.id}
              onSelect={() => handlePersonaSelect(persona)}
              index={i}
              dividerColor={t.divider}
              faintColor={t.faint}
              textColor={t.text}
            />
          ))}
          <div style={{ height: 40 }} />
        </div>

        <div style={{ flexShrink: 0, padding: '12px 32px 32px', borderTop: `1px solid ${t.divider}` }}>
          <p style={{ ...MONO, fontSize: 9, color: t.faint, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            You can switch or add agents anytime
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
