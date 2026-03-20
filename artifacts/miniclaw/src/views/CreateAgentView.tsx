import { useState } from 'react';
import { useTemplates, useCreateAgent, useSkillDefs, useAddKnowledge, useToggleSkill } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScreenHeader, Button, Input, Textarea, Switch } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Link as LinkIcon, FileText, Plus } from 'lucide-react';
import type { HumorStyle } from '@/types';

interface FormData {
  name: string;
  description: string;
  humorStyle: HumorStyle;
  personaTemplate: string;
}

interface KnowledgeEntry {
  title: string;
  content: string;
}

const HUMOR_LABELS: Record<HumorStyle, string> = {
  straight: 'Straight',
  'dry-wit': 'Dry Wit',
  playful: 'Playful',
  sarcastic: 'Sarcastic',
  absurdist: 'Absurdist',
};

const TOTAL_STEPS = 4;

function MonoLabel({ children, t }: { children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>
      {children}
    </p>
  );
}

export function CreateAgentView() {
  const t = useTheme();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: skillDefs, isLoading: skillsLoading } = useSkillDefs();
  const create = useCreateAgent();
  const addKnowledge = useAddKnowledge();
  const toggleSkillMutation = useToggleSkill();
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    humorStyle: 'straight',
    personaTemplate: '',
  });
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeContent, setKnowledgeContent] = useState('');

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const addKnowledgeEntry = () => {
    if (!knowledgeTitle.trim() || !knowledgeContent.trim() || knowledgeEntries.length >= 20) return;
    setKnowledgeEntries(prev => [...prev, { title: knowledgeTitle.trim(), content: knowledgeContent.trim() }]);
    setKnowledgeTitle('');
    setKnowledgeContent('');
  };

  const removeKnowledgeEntry = (index: number) => {
    setKnowledgeEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const result = await create.mutateAsync({
      name: formData.name,
      description: formData.description,
      humorStyle: formData.humorStyle,
      personaTemplate: formData.personaTemplate,
    });

    const newAgent = result.agent;
    const errors: string[] = [];

    for (const skillId of selectedSkills) {
      try {
        await toggleSkillMutation.mutateAsync({ agentId: newAgent.id, skillId, enable: true });
      } catch {
        errors.push(`skill:${skillId}`);
      }
    }

    for (const entry of knowledgeEntries) {
      try {
        await addKnowledge.mutateAsync({ agentId: newAgent.id, data: entry });
      } catch {
        errors.push(`knowledge:"${entry.title}"`);
      }
    }

    pop();
    push('agent-detail', { id: String(newAgent.id) });
  };

  const stepSlide = { initial: { x: 32, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -32, opacity: 0 } };

  const fallbackTemplates = [
    { id: 'general',   name: 'General Assistant',   description: 'Helpful all-round AI' },
    { id: 'research',  name: 'Research Analyst',    description: 'Deep dives & summaries' },
    { id: 'defi',      name: 'DeFi Trader',         description: 'Crypto-native market intel' },
    { id: 'community', name: 'Community Manager',   description: 'Engagement & moderation' },
    { id: 'coach',     name: 'Personal Coach',      description: 'Motivation & accountability' },
    { id: 'support',   name: 'Support Agent',       description: 'Help desk & troubleshooting' },
  ];

  const fallbackSkills = [
    { id: 'wallet-monitor',     name: 'Wallet Monitor',       description: 'Track wallet activity & balances' },
    { id: 'price-watcher',      name: 'Price Watcher',        description: 'Monitor token prices in real time' },
    { id: 'economics-tracker',  name: 'Economics Tracker',    description: 'DeFi economics & yield data' },
    { id: 'news-radar',         name: 'News Radar',           description: 'Crypto news & social signals' },
    { id: 'research-assistant', name: 'Research Assistant',   description: 'Deep research on any topic' },
    { id: 'smart-advisor',      name: 'Smart Advisor',        description: 'Personalized recommendations' },
    { id: 'content-helper',     name: 'Content Helper',       description: 'Draft & schedule content' },
    { id: 'reputation-monitor', name: 'Reputation Monitor',   description: 'Track on-chain reputation' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader
        title="Create Agent"
        onBack={pop}
        rightAction={
          <span style={{ fontSize: 11, fontWeight: 600, color: t.faint, fontFamily: 'ui-monospace, Menlo, monospace' }}>
            {step}/{TOTAL_STEPS}
          </span>
        }
      />

      {/* Progress bar */}
      <div style={{ padding: '10px 20px 0', display: 'flex', gap: 4, flexShrink: 0 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              height: 2,
              flex: 1,
              borderRadius: 1,
              background: i < step ? t.text : t.divider,
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
        <AnimatePresence mode="wait">

          {/* STEP 1: Choose template */}
          {step === 1 && (
            <motion.div key="step1" {...stepSlide} style={{ paddingTop: 20 }}>
              <h2 style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1, marginBottom: 6 }}>
                Choose a template
              </h2>
              <p style={{ fontSize: 13, color: t.label, marginBottom: 20, lineHeight: 1.5 }}>
                This sets the base personality for your agent.
              </p>

              {templatesLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ height: 88, background: t.surface, borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(templates || fallbackTemplates).map(tmpl => (
                    <button
                      key={tmpl.id}
                      style={{
                        textAlign: 'left',
                        padding: '14px 14px',
                        borderRadius: 12,
                        border: `1px solid ${formData.personaTemplate === tmpl.id ? t.text : t.divider}`,
                        background: formData.personaTemplate === tmpl.id ? t.surface : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => { setFormData(p => ({ ...p, personaTemplate: tmpl.id })); setStep(2); }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 600, color: t.text, letterSpacing: '-0.01em', marginBottom: 3, lineHeight: 1.3 }}>{tmpl.name}</p>
                      <p style={{ fontSize: 10, color: t.label, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              )}
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
            </motion.div>
          )}

          {/* STEP 2: Identity */}
          {step === 2 && (
            <motion.div key="step2" {...stepSlide} style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1, marginBottom: 6 }}>
                  Give it an identity
                </h2>
                <p style={{ fontSize: 13, color: t.label, lineHeight: 1.5 }}>Name your agent and choose its personality.</p>
              </div>

              <div>
                <MonoLabel t={t}>Name *</MonoLabel>
                <Input
                  placeholder="e.g. ClawBot"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <MonoLabel t={t}>Description</MonoLabel>
                <Textarea
                  placeholder="What is this agent for? (optional)"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <MonoLabel t={t}>Humor Style</MonoLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(HUMOR_LABELS) as HumorStyle[]).map(style => (
                    <button
                      key={style}
                      type="button"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: formData.humorStyle === style ? t.text : t.surface,
                        color: formData.humorStyle === style ? t.bg : t.label,
                        border: `1px solid ${formData.humorStyle === style ? t.text : t.divider}`,
                      }}
                      onClick={() => setFormData(p => ({ ...p, humorStyle: style }))}
                    >
                      {HUMOR_LABELS[style]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
                <Button style={{ flex: 1 }} onClick={() => setStep(3)} disabled={!formData.name.trim()}>
                  Next: Skills
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <motion.div key="step3" {...stepSlide} style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1, marginBottom: 6 }}>
                  Enable skills
                </h2>
                <p style={{ fontSize: 13, color: t.label, lineHeight: 1.5 }}>Choose which capabilities to give your agent.</p>
              </div>

              {skillsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: 56, background: t.surface, borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
              ) : (
                <div style={{ border: `1px solid ${t.divider}`, borderRadius: 12, overflow: 'hidden' }}>
                  {(skillDefs || fallbackSkills).map((skill, i, arr) => (
                    <div key={skill.id} style={{ background: t.surface, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : 'none' }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: t.text, letterSpacing: '-0.01em' }}>{skill.name}</p>
                        <p style={{ fontSize: 11, color: t.label, marginTop: 2 }}>{skill.description}</p>
                      </div>
                      <Switch
                        checked={selectedSkills.has(skill.id)}
                        onChange={() => toggleSkill(skill.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
                <Button style={{ flex: 1 }} onClick={() => setStep(4)}>
                  Next: Knowledge
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Knowledge + Confirm */}
          {step === 4 && (
            <motion.div key="step4" {...stepSlide} style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1, marginBottom: 6 }}>
                  Add knowledge
                </h2>
                <p style={{ fontSize: 13, color: t.label, lineHeight: 1.5 }}>
                  Teach your agent specific topics. You can also add more later.
                </p>
              </div>

              {/* Add entry */}
              <div style={{ border: `1px solid ${t.divider}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <MonoLabel t={t}>Title *</MonoLabel>
                  <Input placeholder="e.g. Tokenomics overview" value={knowledgeTitle} onChange={e => setKnowledgeTitle(e.target.value)} />
                </div>
                <div>
                  <MonoLabel t={t}>Content *</MonoLabel>
                  <Textarea rows={2} placeholder="Paste text or URL…" value={knowledgeContent} onChange={e => setKnowledgeContent(e.target.value)} />
                </div>
                <Button
                  variant="secondary"
                  style={{ width: '100%', display: 'flex', gap: 8 }}
                  onClick={addKnowledgeEntry}
                  disabled={!knowledgeTitle.trim() || !knowledgeContent.trim() || knowledgeEntries.length >= 20}
                >
                  <Plus size={14} /> Add Entry
                </Button>
              </div>

              {/* Listed entries */}
              {knowledgeEntries.length > 0 && (
                <div style={{ border: `1px solid ${t.divider}`, borderRadius: 12, overflow: 'hidden' }}>
                  {knowledgeEntries.map((entry, i) => (
                    <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, background: t.surface, borderBottom: i < knowledgeEntries.length - 1 ? `1px solid ${t.divider}` : 'none' }}>
                      <div style={{ color: t.faint, marginTop: 2, flexShrink: 0 }}>
                        {entry.content.startsWith('http') ? <LinkIcon size={13} /> : <FileText size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</p>
                        <p style={{ fontSize: 11, color: t.label, marginTop: 2, wordBreak: 'break-all', lineHeight: 1.5 }}>{entry.content}</p>
                      </div>
                      <button style={{ color: t.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }} onClick={() => removeKnowledgeEntry(i)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div style={{ border: `1px solid ${t.divider}`, borderRadius: 12, padding: '14px 16px', background: t.surface }}>
                <p style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1, marginBottom: 4 }}>
                  {formData.name}
                </p>
                <p style={{ fontSize: 11, color: t.label, marginBottom: 10 }}>
                  {formData.personaTemplate} · {HUMOR_LABELS[formData.humorStyle]} humor
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'skills', value: selectedSkills.size },
                    { label: 'knowledge', value: knowledgeEntries.length },
                  ].map(({ label, value }) => (
                    <span key={label} style={{ fontSize: 9, fontFamily: 'ui-monospace, Menlo, monospace', color: t.faint, letterSpacing: '0.05em' }}>
                      {value} {label}
                    </span>
                  ))}
                </div>
              </div>

              {create.isError && (
                <div style={{ border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: '#f87171' }}>
                    {create.error instanceof Error ? create.error.message : 'Failed to create agent. Please try again.'}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep(3)} disabled={create.isPending}>Back</Button>
                <Button
                  style={{ flex: 1 }}
                  onClick={handleCreate}
                  disabled={create.isPending || addKnowledge.isPending || toggleSkillMutation.isPending}
                >
                  {(create.isPending || addKnowledge.isPending || toggleSkillMutation.isPending) ? 'Creating…' : 'Create Agent'}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
