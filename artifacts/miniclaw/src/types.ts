// API DTOs for the SelfClaw API

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
  status: 'active' | 'inactive' | 'error' | string;
  humorStyle: HumorStyle;
  interests?: string;
  topicsToWatch?: string;
  premiumModel?: boolean;
  model?: string;
  socialHandles?: SocialHandles;
}

export type HumorStyle = 'none' | 'dry' | 'warm' | 'playful' | 'sarcastic';

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
  enabled?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  emoji: string;
  description: string;
  interests?: string;
  topicsToWatch?: string;
  personaTemplate: string;
  humorStyle: HumorStyle;
}

export interface UpdateAgentSettingsPayload {
  name?: string;
  emoji?: string;
  description?: string;
  interests?: string;
  topicsToWatch?: string;
  socialHandles?: SocialHandles;
  enabledSkills?: string[];
  personalContext?: string;
  humorStyle?: HumorStyle;
  premiumModel?: boolean;
}

export interface Knowledge {
  id: string;
  type: 'text' | 'url';
  content: string;
  createdAt?: string;
}

export interface Memory {
  id: string;
  content?: string;
  text?: string;
  pinned?: boolean;
  createdAt?: string;
}

export interface SoulDocument {
  document: string;
}

export interface Conversation {
  id: string;
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
  username?: string;
  botName?: string;
}

export interface TelegramSettings {
  greeting?: string;
  notifyOnMention?: boolean;
  broadcastEnabled?: boolean;
}
