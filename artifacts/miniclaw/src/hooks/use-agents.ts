import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

// Types inferred from instructions
export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  humorStyle: string;
  interests?: string;
  topicsToWatch?: string;
  premiumModel?: boolean;
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

// --- HOOKS ---

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<Agent[]>('/api/selfclaw/v1/hosted-agents')
  });
}

export function useAgent(id: string) {
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

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch<Agent>('/api/selfclaw/v1/hosted-agents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] })
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiFetch<Agent>(`/api/selfclaw/v1/hosted-agents/${id}/settings`, {
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
    mutationFn: (id: string) => apiFetch(`/api/selfclaw/v1/hosted-agents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] })
  });
}

// --- SUB-RESOURCES ---

export function useSkills(agentId?: string) {
  return useQuery({
    queryKey: ['skills', agentId],
    queryFn: () => apiFetch<SkillDef[]>(agentId ? `/api/selfclaw/v1/hosted-agents/${agentId}/skills` : '/api/selfclaw/v1/hosted-agents/skills')
  });
}

export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId, enable }: { agentId: string, skillId: string, enable: boolean }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/skills/${skillId}/${enable ? 'enable' : 'disable'}`, { method: 'POST' }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['skills', v.agentId] })
  });
}

export function useKnowledge(agentId: string) {
  return useQuery({
    queryKey: ['knowledge', agentId],
    queryFn: () => apiFetch<any[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge`),
    enabled: !!agentId
  });
}

export function useAddKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string, data: any }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['knowledge', v.agentId] })
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string, id: string }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/knowledge/${id}`, { method: 'DELETE' }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['knowledge', v.agentId] })
  });
}

export function useMemories(agentId: string) {
  return useQuery({
    queryKey: ['memories', agentId],
    queryFn: () => apiFetch<any[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/memories`),
    enabled: !!agentId
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id, data }: { agentId: string, id: string, data: any }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/memories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['memories', v.agentId] })
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string, id: string }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/memories/${id}`, { method: 'DELETE' }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['memories', v.agentId] })
  });
}

export function useSoul(agentId: string) {
  return useQuery({
    queryKey: ['soul', agentId],
    queryFn: () => apiFetch<{document: string}>(`/api/selfclaw/v1/hosted-agents/${agentId}/soul`),
    enabled: !!agentId
  });
}

export function useUpdateSoul() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, document }: { agentId: string, document: string }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/soul`, { method: 'PUT', body: JSON.stringify({ document }) }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['soul', v.agentId] })
  });
}

export function useTasks(agentId: string, status: 'pending' | 'all' = 'pending') {
  return useQuery({
    queryKey: ['tasks', agentId, status],
    queryFn: () => apiFetch<any[]>(`/api/selfclaw/v1/hosted-agents/${agentId}/tasks${status === 'pending' ? '/pending' : ''}`),
    enabled: !!agentId
  });
}

export function useResolveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, taskId, action }: { agentId: string, taskId: string, action: 'approve' | 'reject' }) => 
      apiFetch(`/api/selfclaw/v1/hosted-agents/${agentId}/tasks/${taskId}/${action}`, { method: 'POST' }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['tasks', v.agentId, 'pending'] });
      qc.invalidateQueries({ queryKey: ['tasks', v.agentId, 'all'] });
    }
  });
}
