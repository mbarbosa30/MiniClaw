import {
  Bot, Microscope, TrendingUp, Target, MessageCircle, Trophy,
  Sprout, Coins, Store, HeartPulse, BookOpen, Landmark, Rocket,
  Sparkles, ShoppingBag, Briefcase, Clapperboard, RadioTower,
  Home, Shield, Zap, Globe, Cpu, Lock, Eye, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'bot': Bot,
  'microscope': Microscope,
  'trending-up': TrendingUp,
  'target': Target,
  'message-circle': MessageCircle,
  'trophy': Trophy,
  'sprout': Sprout,
  'coins': Coins,
  'store': Store,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  'landmark': Landmark,
  'rocket': Rocket,
  'sparkles': Sparkles,
  'shopping-bag': ShoppingBag,
  'briefcase': Briefcase,
  'clapperboard': Clapperboard,
  'radio-tower': RadioTower,
  'home': Home,
  'shield': Shield,
  'zap': Zap,
  'globe': Globe,
  'cpu': Cpu,
  'lock': Lock,
  'eye': Eye,
};

export { ICON_MAP };

export function resolveIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) return null;
  return ICON_MAP[iconName] ?? null;
}

interface AgentIconProps {
  iconName?: string | null;
  emoji?: string | null;
  size?: number;
  color?: string;
  containerSize?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function AgentIcon({
  iconName,
  emoji,
  size = 20,
  color,
  containerSize,
  borderRadius,
  style,
}: AgentIconProps) {
  const cs = containerSize ?? Math.round(size * 2.4);
  const br = borderRadius ?? Math.round(cs * 0.28);

  const IconComp = iconName ? (ICON_MAP[iconName] ?? null) : null;

  const bg = color ? `${color}18` : 'rgba(128,128,128,0.08)';
  const border = color ? `${color}40` : 'rgba(128,128,128,0.16)';

  return (
    <div
      style={{
        width: cs,
        height: cs,
        borderRadius: br,
        background: bg,
        border: `1.5px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {IconComp ? (
        <IconComp size={size} color={color ?? '#888888'} strokeWidth={1.5} />
      ) : emoji ? (
        <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{emoji}</span>
      ) : (
        <Bot size={size} color={color ?? '#888888'} strokeWidth={1.5} />
      )}
    </div>
  );
}
