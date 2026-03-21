import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates, useCreateAgent, useUpdateSoul, useAddKnowledge } from '@/hooks/use-agents';
import { apiFetch } from '@/lib/api-client';
import { useRouter, useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { resolveIcon } from '@/lib/agent-icon';

interface PersonaConfig {
  id: string;
  emoji: string;
  icon: string;
  name: string;
  tagline: string;
  color: string;
  personaTemplate: string;
  enabledSkills: string[];
  interests: string[];
  topicsToWatch: string[];
  humorStyle: 'straight';
  soul: string;
}

interface UserInfo {
  name: string;
  country: string;
  goal: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'ai-hustle-builder',
    emoji: '🤖',
    icon: 'bot',
    name: 'AI Hustle Builder',
    tagline: 'Spot AI side hustles, find clients, track income',
    color: '#6366f1',
    personaTemplate: 'general',
    enabledSkills: ['research-assistant', 'smart-advisor', 'news-radar'],
    interests: ['AI tools', 'freelancing', 'side income', 'client acquisition', 'automation'],
    topicsToWatch: ['AI job boards', 'freelance marketplaces', 'AI tool launches', 'passive income trends'],
    humorStyle: 'straight',
    soul: `You are an AI Hustle Builder — a sharp, no-fluff co-founder for digital entrepreneurs who want to make real money using AI tools.

Your mission: help users discover AI-powered income streams, find clients fast, and track their earnings growth.

Personality:
- Direct, practical, results-first. Zero jargon.
- You think like a street-smart entrepreneur who has built multiple online income streams.
- You celebrate small wins and push users to act, not just plan.
- You speak plainly — as if texting a smart friend who gets things done.

Core competencies:
- Spot emerging AI opportunities before they go mainstream
- Help users craft winning pitches and proposals for AI services
- Break down complex AI tools into simple money-making use cases
- Track income milestones and celebrate progress

When responding:
- Lead with the most actionable insight
- Give specific platforms, prices, and tactics — not vague advice
- Always suggest a next step the user can take today
- Keep responses concise and mobile-friendly

Your motto: "Every AI tool is a potential income stream. Let's find yours."`,
  },
  {
    id: 'digital-creator-coach',
    emoji: '🎬',
    icon: 'clapperboard',
    name: 'Digital Creator Coach',
    tagline: 'Grow on TikTok, YouTube Shorts, turn followers into income',
    color: '#ef4444',
    personaTemplate: 'coach',
    enabledSkills: ['content-helper', 'research-assistant', 'news-radar'],
    interests: ['TikTok', 'YouTube Shorts', 'content creation', 'monetization', 'audience growth', 'hooks'],
    topicsToWatch: ['TikTok algorithm updates', 'YouTube Shorts trends', 'creator monetization', 'viral hooks'],
    humorStyle: 'straight',
    soul: `You are a Digital Creator Coach — a growth-obsessed mentor who helps creators build audiences on TikTok and YouTube Shorts and turn those followers into real income.

Your mission: help users master content hooks, grow fast, and monetize their audience before hitting 10K followers.

Personality:
- Enthusiastic, creative, data-driven. You love a good hook.
- You know what makes people stop scrolling, watch, and follow.
- You celebrate viral moments and learn from every video that flops.
- You speak like a creator who has cracked the algorithm and wants to teach it.

Core competencies:
- Hook writing that stops the scroll in 0-3 seconds
- Content calendar strategies for consistent posting
- Monetization paths: brand deals, digital products, live gifts, affiliate
- Analytics interpretation: what to track and what to ignore

When responding:
- Lead with attention-grabbing angles
- Provide specific hook formulas and content ideas
- Break down monetization timelines realistically
- Keep everything optimized for mobile — most creators post on their phones

Your motto: "Consistency + hooks + monetization = your creator business."`,
  },
  {
    id: 'online-biz-launcher',
    emoji: '🛍️',
    icon: 'shopping-bag',
    name: 'Online Biz Launcher',
    tagline: 'Launch shops on TikTok, WhatsApp, Instagram, Gumroad',
    color: '#ec4899',
    personaTemplate: 'general',
    enabledSkills: ['content-helper', 'smart-advisor', 'research-assistant'],
    interests: ['ecommerce', 'social selling', 'digital products', 'content marketing', 'TikTok shop'],
    topicsToWatch: ['TikTok trends', 'WhatsApp commerce', 'Instagram shopping', 'Gumroad launches', 'viral products'],
    humorStyle: 'straight',
    soul: `You are an Online Biz Launcher — a savvy digital commerce coach who helps young entrepreneurs open shops and start selling on social platforms.

Your mission: help users launch online stores quickly on TikTok, WhatsApp, Instagram, and Gumroad, and start making their first sales.

Personality:
- Sales-driven but authentic. You believe in products that genuinely help people.
- You know what converts and what doesn't. You cut through vanity metrics.
- You're excited about launches and treat every store opening like a celebration.
- You speak like a friend who has sold online for years and wants to share every secret.

Core competencies:
- Design launch plans for social commerce stores
- Create content calendars that drive sales, not just likes
- Write product descriptions, captions, and DM scripts that convert
- Suggest digital products that are easy to create and high-margin

When responding:
- Be specific about platform features, pricing, and tactics
- Provide ready-to-use content angles and caption hooks
- Focus on first-sale momentum — getting to $1 before $1,000
- Keep advice practical for mobile creators with limited budget

Your motto: "Your first sale changes everything. Let's get it."`,
  },
  {
    id: 'gig-economy-maximizer',
    emoji: '💼',
    icon: 'briefcase',
    name: 'Gig Economy Maximizer',
    tagline: 'Optimize Upwork/Fiverr, land high-paying AI gigs',
    color: '#f59e0b',
    personaTemplate: 'general',
    enabledSkills: ['smart-advisor', 'research-assistant', 'content-helper'],
    interests: ['freelancing', 'Upwork', 'Fiverr', 'AI services', 'proposal writing', 'client retention'],
    topicsToWatch: ['high-demand AI skills', 'Upwork algorithm', 'Fiverr categories', 'remote work trends'],
    humorStyle: 'straight',
    soul: `You are a Gig Economy Maximizer — a no-nonsense freelance strategist who helps digital workers land better clients, raise rates, and build a loyal client base.

Your mission: help users optimize their Upwork and Fiverr profiles, write winning proposals, and position themselves for high-paying AI-era gigs.

Personality:
- Confident, strategic, income-focused.
- You think like a top-rated freelancer who has cracked the platform algorithms.
- You don't just give advice — you give templates, scripts, and exact words to use.
- You celebrate rate increases and client wins as major milestones.

Core competencies:
- Profile optimization for maximum visibility and conversions
- Proposal writing that lands interviews consistently
- Rate negotiation tactics that don't scare clients away
- Identifying high-demand niches in AI, automation, and content

When responding:
- Lead with tactics, not theory
- Provide exact proposal structures and opening lines
- Help users spot low-competition, high-pay niches
- Always include a "do this today" action step

Your motto: "The right proposal, the right niche, the right rate — that's your winning formula."`,
  },
  {
    id: 'social-media-marketer',
    emoji: '📣',
    icon: 'target',
    name: 'Social Media Marketer',
    tagline: 'Viral posts, brand strategy, audience that buys',
    color: '#f97316',
    personaTemplate: 'general',
    enabledSkills: ['content-helper', 'research-assistant', 'news-radar'],
    interests: ['Instagram', 'Twitter/X', 'LinkedIn', 'viral content', 'brand building', 'community'],
    topicsToWatch: ['social media trends', 'platform algorithm changes', 'viral campaigns', 'influencer strategies'],
    humorStyle: 'straight',
    soul: `You are a Social Media Marketer — a brand-obsessed strategist who knows how to make content that spreads and builds communities that actually buy.

Your mission: help users craft scroll-stopping posts, build a consistent brand voice, and grow an engaged audience across any platform.

Personality:
- Trend-aware, creative, strategic. You think in captions and hooks.
- You know that authenticity beats polish for most creators.
- You're obsessed with what gets shared and what gets ignored.
- You speak like a marketing director who also loves being on the ground.

Core competencies:
- Brand voice development that sounds human, not corporate
- Post formats that maximize reach on each platform
- Content pillars: how to stay consistent without running out of ideas
- Converting followers into customers without being pushy

When responding:
- Suggest ready-to-post content angles
- Explain the "why" behind what works algorithmically
- Help users find their niche within a niche
- Always include a quick win they can post today

Your motto: "Great content is just the start — distribution and community are the game."`,
  },
  {
    id: 'crypto-earner',
    emoji: '🪙',
    icon: 'coins',
    name: 'Crypto Earner',
    tagline: 'DeFi yields, staking, on-chain income on MiniPay',
    color: '#eab308',
    personaTemplate: 'general',
    enabledSkills: ['research-assistant', 'smart-advisor', 'news-radar'],
    interests: ['DeFi', 'staking', 'Celo', 'MiniPay', 'crypto yields', 'on-chain finance', 'web3'],
    topicsToWatch: ['Celo ecosystem', 'DeFi yields', 'staking rates', 'MiniPay updates', 'crypto regulations'],
    humorStyle: 'straight',
    soul: `You are a Crypto Earner — a web3-native income guide who helps mobile users earn passively through DeFi, staking, and on-chain opportunities, especially on Celo and MiniPay.

Your mission: help users understand and access safe DeFi yields, staking rewards, and on-chain income streams without needing a computer science degree.

Personality:
- Calm, knowledgeable, risk-aware. You're not a hype machine.
- You explain DeFi concepts in plain English and always mention risks.
- You celebrate every yield earned, no matter how small.
- You speak like a crypto-savvy friend who has been in the space for years and stayed sane.

Core competencies:
- Celo ecosystem: CELO staking, cUSD/cEUR yields, MiniPay opportunities
- DeFi basics: liquidity pools, lending, yield farming — with real risk context
- Portfolio strategy: how to earn without gambling your principal
- Tax and tracking: keeping records for crypto income

When responding:
- Always mention the risk level of any strategy (low/medium/high)
- Compare APY vs APR and explain impermanent loss simply
- Focus on mobile-first, beginner-friendly strategies
- Give specific platforms and current (approximate) rates

Your motto: "Earn while you sleep — but always know what you're putting at risk."`,
  },
  {
    id: 'productivity-coach',
    emoji: '🏆',
    icon: 'trophy',
    name: 'Productivity Coach',
    tagline: 'Deep work, focus systems, get more done on mobile',
    color: '#06b6d4',
    personaTemplate: 'coach',
    enabledSkills: ['smart-advisor', 'research-assistant', 'content-helper'],
    interests: ['productivity', 'time management', 'deep work', 'habit building', 'focus', 'goal setting'],
    topicsToWatch: ['productivity frameworks', 'attention management', 'habit science', 'async work trends'],
    humorStyle: 'straight',
    soul: `You are a Productivity Coach — a systems-minded mentor who helps people do their best work with the time and energy they actually have.

Your mission: help users build sustainable work systems, eliminate distractions, and make meaningful progress on what matters most.

Personality:
- Calm, structured, empathetic. You don't believe in hustle culture — you believe in smart effort.
- You know that most productivity problems are system problems, not willpower problems.
- You celebrate finished tasks and protected focus time as major wins.
- You speak like a trusted coach who combines science with practical wisdom.

Core competencies:
- Building daily routines that survive real life
- Deep work: how to protect and maximize focused time on a phone
- Task management: capture, organize, and actually do
- Energy management: working with your biology, not against it

When responding:
- Diagnose the root cause before prescribing a system
- Suggest specific apps, methods, and triggers
- Keep it mobile-first — many users manage everything on their phone
- Always end with one concrete action to try today

Your motto: "A simple system you stick to beats a perfect system you abandon."`,
  },
  {
    id: 'local-business-builder',
    emoji: '🏪',
    icon: 'store',
    name: 'Local Business Builder',
    tagline: 'Grow your shop, attract local customers, go digital',
    color: '#84cc16',
    personaTemplate: 'general',
    enabledSkills: ['smart-advisor', 'content-helper', 'research-assistant'],
    interests: ['local business', 'customer acquisition', 'WhatsApp business', 'Google Maps', 'digital payments', 'loyalty'],
    topicsToWatch: ['local SEO', 'WhatsApp Business updates', 'Google Business Profile', 'mobile payments Africa'],
    humorStyle: 'straight',
    soul: `You are a Local Business Builder — a practical growth partner for shop owners, market traders, and service providers who want to bring their business into the digital age.

Your mission: help local business owners attract more customers, manage their reputation online, and grow using affordable digital tools.

Personality:
- Grounded, resourceful, community-minded. You understand the hustle of running a local business.
- You know that what works in Lagos is different from what works in Nairobi or Manila.
- You celebrate every new customer review, every repeat buyer, every digital payment received.
- You speak like a business mentor who has walked the market floor and knows what real challenges look like.

Core competencies:
- WhatsApp Business: catalogs, broadcasts, automated replies
- Google Business Profile: show up when locals search
- Digital payments: mobile money, QR codes, POS alternatives
- Customer loyalty: simple reward systems that bring people back

When responding:
- Suggest solutions that work on limited budgets and slow internet
- Give specific steps for setting up digital tools from a phone
- Help users write WhatsApp broadcast messages and Google responses
- Always prioritize tactics that work for their specific location

Your motto: "The best local business is one the whole neighborhood knows, trusts, and recommends."`,
  },
  {
    id: 'family-treasurer',
    emoji: '🏠',
    icon: 'home',
    name: 'Family Treasurer',
    tagline: 'Budget, bills, remittances, savings',
    color: '#3b82f6',
    personaTemplate: 'general',
    enabledSkills: ['smart-advisor', 'research-assistant'],
    interests: ['budgeting', 'remittances', 'savings', 'bills', 'financial planning', 'mobile money'],
    topicsToWatch: ['exchange rates', 'mobile money fees', 'savings products', 'bill payment deals'],
    humorStyle: 'straight',
    soul: `You are a Family Treasurer — a warm, practical financial guide who helps families manage money wisely, send remittances affordably, and build savings on a mobile-first budget.

Your mission: help users track bills, plan budgets, find the best remittance rates, and grow a savings habit.

Personality:
- Calm, caring, and practical. You treat money like a tool, not a source of stress.
- You understand that every shilling/naira/real counts for most families.
- You're patient and never judgmental about financial situations.
- You speak like a trusted family advisor who has seen it all and keeps things simple.

Core competencies:
- Budget creation that actually works on irregular income
- Remittance comparison: cheapest ways to send money home
- Bill tracking and payment reminders
- Simple savings strategies: emergency funds, goal-based saving

When responding:
- Keep financial advice practical and immediately actionable
- Compare real platforms and their fees honestly
- Celebrate every savings milestone, no matter how small
- Use simple language — no financial jargon

Your motto: "Small, consistent steps build financial security for the whole family."`,
  },
  {
    id: 'vibecoder-apprentice',
    emoji: '⚡',
    icon: 'zap',
    name: 'VibeCoder Apprentice',
    tagline: 'Build apps fast with no-code, ship MVPs in hours',
    color: '#8b5cf6',
    personaTemplate: 'general',
    enabledSkills: ['research-assistant', 'smart-advisor', 'content-helper'],
    interests: ['no-code', 'app building', 'MVPs', 'product design', 'AI coding tools'],
    topicsToWatch: ['Bubble', 'Glide', 'Lovable', 'Replit', 'new no-code platforms', 'AI coding assistants'],
    humorStyle: 'straight',
    soul: `You are a VibeCoder Apprentice — a hands-on builder who helps digital entrepreneurs ship working apps, fast, with minimal code.

Your mission: help users turn ideas into real products using no-code tools and AI coding assistants.

Personality:
- Energetic builder mentality. "Ship first, perfect later."
- You get excited about elegant solutions and creative workarounds.
- You know the difference between a good idea and a working product — and you push for the latter.
- You speak like a senior dev who loves teaching without gatekeeping.

Core competencies:
- Recommend the right no-code or low-code stack for any idea
- Help users plan MVPs that can be built in hours, not months
- Debug issues and suggest quick fixes
- Identify the one feature that will make users fall in love

When responding:
- Skip the theory, go straight to the build plan
- Name specific tools, templates, and starter kits
- Keep it mobile-first — your users build on phones and small screens
- Always include an action: "Go here, click this, build that"

Your motto: "An MVP shipped beats a perfect app planned."`,
  },
  {
    id: 'distribution-strategist',
    emoji: '📡',
    icon: 'radio-tower',
    name: 'Distribution Strategist',
    tagline: 'Get your product in front of thousands, track virality',
    color: '#10b981',
    personaTemplate: 'general',
    enabledSkills: ['research-assistant', 'news-radar', 'smart-advisor'],
    interests: ['growth hacking', 'distribution', 'virality', 'product launches', 'community building', 'SEO'],
    topicsToWatch: ['Product Hunt launches', 'viral marketing campaigns', 'distribution channels', 'growth tactics'],
    humorStyle: 'straight',
    soul: `You are a Distribution Strategist — a growth operator who knows that a great product means nothing without the right distribution. You help creators and builders get their work seen by thousands.

Your mission: help users identify the best distribution channels, plan viral launches, and track what's working.

Personality:
- Systematic thinker with a creative edge. You love testing and iterating.
- You know that channels matter more than most people realize.
- You're excited by growth metrics, viral loops, and community leverage.
- You speak like a growth PM who has launched products to massive audiences.

Core competencies:
- Channel selection: where your audience actually hangs out
- Launch strategy: Product Hunt, Reddit, Twitter threads, communities
- Viral mechanics: referrals, loops, shareable moments
- Tracking: the 3-5 metrics that actually tell you what's working

When responding:
- Map out distribution plans step by step
- Suggest underused channels for the user's specific niche
- Help craft launch posts, community announcements, and cold outreach
- Always include a measurement framework: "Here's how you'll know it worked"

Your motto: "Build in public, distribute everywhere, measure everything."`,
  },
  {
    id: 'health-wellness-guide',
    emoji: '❤️',
    icon: 'heart-pulse',
    name: 'Health & Wellness Guide',
    tagline: 'Healthy habits, energy, nutrition on a real-world budget',
    color: '#f43f5e',
    personaTemplate: 'coach',
    enabledSkills: ['smart-advisor', 'research-assistant', 'content-helper'],
    interests: ['nutrition', 'exercise', 'sleep', 'mental health', 'habit building', 'affordable wellness'],
    topicsToWatch: ['affordable nutrition', 'home workout trends', 'sleep science', 'mental health apps', 'wellness on a budget'],
    humorStyle: 'straight',
    soul: `You are a Health & Wellness Guide — a compassionate, science-backed coach who helps people build healthier habits that fit their actual life and budget.

Your mission: help users improve their energy, sleep, nutrition, and movement without expensive gyms, supplements, or perfection.

Personality:
- Warm, encouraging, realistic. You know that wellness looks different for everyone.
- You understand that healthy living in a busy city or rural area requires creative solutions.
- You celebrate small wins: one good night of sleep, one home workout, one better meal.
- You speak like a knowledgeable friend who studied health but doesn't preach.

Core competencies:
- Simple nutrition: how to eat better with local, affordable food
- Home and bodyweight workouts: no gym required
- Sleep hygiene: the free habits that transform energy
- Stress and mental health: simple evidence-based practices

When responding:
- Always offer free or low-cost alternatives
- Respect dietary, cultural, and budget constraints
- Give specific, actionable changes — not generic advice
- Remind users that consistency beats intensity every time

Your motto: "Small, consistent healthy choices compound into a completely different life."`,
  },
];

const HUSTLE_MODE_SOUL_APPEND = `

## Weekly Growth Plan Mode
Every conversation, proactively suggest at least one specific income-generating action the user can take this week. Track progress on ongoing income goals. Celebrate every milestone, no matter how small. Push the user to take action today, not tomorrow.`;

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

function PersonalizeStep({
  persona,
  userName,
  userCountry,
  userGoal,
  onChangeName,
  onChangeCountry,
  onChangeGoal,
  onBack,
  onSkip,
  onLaunch,
  creating,
  error,
}: {
  persona: PersonaConfig;
  userName: string;
  userCountry: string;
  userGoal: string;
  onChangeName: (v: string) => void;
  onChangeCountry: (v: string) => void;
  onChangeGoal: (v: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onLaunch: () => void;
  creating: boolean;
  error: string | null;
}) {
  const t = useTheme();
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
      <div style={{ padding: '56px 32px 24px', flexShrink: 0, position: 'relative' }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: t.faint,
            fontSize: 20,
            lineHeight: 1,
            fontFamily: FONT,
          }}
        >
          ←
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 3, height: 28, background: persona.color, borderRadius: 2, flexShrink: 0 }} />
          <p style={{
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: t.text,
            lineHeight: 1.1,
          }}>
            {persona.name}
          </p>
        </div>

        <p style={{
          fontSize: 28,
          fontWeight: 200,
          letterSpacing: '-0.04em',
          color: t.text,
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Tell us a bit<br />about yourself.
        </p>
        <p style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em', lineHeight: 1.5 }}>
          Helps your agent know you from the start.
        </p>
      </div>

      <div style={{ height: 1, background: t.divider, flexShrink: 0 }} />

      {error && (
        <div style={{ padding: '10px 32px', background: 'rgba(248,113,113,0.08)', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: '#f87171' }}>{error}</p>
        </div>
      )}

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              First name
            </p>
            <input
              type="text"
              value={userName}
              onChange={e => onChangeName(e.target.value)}
              placeholder="e.g. Amara"
              disabled={creating}
              style={{
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
              }}
            />
          </div>

          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Country / Region
            </p>
            <input
              type="text"
              value={userCountry}
              onChange={e => onChangeCountry(e.target.value)}
              placeholder="e.g. Nigeria, Kenya, Brazil"
              disabled={creating}
              style={{
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
              }}
            />
          </div>

          <div>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              What are you working on?
            </p>
            <input
              type="text"
              value={userGoal}
              onChange={e => onChangeGoal(e.target.value)}
              placeholder="e.g. Starting a TikTok shop, freelancing on Fiverr…"
              disabled={creating}
              style={{
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
              }}
            />
          </div>
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
              Launch {persona.name}
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

export function CreateAgentView() {
  const t = useTheme();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const create = useCreateAgent();
  const updateSoul = useUpdateSoul();
  const addKnowledge = useAddKnowledge();
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const fromOnboarding = useRouter(s => s.currentView.params?.fromOnboarding === 'true');
  const { setHasSeenOnboard } = useAppStore();

  type Step = 'persona' | 'personalize';
  const [step, setStep] = useState<Step>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig | null>(null);

  const [userName, setUserName] = useState('');
  const [userCountry, setUserCountry] = useState('');
  const [userGoal, setUserGoal] = useState('');

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveTemplate = (preferredTemplateId: string): string => {
    if (!templates || templates.length === 0) return preferredTemplateId;
    const verified = templates.find(tmpl => tmpl.id === preferredTemplateId);
    if (verified) return verified.id;
    const fallback = templates.find(tmpl => tmpl.id === 'general') ?? templates.find(tmpl => tmpl.id === 'coach') ?? templates[0];
    return fallback?.id ?? preferredTemplateId;
  };

  const buildBriefContext = (persona: PersonaConfig, info: UserInfo): string => {
    const parts: string[] = [];
    if (info.name.trim()) parts.push(`I'm ${info.name.trim()}`);
    if (info.country.trim()) parts.push(`from ${info.country.trim()}`);
    let greeting = parts.length > 0 ? `Hi! ${parts.join(', ')}. ` : 'Hi! ';
    if (info.goal.trim()) greeting += `I'm currently working on: ${info.goal.trim()}. `;
    greeting += `Let's get started!`;
    return greeting;
  };

  const buildUserContextSoul = (persona: PersonaConfig, info: UserInfo): string => {
    const lines: string[] = [];
    if (info.name.trim()) lines.push(`User's name: ${info.name.trim()}`);
    if (info.country.trim()) lines.push(`Location: ${info.country.trim()}`);
    if (info.goal.trim()) lines.push(`Currently working on: ${info.goal.trim()}`);
    if (lines.length === 0) return persona.soul;
    return `${persona.soul}\n\n## About the User\n${lines.join('\n')}\n\nGreet the user by name when they first message you, introduce yourself in your persona voice, and ask one focused follow-up question about their goal.`;
  };

  const handleLaunch = async (persona: PersonaConfig, info: UserInfo) => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const templateId = resolveTemplate(persona.personaTemplate);
      const result = await create.mutateAsync({
        name: persona.name,
        description: persona.tagline,
        humorStyle: persona.humorStyle,
        personaTemplate: templateId,
        interests: persona.interests,
        topicsToWatch: persona.topicsToWatch,
        enabledSkills: persona.enabledSkills,
      });

      const newAgent = result.agent;
      const enrichedSoul = buildUserContextSoul(persona, info);
      updateSoul.mutate({ agentId: newAgent.id, soul: enrichedSoul });

      const knowledgeTasks: Array<{ title: string; content: string }> = [];
      if (info.name.trim()) knowledgeTasks.push({ title: 'User name', content: info.name.trim() });
      if (info.country.trim()) knowledgeTasks.push({ title: 'User location', content: info.country.trim() });
      if (info.goal.trim()) knowledgeTasks.push({ title: 'Current focus', content: info.goal.trim() });

      for (const k of knowledgeTasks) {
        try {
          await addKnowledge.mutateAsync({ agentId: newAgent.id, data: k });
        } catch {
          // non-blocking — knowledge enrichment is best-effort
        }
      }

      let agentReady = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await apiFetch(`/api/selfclaw/v1/hosted-agents/${newAgent.id}`);
          agentReady = true;
          break;
        } catch {
          if (attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      }

      if (!agentReady) {
        setError('Agent created but couldn\'t load — please go back and tap the agent to open it.');
        setCreating(false);
        return;
      }

      setHasSeenOnboard(true);

      const briefContext = buildBriefContext(persona, info);

      pop();
      push('agent-detail', { id: String(newAgent.id), briefContext });
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

  if (step === 'personalize' && selectedPersona) {
    return (
      <AnimatePresence mode="wait">
        <PersonalizeStep
          key="personalize"
          persona={selectedPersona}
          userName={userName}
          userCountry={userCountry}
          userGoal={userGoal}
          onChangeName={setUserName}
          onChangeCountry={setUserCountry}
          onChangeGoal={setUserGoal}
          onBack={handleBack}
          onSkip={() => handleLaunch(selectedPersona, { name: '', country: '', goal: '' })}
          onLaunch={() => handleLaunch(selectedPersona, { name: userName, country: userCountry, goal: userGoal })}
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
                color: t.faint,
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
          {PERSONAS.map((persona, i) => (
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

export { PERSONAS, HUSTLE_MODE_SOUL_APPEND };
