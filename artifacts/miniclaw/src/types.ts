// API DTOs for the SelfClaw / MiniClaw API — sourced from https://selfclaw.ai/miniclaw-api

// /api/auth/self/me response
export interface AuthMe {
  id: string;
  humanId: string;
  walletAddress: string;
  authMethod: string;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'active' | 'paused' | 'error' | string;
  humorStyle?: HumorStyle;
  interests?: string[];
  topicsToWatch?: string[];
  premiumModel?: PremiumModel;
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  publicKey?: string;
  createdAt?: string;
  recentTasks?: AgentTask[];
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
  defaultSkills?: string[];
  defaultInterests?: string[];
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
  description?: string;
  status?: 'active' | 'paused';
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: PremiumModel;
}

// PUT /:id/settings — settings-only update
export interface UpdateAgentSettingsPayload {
  name?: string;
  emoji?: string;
  description?: string;
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: PremiumModel;
}

// Knowledge entry — title is required per API docs
export interface Knowledge {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
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
  title?: string;
  description?: string;
  action?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  createdAt?: string;
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
