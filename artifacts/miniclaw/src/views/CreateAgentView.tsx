import { useState } from 'react';
import { useTemplates, useCreateAgent, useSkillDefs, useAddKnowledge, useToggleSkill } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Switch } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { Trash2, Link as LinkIcon, FileText, Plus } from 'lucide-react';
import type { HumorStyle } from '@/types';

interface FormData {
  name: string;
  emoji: string;
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

export function CreateAgentView() {
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
    emoji: '🤖',
    description: '',
    humorStyle: 'straight',
    personaTemplate: ''
  });
  const [showEmoji, setShowEmoji] = useState(false);
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

  const [postCreateErrors, setPostCreateErrors] = useState<string[]>([]);

  const handleCreate = async () => {
    setPostCreateErrors([]);

    const result = await create.mutateAsync({
      name: formData.name,
      emoji: formData.emoji,
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
        errors.push(`Failed to enable skill: ${skillId}`);
      }
    }

    for (const entry of knowledgeEntries) {
      try {
        await addKnowledge.mutateAsync({ agentId: newAgent.id, data: entry });
      } catch {
        errors.push(`Failed to add knowledge: "${entry.title}"`);
      }
    }

    if (errors.length > 0) setPostCreateErrors(errors);

    pop();
    push('agent-detail', { id: String(newAgent.id) });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader
        title="Create Agent"
        onBack={pop}
        rightAction={
          <span className="text-[12px] font-semibold text-muted-foreground">
            {step}/{TOTAL_STEPS}
          </span>
        }
      />

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-0.5 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-neutral-200'}`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
        <AnimatePresence mode="wait">

          {/* STEP 1: Choose template */}
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -32, opacity: 0 }} className="pt-5">
              <h2 className="text-[22px] font-bold tracking-tight mb-1">Choose a template</h2>
              <p className="text-sm text-muted-foreground mb-5">This sets the base personality for your agent.</p>

              {templatesLoading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-28 bg-neutral-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {(templates || [
                    { id: 'general',   name: 'General Assistant',   description: 'Helpful all-round AI',           emoji: '👋' },
                    { id: 'research',  name: 'Research Analyst',    description: 'Deep dives & summaries',         emoji: '🔬' },
                    { id: 'defi',      name: 'DeFi Trader',         description: 'Crypto-native market intel',     emoji: '📈' },
                    { id: 'community', name: 'Community Manager',   description: 'Engagement & moderation',        emoji: '🤝' },
                    { id: 'coach',     name: 'Personal Coach',      description: 'Motivation & accountability',    emoji: '💪' },
                    { id: 'support',   name: 'Support Agent',       description: 'Help desk & troubleshooting',   emoji: '🛟' },
                  ]).map(t => (
                    <button
                      key={t.id}
                      className={`text-center p-4 rounded-xl border-2 transition-all bg-white active:scale-[0.97] ${formData.personaTemplate === t.id ? 'border-primary/50 bg-primary/4' : 'border-neutral-100'}`}
                      onClick={() => { setFormData(p => ({ ...p, personaTemplate: t.id })); setStep(2); }}
                    >
                      <div className="text-2xl mb-2">{t.emoji}</div>
                      <div className="font-semibold text-[13px] leading-tight mb-1">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{t.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Identity */}
          {step === 2 && (
            <motion.div key="step2" initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -32, opacity: 0 }} className="pt-5 space-y-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight mb-1">Give it an identity</h2>
                <p className="text-sm text-muted-foreground">Name your agent and choose its personality.</p>
              </div>

              {/* Emoji + Name */}
              <div className="flex gap-3 items-start">
                <div className="relative">
                  <button
                    className="w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-xl text-2xl flex items-center justify-center focus:border-primary/40 transition-colors"
                    onClick={() => setShowEmoji(!showEmoji)}
                    type="button"
                  >
                    {formData.emoji}
                  </button>
                  {showEmoji && (
                    <div className="absolute top-[60px] left-0 z-50 shadow-xl rounded-xl overflow-hidden border border-neutral-200">
                      <EmojiPicker
                        onEmojiClick={(e) => { setFormData(p => ({ ...p, emoji: e.emoji })); setShowEmoji(false); }}
                        height={360}
                        searchDisabled={false}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Name *</label>
                  <Input
                    placeholder="e.g. ClawBot"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="mt-1.5"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Description</label>
                <Textarea
                  placeholder="What is this agent for? (optional)"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="mt-1.5"
                />
              </div>

              {/* Humor Style */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Humor Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(HUMOR_LABELS) as HumorStyle[]).map(style => (
                    <button
                      key={style}
                      type="button"
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${formData.humorStyle === style ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-neutral-200'}`}
                      onClick={() => setFormData(p => ({ ...p, humorStyle: style }))}
                    >
                      {HUMOR_LABELS[style]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!formData.name.trim()}>
                  Next: Skills
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <motion.div key="step3" initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -32, opacity: 0 }} className="pt-5 space-y-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight mb-1">Enable skills</h2>
                <p className="text-sm text-muted-foreground">Choose which capabilities to give your agent.</p>
              </div>

              {skillsLoading ? (
                <div className="space-y-2.5">
                  {[1,2,3,4].map(i => <div key={i} className="h-14 bg-neutral-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
                  {(skillDefs || [
                    { id: 'wallet-monitor',     name: 'Wallet Monitor',       description: 'Track wallet activity & balances' },
                    { id: 'price-watcher',      name: 'Price Watcher',        description: 'Monitor token prices in real time' },
                    { id: 'economics-tracker',  name: 'Economics Tracker',    description: 'DeFi economics & yield data' },
                    { id: 'news-radar',         name: 'News Radar',           description: 'Crypto news & social signals' },
                    { id: 'research-assistant', name: 'Research Assistant',   description: 'Deep research on any topic' },
                    { id: 'smart-advisor',      name: 'Smart Advisor',        description: 'Personalized recommendations' },
                    { id: 'content-helper',     name: 'Content Helper',       description: 'Draft & schedule content' },
                    { id: 'reputation-monitor', name: 'Reputation Monitor',   description: 'Track on-chain reputation' },
                  ]).map(skill => (
                    <div key={skill.id} className="bg-white px-4 py-3.5 flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-sm">{skill.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                      </div>
                      <Switch
                        checked={selectedSkills.has(skill.id)}
                        onChange={() => toggleSkill(skill.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
                  Next: Knowledge
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Knowledge + Confirm */}
          {step === 4 && (
            <motion.div key="step4" initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -32, opacity: 0 }} className="pt-5 space-y-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight mb-1">Add knowledge</h2>
                <p className="text-sm text-muted-foreground">Teach your agent specific topics. You can also add more later.</p>
              </div>

              {/* Add entry */}
              <div className="border border-neutral-100 rounded-xl px-4 py-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Title *</label>
                  <Input
                    placeholder="e.g. Tokenomics overview"
                    value={knowledgeTitle}
                    onChange={e => setKnowledgeTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Content *</label>
                  <Textarea rows={2} placeholder="Paste text or URL…" value={knowledgeContent} onChange={e => setKnowledgeContent(e.target.value)} />
                </div>
                <Button
                  variant="secondary"
                  className="w-full flex gap-2"
                  onClick={addKnowledgeEntry}
                  disabled={!knowledgeTitle.trim() || !knowledgeContent.trim() || knowledgeEntries.length >= 20}
                >
                  <Plus size={15} /> Add Entry
                </Button>
              </div>

              {/* Listed entries */}
              {knowledgeEntries.length > 0 && (
                <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
                  {knowledgeEntries.map((entry, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3 bg-white">
                      <div className="text-muted-foreground/40 mt-0.5 shrink-0">
                        {entry.content.startsWith('http') ? <LinkIcon size={13} /> : <FileText size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{entry.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 break-all leading-relaxed line-clamp-2">{entry.content}</p>
                      </div>
                      <button className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0 p-1" onClick={() => removeKnowledgeEntry(i)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="border border-neutral-100 rounded-xl px-4 py-4 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{formData.emoji}</span>
                  <div>
                    <p className="font-bold text-[15px]">{formData.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {formData.personaTemplate} · {HUMOR_LABELS[formData.humorStyle]} humor
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{selectedSkills.size} skills enabled</span>
                  <span>{knowledgeEntries.length} knowledge entries</span>
                </div>
              </div>

              {create.isError && (
                <div className="border border-destructive/20 rounded-xl p-3.5">
                  <p className="text-xs text-destructive">
                    {create.error instanceof Error ? create.error.message : 'Failed to create agent. Please try again.'}
                  </p>
                </div>
              )}

              {postCreateErrors.length > 0 && (
                <div className="border border-neutral-200 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-foreground mb-1">Agent created, but some extras failed:</p>
                  {postCreateErrors.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(3)} disabled={create.isPending}>Back</Button>
                <Button
                  className="flex-1"
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
