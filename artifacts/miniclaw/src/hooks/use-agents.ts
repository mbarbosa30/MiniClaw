import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type {
  Agent,
  AgentSettings,
  PersonaTemplate,
  SkillDef,
  CreateAgentPayload,
  CreateAgentResponse,
  UpdateAgentPayload,
  UpdateAgentSettingsPayload,
  Knowledge,
  UpdateKnowledgePayload,
  Memory,
  SoulDocument,
  Conversation,
  ChatMessage,
  AgentTask,
  TelegramStatus,
  TelegramSettingsPayload,
} from '@/types';

export type { Agent, PersonaTemplate, SkillDef };

// Convenience: coerce string | number IDs to string for URL interpolation
const sid = (id: string | number) => String(id);

// --- AGENT CRUD ---

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      // The live API returns { agents: [] } despite docs showing a plain array.
      // This was verified empirically — keep the unwrap.
      const raw = await apiFetch<{ agents: Agent[] } | Agent[]>('/api/selfclaw/v1/hosted-agents');
      return Array.isArray(raw) ? raw : (raw as { agents: Agent[] }).agents;
    },
  });
}

export function useAgent(id: string | number | undefined) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${sid(id!)}`),
    enabled: id != null && id !== '',
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['agent-templates'],
    queryFn: () => apiFetch<PersonaTemplate[]>('/api/selfclaw/v1/hosted-agents/templates'),
  });
}

export function useSkillDefs() {
  return useQuery({
    queryKey: ['skill-defs'],
    queryFn: () => apiFetch<SkillDef[]>('/api/selfclaw/v1/hosted-agents/skills'),
  });
}

// POST /v1/hosted-agents — response is { success, agent, privateKey }
export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentPayload) =>
      apiFetch<CreateAgentResponse>('/api/selfclaw/v1/hosted-agents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

// PATCH /:id — general agent update (name, status, premiumModel, etc.)
export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateAgentPayload }) =>
      apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${sid(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['agents', variables.id] });
    },
  });
}

// PUT /:id/settings — settings-focused update
export function useUpdateAgentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateAgentSettingsPayload }) =>
      apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${sid(id)}/settings`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['agents', variables.id] });
      qc.invalidateQueries({ queryKey: ['agent-settings', variables.id] });
    },
  });
}

// GET /:id/settings
export function useAgentSettings(id: string | number | undefined) {
  return useQuery({
    queryKey: ['agent-settings', id],
    queryFn: () => apiFetch<AgentSettings>(`/api/selfclaw/v1/hosted-agents/${sid(id!)}/settings`),
    enabled: id != null && id !== '',
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(id)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
}

// --- SKILLS ---

export function useAgentSkills(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['skills', agentId],
    queryFn: () => apiFetch<SkillDef[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/skills`),
    enabled: agentId != null && agentId !== '',
  });
}

export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId, enable }: { agentId: string | number; skillId: string; enable: boolean }) =>
      apiFetch<void>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/skills/${skillId}/${enable ? 'enable' : 'disable'}`,
        { method: 'POST' }
      ),
    onSuccess: (_, variables) => {
      // enabledSkills lives on the agent object, so invalidate both caches
      qc.invalidateQueries({ queryKey: ['skills', variables.agentId] });
      qc.invalidateQueries({ queryKey: ['agents', variables.agentId] });
    },
  });
}

// --- KNOWLEDGE ---

export function useKnowledge(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['knowledge', agentId],
    queryFn: () => apiFetch<Knowledge[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/knowledge`),
    enabled: agentId != null && agentId !== '',
  });
}

// title is required by the API
export function useAddKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string | number; data: { title: string; content: string } }) =>
      apiFetch<Knowledge>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/knowledge`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', variables.agentId] }),
  });
}

// PATCH /:id/knowledge/:knowledgeId — re-embeds content
export function useUpdateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, knowledgeId, data }: { agentId: string | number; knowledgeId: string; data: UpdateKnowledgePayload }) =>
      apiFetch<Knowledge>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/knowledge/${knowledgeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', variables.agentId] }),
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string | number; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/knowledge/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', variables.agentId] }),
  });
}

// --- MEMORIES ---

export function useMemories(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['memories', agentId],
    queryFn: () => apiFetch<Memory[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/memories`),
    enabled: agentId != null && agentId !== '',
  });
}

// Per API docs: body is { content?: string; category?: string }
export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id, data }: { agentId: string | number; id: string; data: { content?: string; category?: string } }) =>
      apiFetch<Memory>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', variables.agentId] }),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string | number; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/memories/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', variables.agentId] }),
  });
}

// --- SOUL ---

export function useSoul(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['soul', agentId],
    queryFn: () => apiFetch<SoulDocument>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/soul`),
    enabled: agentId != null && agentId !== '',
  });
}

export function useUpdateSoul() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, soul }: { agentId: string | number; soul: string }) =>
      apiFetch<SoulDocument>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/soul`, {
        method: 'PUT',
        body: JSON.stringify({ soul }),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['soul', variables.agentId] }),
  });
}

// --- CONVERSATIONS & MESSAGES ---

export function useConversations(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['conversations', agentId],
    queryFn: () => apiFetch<Conversation[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/conversations`),
    enabled: agentId != null && agentId !== '',
  });
}

// Per API docs: GET /:id/messages?conversationId=X
export function useMessages(agentId: string | number | undefined, conversationId: string | number | undefined) {
  return useQuery({
    queryKey: ['messages', agentId, conversationId],
    queryFn: () =>
      apiFetch<ChatMessage[]>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/messages?conversationId=${conversationId}`
      ),
    enabled: agentId != null && agentId !== '' && conversationId != null,
  });
}

// --- TASKS ---

export function useTasks(agentId: string | number | undefined, status: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['tasks', agentId, status],
    queryFn: () =>
      apiFetch<AgentTask[]>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/tasks${status === 'pending' ? '/pending' : ''}`
      ),
    enabled: agentId != null && agentId !== '',
  });
}

// Per API docs: POST /:id/tasks/:taskId/approve or /reject
export function useResolveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, taskId, action }: { agentId: string | number; taskId: string; action: 'approve' | 'reject' }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/tasks/${taskId}/${action}`, { method: 'POST' }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.agentId, 'pending'] });
      qc.invalidateQueries({ queryKey: ['tasks', variables.agentId, 'all'] });
    },
  });
}

// --- TELEGRAM ---

export function useTelegramStatus(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['telegram-status', agentId],
    queryFn: () =>
      apiFetch<TelegramStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/telegram/status`),
    enabled: agentId != null && agentId !== '',
  });
}

export function useUpdateTelegramSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string | number; data: TelegramSettingsPayload }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/telegram/settings`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['telegram-status', variables.agentId] }),
  });
}
