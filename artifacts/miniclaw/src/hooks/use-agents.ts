import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  Agent,
  AgentStats,
  AgentListSummary,
  AgentAwareness,
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
  TaskSummary,
  SpawningStatusResponse,
  ActivityItem,
  GrowthSummary,
  TelegramStatus,
  TelegramSettingsPayload,
  CompactConversationResponse,
  AgentUsageStats,
  DailyBriefResponse,
  DailyBriefItem,
  WalletStatus,
  IdentityStatus,
  TokenStatus,
  EconomyData,
  CommerceRequestResult,
  GatewayEndpoint,
} from '@/types';

export type { Agent, AgentListSummary, PersonaTemplate, SkillDef };

// Normalize ID to string for URL interpolation
const sid = (id: string | number) => String(id);

// Normalize ID to string for React Query cache keys — avoids ['agents', '1'] vs ['agents', 1] misses
const qid = (id: string | number | undefined) => (id != null ? String(id) : id);

// --- AGENT CRUD ---

export interface AgentListResult {
  agents: Agent[];
  summary?: AgentListSummary;
}

type RawAgent = Agent & {
  currentActivity?: string | null;
  pendingTaskCount?: number | null;
  recentActivity?: string | null;
  phase?: string | null;
  phaseProgress?: number | null;
};

function normalizeListAgent(agent: RawAgent): Agent {
  // Determine the best activity string — prefer currentActivity, fall back to recentActivity
  const activityFromTop = agent.currentActivity ?? agent.recentActivity ?? null;

  // Merge activity into stats so HomeView's agent.stats?.currentActivity reference works either way.
  if (activityFromTop != null) {
    if (agent.stats) {
      if (!agent.stats.currentActivity) {
        agent.stats = { ...agent.stats, currentActivity: activityFromTop };
      }
    } else {
      agent.stats = { totalActionsCount: 0, pendingTasksCount: 0, memoriesCount: 0, currentActivity: activityFromTop };
    }
  }

  // Merge inline pendingTaskCount → stats.pendingTasksCount (inline wins; always write through)
  const inlinePending = agent.pendingTaskCount ?? null;
  if (inlinePending != null) {
    if (agent.stats) {
      agent.stats = { ...agent.stats, pendingTasksCount: inlinePending };
    } else {
      agent.stats = { totalActionsCount: 0, pendingTasksCount: inlinePending, memoriesCount: 0, currentActivity: null };
    }
  }

  return agent as Agent;
}

export function useAgents() {
  return useQuery<AgentListResult>({
    queryKey: ['agents'],
    queryFn: async () => {
      // The live API returns { agents: [], summary: {} } or a plain Agent[].
      // Tolerate both shapes; extract summary when present.
      const raw = await apiFetch<{ agents: RawAgent[]; summary?: AgentListSummary } | RawAgent[]>('/api/selfclaw/v1/hosted-agents');
      const computeFallbackSummary = (agents: Agent[]): AgentListSummary => ({
        activeCount: agents.filter(a => a.status === 'active').length,
        totalCount: agents.length,
        totalTokens: agents.reduce((sum, a) => sum + (a.llmTokensUsedToday ?? 0), 0),
        totalCostUsd: agents.reduce((sum, a) => sum + (a.tokenCostUsd ?? 0), 0),
      });

      if (Array.isArray(raw)) {
        const agents = raw.map(normalizeListAgent);
        return { agents, summary: computeFallbackSummary(agents) };
      }
      const envelope = raw as { agents: RawAgent[]; summary?: AgentListSummary };
      const agents = (envelope.agents ?? []).map(normalizeListAgent);
      const summary = envelope.summary ?? computeFallbackSummary(agents);
      return { agents, summary };
    },
    refetchInterval: 12_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

type DetailEnvelope = {
  agent: Agent;
  stats?: AgentStats;
  recentTasks?: Agent['recentTasks'];
  tokenCostUsd?: number | null;
  celoBalance?: number | null;
  holdingsUsd?: number | null;
  uptimePercent?: number | null;
  progressPercent?: number | null;
};

export function useAgent(id: string | number | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['agents', qid(id)],
    queryFn: async () => {
      const raw = await apiFetch<Agent | DetailEnvelope>(
        `/api/selfclaw/v1/hosted-agents/${sid(id!)}`
      );
      // Normalize: API may return { agent, stats, recentTasks, ...detail } or a plain Agent object
      if ('agent' in raw && raw.agent && typeof raw.agent === 'object') {
        const agent = raw.agent as Agent;
        const envelope = raw as DetailEnvelope;
        if (envelope.stats) agent.stats = envelope.stats;
        if (envelope.recentTasks) agent.recentTasks = envelope.recentTasks;
        // Detail-only fields — copy onto agent when present
        if (envelope.tokenCostUsd !== undefined) agent.tokenCostUsd = envelope.tokenCostUsd;
        if (envelope.celoBalance !== undefined) agent.celoBalance = envelope.celoBalance;
        if (envelope.holdingsUsd !== undefined) agent.holdingsUsd = envelope.holdingsUsd;
        if (envelope.uptimePercent !== undefined) agent.uptimePercent = envelope.uptimePercent;
        if (envelope.progressPercent !== undefined) agent.progressPercent = envelope.progressPercent;
        return agent;
      }
      return raw as Agent;
    },
    enabled: id != null && id !== '',
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: 800,
    refetchInterval: options?.refetchInterval,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['agent-templates'],
    queryFn: async () => {
      const raw = await apiFetch<{ templates: PersonaTemplate[] } | PersonaTemplate[]>('/api/selfclaw/v1/hosted-agents/templates');
      return Array.isArray(raw) ? raw : (raw as { templates: PersonaTemplate[] }).templates ?? [];
    },
  });
}

export function useSkillDefs() {
  return useQuery({
    queryKey: ['skill-defs'],
    queryFn: async () => {
      const raw = await apiFetch<{ skills: SkillDef[] } | SkillDef[]>('/api/selfclaw/v1/hosted-agents/skills');
      return Array.isArray(raw) ? raw : (raw as { skills: SkillDef[] }).skills ?? [];
    },
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
      qc.invalidateQueries({ queryKey: ['agents', qid(variables.id)] });
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
      qc.invalidateQueries({ queryKey: ['agents', qid(variables.id)] });
      qc.invalidateQueries({ queryKey: ['agent-settings', qid(variables.id)] });
    },
  });
}

// GET /:id/settings
export function useAgentSettings(id: string | number | undefined) {
  return useQuery({
    queryKey: ['agent-settings', qid(id)],
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
    queryKey: ['skills', qid(agentId)],
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
      qc.invalidateQueries({ queryKey: ['skills', qid(variables.agentId)] });
      qc.invalidateQueries({ queryKey: ['agents', qid(variables.agentId)] });
    },
  });
}

// --- KNOWLEDGE ---

export function useKnowledge(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['knowledge', qid(agentId)],
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
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', qid(variables.agentId)] }),
  });
}

// PATCH /:id/knowledge/:knowledgeId — re-embeds content on save
export function useUpdateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      knowledgeId,
      data,
    }: {
      agentId: string | number;
      knowledgeId: string;
      data: UpdateKnowledgePayload;
    }) =>
      apiFetch<Knowledge>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/knowledge/${knowledgeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', qid(variables.agentId)] }),
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string | number; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/knowledge/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['knowledge', qid(variables.agentId)] }),
  });
}

// --- MEMORIES ---

export function useMemories(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['memories', qid(agentId)],
    queryFn: () => apiFetch<Memory[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/memories`),
    enabled: agentId != null && agentId !== '',
  });
}

// Per API docs: body is { content?: string; category?: string }
export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      id,
      data,
    }: {
      agentId: string | number;
      id: string;
      data: { content?: string; category?: string };
    }) =>
      apiFetch<Memory>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/memories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', qid(variables.agentId)] }),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, id }: { agentId: string | number; id: string }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/memories/${id}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['memories', qid(variables.agentId)] }),
  });
}

// --- SOUL ---

export function useSoul(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['soul', qid(agentId)],
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
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['soul', qid(variables.agentId)] }),
  });
}

// --- CONVERSATIONS & MESSAGES ---

export function useConversations(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['conversations', qid(agentId)],
    queryFn: () => apiFetch<Conversation[]>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/conversations`),
    enabled: agentId != null && agentId !== '',
  });
}

// Per API docs: GET /:id/messages?conversationId=X
export function useMessages(agentId: string | number | undefined, conversationId: string | number | undefined) {
  return useQuery({
    queryKey: ['messages', qid(agentId), conversationId],
    queryFn: () =>
      apiFetch<ChatMessage[]>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/messages?conversationId=${conversationId}`
      ),
    enabled: agentId != null && agentId !== '' && conversationId != null,
  });
}

// --- TASKS ---

export function useTasks(agentId: string | number | undefined, status: 'pending' | 'all' = 'pending', options?: { refetchInterval?: number }) {
  return useQuery<AgentTask[]>({
    queryKey: ['tasks', qid(agentId), status],
    queryFn: async () => {
      const raw = await apiFetch<AgentTask[] | { tasks: AgentTask[] }>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/tasks${status === 'pending' ? '/pending' : ''}`
      );
      return Array.isArray(raw) ? raw : (raw?.tasks ?? []);
    },
    enabled: agentId != null && agentId !== '',
    refetchInterval: options?.refetchInterval,
  });
}

// Per API docs: POST /:id/tasks/:taskId/approve or /reject
export function useResolveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      taskId,
      action,
    }: {
      agentId: string | number;
      taskId: string;
      action: 'approve' | 'reject';
    }) =>
      apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/tasks/${taskId}/${action}`, {
        method: 'POST',
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', qid(variables.agentId), 'pending'] });
      qc.invalidateQueries({ queryKey: ['tasks', qid(variables.agentId), 'all'] });
    },
  });
}

// --- TELEGRAM ---

export function useTelegramStatus(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['telegram-status', qid(agentId)],
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
    onSuccess: (_, variables) =>
      qc.invalidateQueries({ queryKey: ['telegram-status', qid(variables.agentId)] }),
  });
}

// --- ACTIVITY ---

export function useActivity(agentId: string | number | undefined) {
  return useQuery({
    queryKey: ['activity', qid(agentId)],
    queryFn: () =>
      apiFetch<ActivityItem[] | { activity: ActivityItem[] } | { items: ActivityItem[] }>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/activity`
      ).then(raw => {
        if (Array.isArray(raw)) return raw;
        // API returns { activity: [...] }; tolerate legacy { items: [...] } shape too
        const envelope = raw as Record<string, ActivityItem[]>;
        return envelope.activity ?? envelope.items ?? [];
      }),
    enabled: agentId != null && agentId !== '',
  });
}

// --- GROWTH SUMMARY ---

export function useGrowthSummary(agentId: string | number | undefined) {
  return useQuery<GrowthSummary>({
    queryKey: ['growth-summary', qid(agentId)],
    queryFn: () =>
      apiFetch<GrowthSummary>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/growth-summary`
      ),
    enabled: agentId != null && agentId !== '',
    staleTime: 60_000,
  });
}

// --- AWARENESS ---

export function useAwareness(agentId: string | number | undefined) {
  return useQuery<AgentAwareness>({
    queryKey: ['awareness', qid(agentId)],
    queryFn: () =>
      apiFetch<AgentAwareness>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/awareness`
      ),
    enabled: agentId != null && agentId !== '',
    staleTime: 60_000,
  });
}

// --- USAGE STATS ---

// GET /:id/usage-stats — per-agent LLM consumption (owner-only)
export function useUsageStats(agentId: string | number | undefined) {
  return useQuery<AgentUsageStats>({
    queryKey: ['usage-stats', qid(agentId)],
    queryFn: () =>
      apiFetch<AgentUsageStats>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/usage-stats`
      ),
    enabled: agentId != null && agentId !== '',
    staleTime: 120_000,
  });
}

// --- DAILY BRIEF ---

// GET /daily-brief — cross-agent morning brief
export function useDailyBrief() {
  return useQuery<DailyBriefItem[]>({
    queryKey: ['daily-brief'],
    queryFn: async () => {
      const raw = await apiFetch<DailyBriefResponse | DailyBriefItem[]>(
        '/api/selfclaw/v1/hosted-agents/daily-brief'
      );
      if (Array.isArray(raw)) return raw;
      return (raw as DailyBriefResponse).briefs ?? [];
    },
    staleTime: 300_000,
  });
}

// GET /:id/spawning-status — live research pipeline progress
export function useSpawningStatus(
  agentId: string | number | undefined,
  enabled: boolean = true
) {
  return useQuery<SpawningStatusResponse>({
    queryKey: ['spawning-status', qid(agentId)],
    queryFn: () => apiFetch<SpawningStatusResponse>(
      `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/spawning-status`
    ),
    enabled: enabled && agentId != null && agentId !== '',
    refetchInterval: (query) => {
      const s = (query.state.data as SpawningStatusResponse | undefined)?.status;
      if (s === 'ready' || s === 'failed') return false;
      return 2500;
    },
    staleTime: 0,
  });
}

// GET /:id/tasks/summary — compact activity digest (pending, running, recentlyCompleted)
export function useTaskSummary(agentId: string | number | undefined) {
  return useQuery<TaskSummary>({
    queryKey: ['task-summary', qid(agentId)],
    queryFn: () => apiFetch<TaskSummary>(
      `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/tasks/summary`
    ),
    enabled: agentId != null && agentId !== '',
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// Parallel task summaries for all agents (uses useQueries to avoid hook-in-loop)
export function useAllTaskSummaries(agentIds: Array<string | number>) {
  return useQueries({
    queries: agentIds.map(id => ({
      queryKey: ['task-summary', qid(id)],
      queryFn: () => apiFetch<TaskSummary>(
        `/api/selfclaw/v1/hosted-agents/${sid(id)}/tasks/summary`
      ),
      refetchInterval: 30_000,
      staleTime: 15_000,
    })),
  });
}

// --- ECONOMY & ONCHAIN ---

export function useWallet(agentId: string | number | undefined) {
  return useQuery<WalletStatus>({
    queryKey: ['wallet', qid(agentId)],
    queryFn: () => apiFetch<WalletStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/wallet`),
    enabled: agentId != null && agentId !== '',
    staleTime: 30_000,
  });
}

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string | number) =>
      apiFetch<WalletStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/wallet/create`, { method: 'POST' }),
    onSuccess: (_, agentId) => qc.invalidateQueries({ queryKey: ['wallet', qid(agentId)] }),
  });
}

export function useRequestGas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string | number) =>
      apiFetch<{ success: boolean; message?: string }>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/wallet/request-gas`, { method: 'POST' }),
    onSuccess: (_, agentId) => qc.invalidateQueries({ queryKey: ['wallet', qid(agentId)] }),
  });
}

export function useIdentity(agentId: string | number | undefined) {
  return useQuery<IdentityStatus>({
    queryKey: ['identity', qid(agentId)],
    queryFn: () => apiFetch<IdentityStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/identity`),
    enabled: agentId != null && agentId !== '',
    staleTime: 30_000,
  });
}

export function useRegisterIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, handle }: { agentId: string | number; handle: string }) =>
      apiFetch<IdentityStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/identity/register`, {
        method: 'POST',
        body: JSON.stringify({ handle }),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['identity', qid(variables.agentId)] }),
  });
}

export function useToken(agentId: string | number | undefined) {
  return useQuery<TokenStatus>({
    queryKey: ['token', qid(agentId)],
    queryFn: () => apiFetch<TokenStatus>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/token`),
    enabled: agentId != null && agentId !== '',
    staleTime: 60_000,
  });
}

export function useEconomy(agentId: string | number | undefined) {
  return useQuery<EconomyData>({
    queryKey: ['economy', qid(agentId)],
    queryFn: () => apiFetch<EconomyData>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/economy`),
    enabled: agentId != null && agentId !== '',
    staleTime: 30_000,
  });
}

export function useGiftOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, amount, message }: { agentId: string | number; amount: number; message?: string }) =>
      apiFetch<{ success: boolean }>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/economy/gift-owner`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['economy', qid(variables.agentId)] }),
  });
}

export function useCommerceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, description, amount, currency }: { agentId: string | number; description: string; amount: number; currency: string }) =>
      apiFetch<CommerceRequestResult>(`/api/selfclaw/v1/hosted-agents/${sid(agentId)}/commerce/request`, {
        method: 'POST',
        body: JSON.stringify({ description, amount, currency }),
      }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['economy', qid(variables.agentId)] }),
  });
}

// --- GATEWAY ENDPOINT DISCOVERY ---

// Fetched once per session (staleTime: Infinity). Normalises to a Set of
// "METHOD /path" keys for O(1) lookups via useHasEndpoint.
export function useGatewayEndpoints() {
  return useQuery<Set<string>>({
    queryKey: ['gateway-endpoints'],
    queryFn: async () => {
      const raw = await apiFetch<{ endpoints?: GatewayEndpoint[] } | GatewayEndpoint[]>(
        '/api/selfclaw/v1/gateway/endpoints',
      );
      const list: GatewayEndpoint[] = Array.isArray(raw)
        ? raw
        : (raw as { endpoints?: GatewayEndpoint[] }).endpoints ?? [];
      return new Set(list.map(e => `${e.method.toUpperCase()} ${e.path}`));
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

// Convenience hook — returns true when the endpoint is present in the manifest,
// or undefined while the manifest is still loading.
export function useHasEndpoint(method: string, path: string): boolean | undefined {
  const { data, isLoading } = useGatewayEndpoints();
  if (isLoading) return undefined;
  if (!data) return false;
  return data.has(`${method.toUpperCase()} ${path}`);
}

// --- COMPACT CONVERSATION ---

// POST /:id/conversations/compact
export function useCompactConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      conversationId,
    }: {
      agentId: string | number;
      conversationId: string | number;
    }) =>
      apiFetch<CompactConversationResponse>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/conversations/compact`,
        {
          method: 'POST',
          body: JSON.stringify({ conversationId: Number(conversationId) }),
        }
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', qid(variables.agentId)] });
      qc.invalidateQueries({ queryKey: ['conversations', qid(variables.agentId)] });
    },
  });
}
