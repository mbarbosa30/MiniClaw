// API DTOs for the SelfClaw / MiniClaw API

export interface AuthStatus {
  loggedIn: boolean;
  user?: {
    address: string;
    id?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'active' | 'paused' | 'error' | string;
  humorStyle: HumorStyle;
  interests?: string[];
  topicsToWatch?: string[];
  premiumModel?: PremiumModel;
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
}

export type HumorStyle = 'none' | 'dry' | 'warm' | 'playful' | 'sarcastic';

// premiumModel values per API: "grok-4" | "gpt-5.4" | "none"
export type PremiumModel = 'none' | 'grok-4' | 'gpt-5.4';

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

// PATCH /:id — partial update
export interface UpdateAgentPayload {
  name?: string;
  emoji?: string;
  description?: string;
  status?: 'active' | 'paused';
  enabledSkills?: string[];
  autoApproveThreshold?: number;
  interests?: string[];
  topicsToWatch?: string[];
  socialHandles?: SocialHandles;
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: PremiumModel;
}

// PUT /:id/settings — settings-only update (same optional fields)
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

export interface Knowledge {
  id: string;
  type: 'text' | 'url';
  content: string;
  title?: string;
  createdAt?: string;
}

export interface Memory {
  id: string;
  fact?: string;
  pinned?: boolean;
  category?: string;
  createdAt?: string;
}

export interface SoulDocument {
  soul: string;
  updatedAt?: string;
  isDefault?: boolean;
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
