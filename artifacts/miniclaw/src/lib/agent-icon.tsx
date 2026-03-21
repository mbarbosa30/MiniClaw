import {
  Bot, Zap, ShoppingBag, Briefcase, Video, Radio, Home,
  Brain, Star, Target, TrendingUp, DollarSign, Globe, User,
  Cpu, Layers, Flame, Shield, Award, Heart, Leaf, Rocket,
  Compass, Map, Lightbulb, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  bot: Bot,
  zap: Zap,
  'shopping-bag': ShoppingBag,
  briefcase: Briefcase,
  video: Video,
  radio: Radio,
  home: Home,
  brain: Brain,
  star: Star,
  target: Target,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  globe: Globe,
  user: User,
  cpu: Cpu,
  layers: Layers,
  flame: Flame,
  shield: Shield,
  award: Award,
  heart: Heart,
  leaf: Leaf,
  rocket: Rocket,
  compass: Compass,
  map: Map,
  lightbulb: Lightbulb,
};

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
