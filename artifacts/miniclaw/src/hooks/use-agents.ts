import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type {
  Agent,
  PersonaTemplate,
  SkillDef,
  CreateAgentPayload,
  UpdateAgentSettingsPayload,
  Knowledge,
  Memory,
  SoulDocument,
  Conversation,
  ChatMessage,
  AgentTask,
} from '@/types';

export type { Agent, PersonaTemplate, SkillDef };

// --- AGENT CRUD ---

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<Agent[]>('/api/selfclaw/v1/hosted-agents')
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${id}`),
    enabled: !!id,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['agent-templates'],
    queryFn: () => apiFetch<PersonaTemplate[]>('/api/selfclaw/v1/hosted-agents/templates')
  });
}

export function useSkillDefs() {
  return useQuery({
    queryKey: ['skill-defs'],
    queryFn: () => apiFetch<SkillDef[]>('/api/selfclaw/v1/hosted-agents/skills')
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentPayload) =>
      apiFetch<Agent>('/api/selfclaw/v1/hosted-agents', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] })
  });
}

export function useUpdateAgentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentSettingsPayload }) =>
      apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['agents', variables.id] });
    }
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] })
  });
}

// --- SKILLS ---

export function useAgentSkills(agentId: string | undefined) {
  return useQuery({
    queryKey: ['skills', agentId],
    queryFn: () => apiFetch<SkillDef[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/skills`),
    enabled: !!agentId,
  });
}

export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId, enable }: { agentId: string; skillId: string; enable: boolean }) =>
      apiFetch<void>(
        `/api/selfclaw/v1/hosted-agents/${agentId}/skills/${skillId}/${enable ? 'enable' : 'disable'}`,
        { method: 'POST' }
      ),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['skills', variables.agentId] })
  });
}

// --- KNOWLEDGE ---

export function useKnowledge(agentId: string | undefined) {
  return useQuery({
    queryKey: ['knowledge', agentId],
    queryFn: () => apiFetch<Knowledge[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge`),
    enabled: !!agentId
  });
}

export function useAddKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: { type: 'text' | 'url'; content: string } }) =>
      apiFetch<Knowledge>(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', variables.agentId] })
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', variables.agentId] })
  });
}

// --- MEMORIES ---

export function useMemories(agentId: string | undefined) {
  return useQuery({
    queryKey: ['memories', agentId],
    queryFn: () => apiFetch<Memory[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/memories`),
    enabled: !!agentId
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id, data }: { agentId: string; id: string; data: Partial<Pick<Memory, 'content' | 'pinned'>> }) =>
      apiFetch<Memory>(`/api/selfclaw/v1/hosted-agents/${agentId}/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', variables.agentId] })
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${agentId}/memories/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', variables.agentId] })
  });
}

// --- SOUL ---

export function useSoul(agentId: string | undefined) {
  return useQuery({
    queryKey: ['soul', agentId],
    queryFn: () => apiFetch<SoulDocument>(`/api/selfclaw/v1/hosted-agents/${agentId}/soul`),
    enabled: !!agentId
  });
}

export function useUpdateSoul() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, document }: { agentId: string; document: string }) =>
      apiFetch<SoulDocument>(`/api/selfclaw/v1/hosted-agents/${agentId}/soul`, {
        method: 'PUT',
        body: JSON.stringify({ document })
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['soul', variables.agentId] })
  });
}

// --- CONVERSATIONS & MESSAGES ---

export function useConversations(agentId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', agentId],
    queryFn: () => apiFetch<Conversation[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/conversations`),
    enabled: !!agentId
  });
}

export function useMessages(agentId: string | undefined, conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', agentId, conversationId],
    queryFn: () => apiFetch<ChatMessage[]>(
      `/api/selfclaw/v1/hosted-agents/${agentId}/messages?conversationId=${conversationId}`
    ),
    enabled: !!agentId && !!conversationId
  });
}

// --- TASKS ---

export function useTasks(agentId: string | undefined, status: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['tasks', agentId, status],
    queryFn: () => apiFetch<AgentTask[]>(
      `/api/selfclaw/v1/hosted-agents/${agentId}/tasks${status === 'pending' ? '/pending' : ''}`
    ),
    enabled: !!agentId
  });
}

export function useResolveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, taskId, action }: { agentId: string; taskId: string; action: 'approve' | 'reject' }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${agentId}/tasks/${taskId}/${action}`, { method: 'POST' }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.agentId, 'pending'] });
      qc.invalidateQueries({ queryKey: ['tasks', variables.agentId, 'all'] });
    }
  });
}

// --- TELEGRAM ---

export function useTelegramStatus(agentId: string | undefined) {
  return useQuery({
    queryKey: ['telegram-status', agentId],
    queryFn: () => apiFetch<import('@/types').TelegramStatus>(
      `/api/selfclaw/v1/hosted-agents/${agentId}/telegram/status`
    ),
    enabled: !!agentId
  });
}
