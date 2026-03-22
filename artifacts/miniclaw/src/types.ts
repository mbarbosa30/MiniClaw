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
  combinedTokensToday: number;
  combinedCostUsd: number;
}

// Runtime status from the API — more granular than status (active/paused/error)
export type AgentRuntimeStatus = 'thinking' | 'working' | 'reflecting' | 'observing' | 'composing' | 'resting' | 'sleeping' | 'idle' | 'running' | 'waiting' | string;

// Model info returned in agent detail, awareness, and settings GET responses
export interface AvailableModel {
  id: string;
  label: string;
  tier: 'free' | 'premium';
}

export interface ModelInfo {
  chat: string;
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
  tokensUsedToday?: number | null;
  tokensLimit?: number | null;
  pocScore?: number | null;
  economicsEarnedToday?: number | null;
  memoriesSizeEstimate?: number | null;
  memoriesLimit?: number | null;
  memoriesCount?: number | null;
  activeSkillsCount?: number | null;

  // Model info — returned on agent detail, awareness, and settings GET
  modelInfo?: ModelInfo;

  // Suggested quick-reply chips — returned on list and detail endpoints
  suggestedChips?: string[];

  // Detail-only fields — present on both list (enriched) and detail endpoints
  tokenCostUsd?: number | null;
  celoBalance?: string | null;
  holdingsUsd?: number | null;
  uptimePercent?: number | null;
  progressPercent?: number | null;

  // Spawning pipeline state
  spawningStatus?: 'researching' | 'training' | 'ready' | 'failed' | null;
  spawningProgress?: SpawningProgressStep[];

  // Enriched list fields — returned inline by GET /v1/hosted-agents gateway endpoint
  phase?: string | null;
  phaseProgress?: number | null;
  pendingTaskCount?: number | null;
  recentActivity?: string | null;
  recentActivities?: { type: string; summary: string; timestamp: string }[] | null;
}

// GET /:id/spawning-status — live research pipeline progress
export interface SpawningProgressStep {
  step: string;
  status: 'done' | 'active' | 'waiting';
}

export interface SpawningStatusResponse {
  status?: 'researching' | 'training' | 'ready' | 'failed' | null;
  spawningStatus?: 'researching' | 'training' | 'ready' | 'failed' | null;
  progress?: SpawningProgressStep[];
}

// Per API docs: straight | dry-wit | playful | sarcastic | absurdist
export type HumorStyle = 'straight' | 'dry-wit' | 'playful' | 'sarcastic' | 'absurdist';

// Per API docs: "grok-4.20" | "gpt-5.4" | "gpt-5-mini" | null/none
export type PremiumModel = 'none' | 'grok-4.20' | 'gpt-5.4' | 'gpt-5-mini';

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
  // Spawning pipeline fields — used by the Grok research pipeline at creation time
  ownerName?: string;
  xHandle?: string;
  linkedinUrl?: string;
  location?: string;
  domain?: string;
  urls?: string[];
  goals?: string[];
  challenges?: string[];
  targetAudience?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  budget?: 'bootstrapping' | 'small' | 'moderate' | 'established';
  languages?: string[];
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
  digestFrequency?: 'daily' | 'weekly' | 'disabled';
  digestTimeOfDay?: 'morning' | 'evening';
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
  digestFrequency?: 'daily' | 'weekly' | 'disabled';
  digestTimeOfDay?: 'morning' | 'evening';
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
  scheduledFor?: string;
}

export interface TaskSummarySection {
  count: number;
  items: AgentTask[];
}

export interface TaskSummary {
  pending: TaskSummarySection;
  running: TaskSummarySection;
  recentlyCompleted: TaskSummarySection;
  scheduled?: TaskSummarySection;
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
// Normalized from API response (which uses keys like "24h", "7d", "30d" and callTypeBreakdown object)
export interface UsageCallType {
  type: string;
  calls: number;
}

export interface UsageModelBreakdown {
  model: string;
  provider?: string;
  calls: number;
  tokens: number;
  costUsd?: number;
}

export interface AgentUsageStats {
  tokens: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  cost?: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  totalCalls30d: number;
  avgLatencyMs: number;
  callsByType: UsageCallType[];
  callsByModel?: UsageModelBreakdown[];
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
  phase: 'nascent' | 'curious' | 'exploring' | 'forming' | 'developing' | 'opinionated' | 'confident' | 'sovereign' | string;
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

// GET /:id/wallet
export interface WalletStatus {
  created: boolean;
  address?: string;
  balance?: number;
  balanceCelo?: number;
}

// GET /:id/identity
export interface IdentityStatus {
  registered: boolean;
  handle?: string;
  displayName?: string;
}

// GET /:id/token
export interface TokenStatus {
  deployed: boolean;
  name?: string;
  symbol?: string;
  contractAddress?: string;
  totalSupply?: number;
}

// GET /:id/economy/gifts — individual gift entry
export interface GiftEntry {
  id?: string;
  fromAddress?: string;
  amount: number;
  currency?: string;
  message?: string;
  createdAt?: string;
}

// GET /:id/economy
export interface EconomyData {
  giftsReceivedCount?: number;
  totalGiftsValueCelo?: number;
  gifts?: GiftEntry[];
}

// GET /v1/feed — individual comment on a feed post
export interface FeedComment {
  id: string;
  postId?: string;
  authorId?: string;
  authorName?: string;
  content: string;
  createdAt?: string;
}

// GET /v1/feed?source=miniclaw — a single feed post
export interface FeedPost {
  id: string;
  agentId: string | number;
  agentName?: string;
  agentEmoji?: string;
  content: string;
  source?: string;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  comments?: FeedComment[];
}

// GET /v1/gateway/endpoints — manifest entry
export interface GatewayEndpoint {
  method: string;
  path: string;
  auth?: string;
  description?: string;
}

// POST /:id/commerce/request response
export interface CommerceRequestResult {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  createdAt?: string;
  paymentLink?: string;
}

// --- Marketplace ---

export interface MarketplaceService {
  id: string;
  humanId?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  agentName?: string;
  agentPublicKey?: string;
  providerHumanId?: string;
  price?: string;
  priceToken?: string;
  isFree?: boolean;
  estimatedDelivery?: string;
  inputSchema?: Record<string, string>;
  outputSchema?: Record<string, string>;
  averageRating?: number | null;
  ratingCount?: number;
  ratingSum?: number;
  purchaseCount?: number;
  active?: boolean;
  providerType?: string;
  serviceType?: string;
  deliveryMethod?: string;
  autoAccept?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type MarketplaceOrderStatus =
  | 'pending'
  | 'accepted'
  | 'in-progress'
  | 'delivered'
  | 'confirmed'
  | 'rated'
  | 'rejected'
  | string;

export interface MarketplaceOrder {
  id: string;
  serviceId: string;
  serviceTitle?: string;
  providerName?: string;
  providerEmoji?: string;
  providerAgentId?: string | number;
  buyerName?: string;
  buyerEmoji?: string;
  buyerAgentId?: string | number;
  status: MarketplaceOrderStatus;
  input?: string;
  output?: string;
  priceCelo?: number;
  priceUsd?: number;
  rating?: number;
  ratingComment?: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Deep Reflection ---

export interface DeepReflection {
  jobId: string;
  agentId: string | number;
  status: 'pending' | 'running' | 'done' | 'failed' | string;
  clarityScore?: number | null;
  summary?: string | null;
  createdAt?: string;
}
