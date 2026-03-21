import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useTemplates, useCreateAgent, useSpawningStatus } from '@/hooks/use-agents';
import { useRouter, useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { resolveIcon } from '@/lib/agent-icon';
import { PERSONAS, HUSTLE_MODE_SOUL_APPEND } from '@/lib/personas';
import type { PersonaConfig } from '@/lib/personas';
import type { HumorStyle, SpawningProgressStep } from '@/types';

interface UserInfo {
  name: string;
  city: string;
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


const EXP_LEVELS: { value: 'beginner' | 'intermediate' | 'expert'; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Growing' },
  { value: 'expert', label: 'Advanced' },
];

function PersonalizeStep({
  persona,
  agentCustomName,
  userName,
  userCity,
  userCountry,
  userXHandle,
  userGoal,
  userExperienceLevel,
  userTargetAudience,
  humorStyle,
  projects,
  onChangeAgentName,
  onChangeName,
  onChangeCity,
  onChangeCountry,
  onChangeXHandle,
  onChangeGoal,
  onChangeExperienceLevel,
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
  userCity: string;
  userCountry: string;
  userXHandle: string;
  userGoal: string;
  userExperienceLevel: '' | 'beginner' | 'intermediate' | 'expert';
  userTargetAudience: string;
  humorStyle: HumorStyle;
  projects: ProjectEntry[];
  onChangeAgentName: (v: string) => void;
  onChangeName: (v: string) => void;
  onChangeCity: (v: string) => void;
  onChangeCountry: (v: string) => void;
  onChangeXHandle: (v: string) => void;
  onChangeGoal: (v: string) => void;
  onChangeExperienceLevel: (v: '' | 'beginner' | 'intermediate' | 'expert') => void;
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
  const [nameError, setNameError] = useState<string | null>(null);

  const hasAdvancedData = !!userExperienceLevel || !!userTargetAudience;
  const [advancedOpen, setAdvancedOpen] = useState(() => hasAdvancedData);

  const showAudienceField = AUDIENCE_AWARE_PERSONAS.has(persona.id);

  const handleLaunchClick = () => {
    if (!agentCustomName.trim()) {
      setNameError('Give your agent a name to continue.');
      return;
    }
    setNameError(null);
    onLaunch();
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
    padding: '9px 14px',
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
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Inline back button */}
        <button
          onClick={onBack}
          disabled={creating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '20px 28px 0',
            color: t.label,
            fontFamily: FONT,
          }}
        >
          <ChevronLeft size={16} color={t.label} />
          <span style={{ fontSize: 12, letterSpacing: '-0.01em' }}>Back</span>
        </button>

        {/* Hero */}
        <div style={{ padding: '14px 32px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 3, height: 20, background: persona.color, borderRadius: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 20, fontWeight: 200, letterSpacing: '-0.04em', color: t.text, lineHeight: 1.15 }}>
              Introduce yourself to {agentCustomName.trim() || persona.name.split(' ')[0]}.
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: t.divider }} />

        <div style={{ padding: '20px 32px 48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Agent name — required */}
            <div>
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Agent name
              </p>
              <input
                type="text"
                value={agentCustomName}
                onChange={e => { onChangeAgentName(e.target.value); if (nameError) setNameError(null); }}
                placeholder={`e.g. Alex, Maya, ${persona.name.split(' ')[0]}`}
                disabled={creating}
                style={{
                  ...inputStyle,
                  borderColor: nameError ? '#f87171' : undefined,
                }}
              />
              {nameError && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, letterSpacing: '-0.005em' }}>{nameError}</p>
              )}
            </div>

            {/* Your first name */}
            <div>
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Your first name
              </p>
              <input type="text" value={userName} onChange={e => onChangeName(e.target.value)}
                placeholder="e.g. Amara" disabled={creating} style={inputStyle} />
            </div>

            {/* City + Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  City
                </p>
                <input type="text" value={userCity} onChange={e => onChangeCity(e.target.value)}
                  placeholder="Lagos, Nairobi…" disabled={creating} style={inputStyle} />
              </div>
              <div>
                <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Country
                </p>
                <input type="text" value={userCountry} onChange={e => onChangeCountry(e.target.value)}
                  placeholder="Nigeria, Kenya…" disabled={creating} style={inputStyle} />
              </div>
            </div>

            {/* X / Twitter handle */}
            <div>
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                X / Twitter <span style={{ textTransform: 'none', fontStyle: 'normal', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
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
            </div>

            {/* Goal */}
            <div>
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                What are you working on?
              </p>
              <input type="text" value={userGoal} onChange={e => onChangeGoal(e.target.value)}
                placeholder="e.g. TikTok shop, freelancing on Fiverr…" disabled={creating} style={inputStyle} />
            </div>

            {/* Humor */}
            <div>
              <div style={{ height: 1, background: t.divider, marginBottom: 14 }} />
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Humor
              </p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {HUMOR_STYLES.map(style => {
                  const active = humorStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => onChangeHumorStyle(style)}
                      disabled={creating}
                      style={{
                        padding: '6px 13px',
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
            </div>

            {/* My projects */}
            <div>
              <div style={{ height: 1, background: t.divider, marginBottom: 14 }} />
              <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                My projects
              </p>
              <p style={{ fontSize: 11, color: t.label, letterSpacing: '-0.005em', lineHeight: 1.5, marginBottom: 10 }}>
                Share links — your agent will read them so it knows your work from day one.
              </p>

              {projects.length < MAX_PROJECTS && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
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
                      padding: '9px 12px',
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
                      padding: '9px 14px',
                      background: urlInput.trim() ? t.text : t.surface,
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
                <p style={{ ...MONO, fontSize: 10, color: '#f87171', marginBottom: 8, marginTop: -2 }}>
                  {urlError}
                </p>
              )}
              {projects.length >= MAX_PROJECTS && (
                <p style={{ ...MONO, fontSize: 10, color: t.faint, marginBottom: 8 }}>
                  Max {MAX_PROJECTS} projects reached.
                </p>
              )}
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
                        padding: '9px 12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {p.fetchStatus === 'loading' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <OnboardingSpinner color={t.faint} />
                            <span style={{ fontSize: 11, color: t.faint, letterSpacing: '-0.01em' }}>Fetching info…</span>
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
                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: t.label, fontSize: 16, lineHeight: 1, padding: '0 2px', fontFamily: FONT }}
                      >×</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced section toggle */}
            <div>
                <div style={{ height: 1, background: t.divider }} />
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
                    padding: '14px 0 0',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <span style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    More detail = better research
                  </span>
                  <ChevronDown
                    size={14}
                    color={t.faint}
                    style={{
                      transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 18 }}>

                        {/* Experience level */}
                        <div>
                          <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
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
                                    padding: '7px 0',
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

                        {/* Target audience — only for commerce/creator personas */}
                        {showAudienceField && (
                          <div>
                            <p style={{ ...MONO, fontSize: 11, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
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
            </div>

            {/* API error */}
            {error && (
              <p style={{ fontSize: 11, color: '#f87171', letterSpacing: '-0.005em', marginTop: 4 }}>{error}</p>
            )}

            {/* Launch button */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handleLaunchClick}
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: creating ? `${t.text}80` : t.text,
                  border: 'none',
                  borderRadius: 8,
                  cursor: creating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: FONT,
                  marginBottom: 10,
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

          </div>
        </div>
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
  const [userCity, setUserCity] = useState(() => userProfile.city);
  const [userCountry, setUserCountry] = useState(() => userProfile.country);
  const [userXHandle, setUserXHandle] = useState(() => userProfile.xHandle);
  const [userGoal, setUserGoal] = useState(() => userProfile.goal);
  const [userExperienceLevel, setUserExperienceLevel] = useState<'' | 'beginner' | 'intermediate' | 'expert'>(() => userProfile.experienceLevel);
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
    const cityPart = info.city.trim();
    const countryPart = info.country.trim();
    const locationPart = [cityPart, countryPart].filter(Boolean).join(', ');
    const goalPart = info.goal.trim();
    const customName = agentCustomName.trim();

    let intro = 'Hi!';
    if (namePart && locationPart) intro = `Hi! I'm ${namePart} from ${locationPart}.`;
    else if (namePart) intro = `Hi! I'm ${namePart}.`;
    else if (locationPart) intro = `Hi! I'm based in ${locationPart}.`;

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
    targetAudience: string
  ) => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const templateId = resolveTemplate(persona.personaTemplate);
      const urlList = projects.map(p => p.url);
      const locationStr = [info.city.trim(), info.country.trim()].filter(Boolean).join(', ') || undefined;
      const savedLanguages = userProfile.languages.length > 0 ? userProfile.languages : ['English'];
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
        location: locationStr,
        xHandle: xHandle.trim() || undefined,
        urls: urlList.length > 0 ? urlList : undefined,
        domain: info.goal.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        languages: savedLanguages,
        targetAudience: targetAudience.trim() || undefined,
      });

      const newAgent = result.agent;
      const agentName = agentCustomName.trim() || persona.name;
      const agentEmoji = persona.emoji;

      setHasSeenOnboard(true);
      setUserProfile({
        name: info.name.trim(),
        city: info.city.trim(),
        country: info.country.trim(),
        goal: info.goal.trim(),
        xHandle: xHandle.trim(),
        experienceLevel: experienceLevel,
        languages: userProfile.languages,
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
          location: [userCity.trim(), userCountry.trim()].filter(Boolean).join(', ') || undefined,
          domain: userGoal.trim() || undefined,
          experienceLevel: userExperienceLevel || undefined,
          languages: userProfile.languages.length > 0 ? userProfile.languages : ['English'],
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
          userCity={userCity}
          userCountry={userCountry}
          userXHandle={userXHandle}
          userGoal={userGoal}
          userExperienceLevel={userExperienceLevel}
          userTargetAudience={userTargetAudience}
          humorStyle={userHumorStyle}
          projects={userProjects}
          onChangeAgentName={setAgentCustomName}
          onChangeName={setUserName}
          onChangeCity={setUserCity}
          onChangeCountry={setUserCountry}
          onChangeXHandle={setUserXHandle}
          onChangeGoal={setUserGoal}
          onChangeExperienceLevel={setUserExperienceLevel}
          onChangeTargetAudience={setUserTargetAudience}
          onChangeHumorStyle={setUserHumorStyle}
          onAddProject={handleAddProject}
          onRemoveProject={handleRemoveProject}
          onBack={handleBack}
          onSkip={() => handleLaunch(selectedPersona, '', { name: '', city: '', country: '', goal: '' }, '', selectedPersona.humorStyle, [], '', '')}
          onLaunch={() => handleLaunch(selectedPersona, agentCustomName, { name: userName, city: userCity, country: userCountry, goal: userGoal }, userXHandle, userHumorStyle, userProjects, userExperienceLevel, userTargetAudience)}
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
