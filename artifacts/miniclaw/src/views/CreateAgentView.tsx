import { useState } from 'react';
import { useTemplates, useCreateAgent } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Card } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

export function CreateAgentView() {
  const { data: templates } = useTemplates();
  const create = useCreateAgent();
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🦀',
    description: '',
    humorStyle: 'warm',
    personaTemplate: ''
  });
  const [showEmoji, setShowEmoji] = useState(false);

  const handleCreate = async () => {
    create.mutate(formData, {
      onSuccess: (newAgent) => {
        // Pop the create view, then push the new agent detail
        pop();
        push('agent-detail', { id: newAgent.id });
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-background relative z-20">
      <ScreenHeader title="Create Agent" onBack={pop} />
      
      {/* Progress */}
      <div className="px-6 py-4 flex gap-2">
        {[1,2,3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-black/5'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 no-scrollbar">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
              <h2 className="text-2xl font-display font-bold mb-6">Choose a template</h2>
              <div className="grid grid-cols-2 gap-4">
                {(templates || [
                  {id: 'general', name: 'Assistant', emoji: '👋', description: 'Helpful generalist'},
                  {id: 'defi', name: 'DeFi Trader', emoji: '📈', description: 'Crypto native'},
                  {id: 'coach', name: 'Coach', emoji: '💪', description: 'Motivating'}
                ]).map(t => (
                  <Card 
                    key={t.id} 
                    className={`p-4 cursor-pointer text-center transition-all ${formData.personaTemplate === t.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => { setFormData(p => ({...p, personaTemplate: t.id})); setStep(2); }}
                  >
                    <div className="text-4xl mb-3">{t.emoji}</div>
                    <div className="font-semibold text-sm mb-1">{t.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-6">
              <h2 className="text-2xl font-display font-bold mb-2">Give it an identity</h2>
              
              <div className="flex gap-4">
                <div className="relative">
                  <button 
                    className="w-16 h-16 bg-white rounded-2xl shadow-sm text-3xl flex items-center justify-center border-2 border-transparent focus:border-primary/10"
                    onClick={() => setShowEmoji(!showEmoji)}
                  >
                    {formData.emoji}
                  </button>
                  {showEmoji && (
                    <div className="absolute top-20 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
                      <EmojiPicker onEmojiClick={(e) => { setFormData(p => ({...p, emoji: e.emoji})); setShowEmoji(false); }} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-muted-foreground ml-1">Name</label>
                  <Input 
                    placeholder="e.g. ClawBot" 
                    value={formData.name} 
                    onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground ml-1">Description</label>
                <Textarea 
                  placeholder="What is this agent's purpose?" 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData(p => ({...p, description: e.target.value}))} 
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground ml-1 mb-2 block">Humor Style</label>
                <div className="flex flex-wrap gap-2">
                  {['none', 'dry', 'warm', 'playful', 'sarcastic'].map(style => (
                    <button
                      key={style}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${formData.humorStyle === style ? 'bg-primary text-white' : 'bg-white text-foreground'}`}
                      onClick={() => setFormData(p => ({...p, humorStyle: style}))}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button className="w-full mt-4" onClick={() => setStep(3)} disabled={!formData.name}>
                Next: Finalize
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6 text-center pt-8">
              <div className="text-6xl mb-4">{formData.emoji}</div>
              <h2 className="text-3xl font-display font-bold">{formData.name} is ready!</h2>
              <p className="text-muted-foreground px-4">Your agent will be created and connected to your wallet. You can configure skills and add knowledge from the settings later.</p>
              
              <div className="pt-8">
                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleCreate}
                  disabled={create.isPending}
                >
                  {create.isPending ? 'Creating...' : 'Create Agent'}
                </Button>
                <Button variant="ghost" className="w-full mt-2" onClick={() => setStep(2)}>Back</Button>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}
