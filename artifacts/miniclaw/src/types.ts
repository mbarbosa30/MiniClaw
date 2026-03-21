// API DTOs for the SelfClaw / MiniClaw API — sourced from https://selfclaw.ai/miniclaw-api

// /api/auth/self/me response
export interface AuthMe {
  id: string;
  humanId: string;
  walletAddress: string;
  authMethod: string;
}

// GET /:id — stats bundle returned alongside the agent object
export interface AgentStats {
  totalActionsCount: number;
  pendingTasksCount: number;
  memoriesCount: number;
  currentActivity: string | null;
}

// Top-level summary object returned by GET /v1/hosted-agents
export interface AgentListSummary {
  activeCount: number;
  totalCount: number;
  totalTokens: number;
  totalCostUsd: number;
}

// Runtime status from the API — more granular than status (active/paused/error)
export type AgentRuntimeStatus = 'thinking' | 'running' | 'waiting' | 'idle' | string;

// Model info returned in agent detail, awareness, and settings GET responses
export interface AvailableModel {
  id: string;
  label: string;
  tier: 'free' | 'premium';
}

export interface ModelInfo {
  modelName: string;
  tier: 'free' | 'premium' | 'fallback';
  provider: string;
  availableModels: AvailableModel[];
}

export interface Agent {
  // API returns numeric IDs; typed as string | number for robustness
  id: string | number;
  name: string;
  emoji?: string;
  icon?: string;
  description: string;
  status: 'active' | 'paused' | 'error' | string;
  humorStyle?: HumorStyle;
  interests?: string[];
  topicsToWatch?: string[];
  premiumModel?: PremiumModel | null;
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  publicKey?: string;
  createdAt?: string;
  recentTasks?: AgentTask[];
  stats?: AgentStats;

  // Runtime metrics — returned by both list and detail endpoints
  runtimeStatus?: AgentRuntimeStatus | null;
  llmTokensUsedToday?: number | null;
  llmTokensLimit?: number | null;
  pocScore?: number | null;
  economicsEarnedToday?: number | null;
  memorySizeEstimate?: number | null;
  memorySizeLimit?: number | null;
  enabledSkillNames?: string[] | null;

  // Model info — returned on agent detail, awareness, and settings GET
  modelInfo?: ModelInfo;

  // Suggested quick-reply chips — returned on list and detail endpoints
  suggestedChips?: string[];

  // Detail-only fields — only populated on GET /v1/hosted-agents/:id
  tokenCostUsd?: number | null;
  celoBalance?: number | null;
  holdingsUsd?: number | null;
  uptimePercent?: number | null;
  progressPercent?: number | null;
}

// Per API docs: straight | dry-wit | playful | sarcastic | absurdist
export type HumorStyle = 'straight' | 'dry-wit' | 'playful' | 'sarcastic' | 'absurdist';

// Per API docs: "grok-4.20" | "gpt-5.4" | null/none
export type PremiumModel = 'none' | 'grok-4.20' | 'gpt-5.4';

export interface SocialHandles {
  twitter?: string;
  telegram?: string;
  farcaster?: string;
}

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tagline?: string;
  defaultSkills?: string[];
  defaultInterests?: string[];
  defaultTopicsToWatch?: string[];
  voiceDirective?: string;
  expertiseFocus?: string;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  enabled?: boolean;
  requiresWallet?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  emoji?: string;
  icon?: string;
  description?: string;
  interests?: string[];
  topicsToWatch?: string[];
  personalContext?: string;
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personaTemplate?: string;
  humorStyle?: HumorStyle;
}

// POST /v1/hosted-agents response — agent + one-time privateKey
export interface CreateAgentResponse {
  success: boolean;
  agent: Agent;
  privateKey: string;
}

// PATCH /:id — partial update
export interface UpdateAgentPayload {
  name?: string;
  emoji?: string;
  icon?: string;
  description?: string;
  status?: 'active' | 'paused';
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: string | null;
  preferredLanguage?: string | null;
  webhookUrl?: string | null;
  personaTemplate?: string;
}

// PUT /:id/settings — settings-only update
export interface UpdateAgentSettingsPayload {
  name?: string;
  emoji?: string;
  icon?: string;
  description?: string;
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: string | null;
}

// GET /:id/settings response — full agent settings object
export interface AgentSettings {
  name?: string;
  emoji?: string;
  icon?: string;
  description?: string;
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  personaTemplate?: string;
  telegramBotUsername?: string;
  telegramNotificationLevel?: TelegramNotificationLevel;
  humorStyle?: HumorStyle;
  premiumModel?: PremiumModel | null;
  modelInfo?: ModelInfo;
}

// Knowledge entry — title is required per API docs
export interface Knowledge {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
}

// PATCH /:id/knowledge/:knowledgeId — re-embeds content on save
export interface UpdateKnowledgePayload {
  title?: string;
  content?: string;
}

// Memory — content + category per API docs (not fact/pinned)
export interface Memory {
  id: string;
  content: string;
  category?: 'identity' | 'preference' | 'context' | 'fact' | 'emotion' | 'relationship' | string;
  createdAt?: string;
}

export interface SoulDocument {
  soul: string;
  updatedAt?: string;
}

export interface Conversation {
  id: number | string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

export interface AgentTask {
  id: string;
  hostedAgentId?: string;
  skillId?: string;
  title?: string;
  description?: string;
  action?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  taskType?: string;
  riskLevel?: 'low' | 'medium' | 'high' | string;
  category?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}

export interface ActivityItem {
  id?: string | number;
  type: string;
  skill?: string;
  description?: string;
  summary?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
  agentId?: string | number;
}

export interface DailyBriefHighlight {
  type: string;
  source: string;
  summary: string;
  id?: string;
  createdAt?: string;
}

export interface DailyBriefItem {
  agentId: string | number;
  agentName: string;
  agentEmoji?: string;
  agentIcon?: string;
  pendingTaskCount?: number;
  highlight?: DailyBriefHighlight;
}

// GET /daily-brief — cross-agent daily brief (response wraps DailyBriefItem[])
export interface DailyBriefResponse {
  briefs: DailyBriefItem[];
}

// GET /:id/usage-stats — per-agent LLM consumption stats (30d window)
export interface UsageCallType {
  type: string;
  calls: number;
  tokens: number;
  avgLatencyMs: number;
}

export interface AgentUsageStats {
  agentId: string | number;
  period: {
    from: string;
    to: string;
  };
  tokens: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  totalCalls30d: number;
  avgLatencyMs: number;
  callsByType: UsageCallType[];
}

export interface GrowthSummary {
  month: string;
  totalApproved: number;
  breakdown: Record<string, number>;
  activeDays: number;
  streak: number;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  percent: number;
}

// Economy capabilities returned by awareness endpoint
export interface PhaseDetail {
  name: string;
  description: string;
  behavior: string;
  economyAwareness: boolean;
}

export interface EconomyCapabilities {
  economyAwareness: boolean;
  toolsAvailable: string[];
  currentPhase: {
    name: string;
    description: string;
    behavior: string;
  };
  phases?: Record<string, PhaseDetail>;
}

// GET /:id/awareness — self-awareness composite score + onchain status
export interface AgentAwareness {
  messageCount: number;
  memoriesLearned: number;
  conversationCount: number;
  phase: 'curious' | 'developing' | 'confident' | string;
  label: string;
  progress: number;
  phaseDetails?: {
    description: string;
    behavior: string;
    economyAwareness: boolean;
  };
  toolsAvailable?: string[];
  economyCapabilities?: EconomyCapabilities;
  modelInfo?: ModelInfo;
  onChain: {
    wallet: boolean;
    token: boolean;
    identity: boolean;
    allComplete: boolean;
  };
  quota?: {
    tokensUsed: number;
    tokensRemaining: number;
    tokensLimit: number;
    resetAt: string;
  };
}

// POST /:id/conversations/compact
export interface CompactConversationResponse {
  success: boolean;
  conversationId: number;
  messagesCompacted: number;
  totalMessages: number;
  estimatedTokensSaved: number;
  summariesTotal: number;
}

export interface TelegramStatus {
  connected: boolean;
  botUsername?: string;
  notificationLevel?: TelegramNotificationLevel;
}

// Per API docs: "all" | "important" | "none"
export type TelegramNotificationLevel = 'all' | 'important' | 'none';

export interface TelegramSettingsPayload {
  notificationLevel: TelegramNotificationLevel;
}
