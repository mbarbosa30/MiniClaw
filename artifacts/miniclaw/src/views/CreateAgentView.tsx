import { useState } from 'react';
import { useTemplates, useCreateAgent, useSkillDefs, useAddKnowledge, useToggleSkill } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Card, Switch } from '@/components/ui';
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
  type: 'text' | 'url';
  content: string;
}

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
    humorStyle: 'warm',
    personaTemplate: ''
  });
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [knowledgeType, setKnowledgeType] = useState<'text' | 'url'>('text');
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
    if (!knowledgeContent.trim() || knowledgeEntries.length >= 20) return;
    setKnowledgeEntries(prev => [...prev, { type: knowledgeType, content: knowledgeContent.trim() }]);
    setKnowledgeContent('');
  };

  const removeKnowledgeEntry = (index: number) => {
    setKnowledgeEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const newAgent = await create.mutateAsync({
      name: formData.name,
      emoji: formData.emoji,
      description: formData.description,
      humorStyle: formData.humorStyle,
      personaTemplate: formData.personaTemplate,
    });

    // Enable each selected skill sequentially
    for (const skillId of selectedSkills) {
      await toggleSkillMutation.mutateAsync({ agentId: newAgent.id, skillId, enable: true }).catch(() => {});
    }

    // Upload knowledge entries sequentially
    for (const entry of knowledgeEntries) {
      await addKnowledge.mutateAsync({ agentId: newAgent.id, data: entry }).catch(() => {});
    }

    // Navigate to the new agent
    pop();
    push('agent-detail', { id: newAgent.id });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader
        title="Create Agent"
        onBack={pop}
        rightAction={
          <span className="text-xs font-semibold text-muted-foreground">
            {step}/{TOTAL_STEPS}
          </span>
        }
      />

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-1 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-black/8'}`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar">
        <AnimatePresence mode="wait">

          {/* STEP 1: Choose template */}
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="pt-4">
              <h2 className="text-2xl font-bold mb-1">Choose a template</h2>
              <p className="text-sm text-muted-foreground mb-5">This sets the base personality for your agent.</p>

              {templatesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(templates || [
                    { id: 'general', name: 'General Assistant', description: 'Helpful all-round AI', emoji: '👋' },
                    { id: 'research', name: 'Research Analyst', description: 'Deep dives & summaries', emoji: '🔬' },
                    { id: 'defi', name: 'DeFi Trader', description: 'Crypto-native market intel', emoji: '📈' },
                    { id: 'community', name: 'Community Manager', description: 'Engagement & moderation', emoji: '🤝' },
                    { id: 'coach', name: 'Personal Coach', description: 'Motivation & accountability', emoji: '💪' },
                    { id: 'support', name: 'Support Agent', description: 'Help desk & troubleshooting', emoji: '🛟' },
                  ]).map(t => (
                    <button
                      key={t.id}
                      className={`text-center p-4 rounded-2xl border-2 transition-all bg-white active:scale-[0.97] ${formData.personaTemplate === t.id ? 'border-primary bg-primary/5 shadow-md' : 'border-black/5 shadow-sm'}`}
                      onClick={() => { setFormData(p => ({ ...p, personaTemplate: t.id })); setStep(2); }}
                    >
                      <div className="text-3xl mb-2">{t.emoji}</div>
                      <div className="font-semibold text-sm leading-tight mb-1">{t.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Identity */}
          {step === 2 && (
            <motion.div key="step2" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="pt-4 space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Give it an identity</h2>
                <p className="text-sm text-muted-foreground">Name your agent and choose its personality.</p>
              </div>

              {/* Emoji + Name */}
              <div className="flex gap-3 items-start">
                <div className="relative">
                  <button
                    className="w-16 h-16 bg-secondary/40 rounded-2xl text-3xl flex items-center justify-center border-2 border-transparent focus:border-primary/20 transition-all shadow-sm"
                    onClick={() => setShowEmoji(!showEmoji)}
                    type="button"
                  >
                    {formData.emoji}
                  </button>
                  {showEmoji && (
                    <div className="absolute top-[72px] left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={(e) => { setFormData(p => ({ ...p, emoji: e.emoji })); setShowEmoji(false); }}
                        height={360}
                        searchDisabled={false}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
                  <Input
                    placeholder="e.g. ClawBot"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="mt-1"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <Textarea
                  placeholder="What is this agent for? (optional)"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Humor Style</label>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'dry', 'warm', 'playful', 'sarcastic'] as HumorStyle[]).map(style => (
                    <button
                      key={style}
                      type="button"
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${formData.humorStyle === style ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      onClick={() => setFormData(p => ({ ...p, humorStyle: style }))}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!formData.name.trim()}>
                  Next: Skills
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Skills */}
          {step === 3 && (
            <motion.div key="step3" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="pt-4 space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Enable skills</h2>
                <p className="text-sm text-muted-foreground">Choose which capabilities to give your agent.</p>
              </div>

              {skillsLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(skillDefs || [
                    { id: 'wallet-monitor', name: 'Wallet Monitor', description: 'Track wallet activity & balances' },
                    { id: 'price-watcher', name: 'Price Watcher', description: 'Monitor token prices in real time' },
                    { id: 'economics-tracker', name: 'Economics Tracker', description: 'DeFi economics & yield data' },
                    { id: 'news-radar', name: 'News Radar', description: 'Crypto news & social signals' },
                    { id: 'research-assistant', name: 'Research Assistant', description: 'Deep research on any topic' },
                    { id: 'smart-advisor', name: 'Smart Advisor', description: 'Personalized recommendations' },
                    { id: 'content-helper', name: 'Content Helper', description: 'Draft & schedule content' },
                    { id: 'reputation-monitor', name: 'Reputation Monitor', description: 'Track on-chain reputation' },
                  ]).map(skill => (
                    <div key={skill.id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-black/5 shadow-sm">
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

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>
                  Next: Knowledge
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Knowledge + Confirm */}
          {step === 4 && (
            <motion.div key="step4" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="pt-4 space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Add knowledge</h2>
                <p className="text-sm text-muted-foreground">Teach your agent specific topics. You can also add more later.</p>
              </div>

              {/* Add entry */}
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
                <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
                  {(['text', 'url'] as const).map(t => (
                    <button
                      key={t}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 ${knowledgeType === t ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
                      onClick={() => setKnowledgeType(t)}
                    >
                      {t === 'text' ? <FileText size={13} /> : <LinkIcon size={13} />}
                      {t}
                    </button>
                  ))}
                </div>
                {knowledgeType === 'text' ? (
                  <Textarea rows={2} placeholder="Paste text..." value={knowledgeContent} onChange={e => setKnowledgeContent(e.target.value)} />
                ) : (
                  <Input placeholder="https://..." value={knowledgeContent} onChange={e => setKnowledgeContent(e.target.value)} />
                )}
                <Button
                  variant="secondary"
                  className="w-full flex gap-2"
                  onClick={addKnowledgeEntry}
                  disabled={!knowledgeContent.trim() || knowledgeEntries.length >= 20}
                >
                  <Plus size={16} /> Add Entry
                </Button>
              </div>

              {/* Listed entries */}
              {knowledgeEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-1">
                    {knowledgeEntries.length}/20 entries
                  </p>
                  {knowledgeEntries.map((entry, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3.5 flex items-start gap-3 border border-black/5 shadow-sm">
                      <div className="text-primary/40 mt-0.5 shrink-0">
                        {entry.type === 'url' ? <LinkIcon size={14} /> : <FileText size={14} />}
                      </div>
                      <p className="text-sm flex-1 break-all leading-relaxed line-clamp-2 text-foreground/80">{entry.content}</p>
                      <button className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1" onClick={() => removeKnowledgeEntry(i)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="bg-secondary/20 rounded-2xl p-4 border border-secondary/30">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{formData.emoji}</span>
                  <div>
                    <p className="font-bold text-base">{formData.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{formData.personaTemplate} · {formData.humorStyle} humor</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{selectedSkills.size} skills enabled</span>
                  <span>{knowledgeEntries.length} knowledge entries</span>
                </div>
              </div>

              {create.isError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5">
                  <p className="text-xs text-destructive">
                    {create.error instanceof Error ? create.error.message : 'Failed to create agent. Please try again.'}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(3)} disabled={create.isPending}>Back</Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={create.isPending || addKnowledge.isPending || toggleSkillMutation.isPending}
                >
                  {(create.isPending || addKnowledge.isPending || toggleSkillMutation.isPending) ? 'Creating...' : 'Create Agent 🚀'}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
