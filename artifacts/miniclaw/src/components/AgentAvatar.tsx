import { Bot } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { resolveIcon } from '@/lib/agent-icon';
import { PERSONAS } from '@/lib/personas';

const PERSONA_BY_TAGLINE = new Map(PERSONAS.map(p => [p.tagline, p]));

export function AgentAvatar({ emoji, icon, description, size = 18 }: {
  emoji?: string | null;
  icon?: string | null;
  description?: string | null;
  size?: number;
}) {
  const t = useTheme();
  const Icon = resolveIcon(icon);
  if (Icon) return <Icon size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
  const resolvedEmoji = emoji ?? PERSONA_BY_TAGLINE.get(description ?? '')?.emoji;
  if (resolvedEmoji) return <span style={{ fontSize: size - 5, lineHeight: 1, flexShrink: 0 }}>{resolvedEmoji}</span>;
  const FallbackIcon = resolveIcon(PERSONA_BY_TAGLINE.get(description ?? '')?.icon);
  if (FallbackIcon) return <FallbackIcon size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
  return <Bot size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
}
