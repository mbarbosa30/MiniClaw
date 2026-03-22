import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/store';
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
  FeedPost,
  FeedComment,
  MarketplaceService,
  MarketplaceOrder,
  DeepReflection,
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

type RawAgent = Omit<Agent, 'pocScore'> & {
  currentActivity?: string | null;
  pendingTaskCount?: number | null;
  recentActivity?: string | null;
  phase?: string | null;
  phaseProgress?: number | null;
  // API may return pocScore as plain int OR legacy object with totalScore
  pocScore?: number | { totalScore: number } | null;
};

function normalizeListAgent(raw: RawAgent): Agent {
  const agent = raw as unknown as Agent;

  // Normalize pocScore — API now returns plain int, but guard against legacy object
  if (raw.pocScore != null && typeof raw.pocScore === 'object') {
    agent.pocScore = (raw.pocScore as { totalScore: number }).totalScore ?? null;
  } else {
    agent.pocScore = (raw.pocScore as number | null | undefined) ?? null;
  }

  // Determine the best activity string — prefer currentActivity, fall back to recentActivity
  const activityFromTop = (raw as RawAgent & { currentActivity?: string | null }).currentActivity ?? raw.recentActivity ?? null;

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
  const inlinePending = raw.pendingTaskCount ?? null;
  if (inlinePending != null) {
    if (agent.stats) {
      agent.stats = { ...agent.stats, pendingTasksCount: inlinePending };
    } else {
      agent.stats = { totalActionsCount: 0, pendingTasksCount: inlinePending, memoriesCount: 0, currentActivity: null };
    }
  }

  return agent;
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
        combinedTokensToday: agents.reduce((sum, a) => sum + (a.tokensUsedToday ?? 0), 0),
        combinedCostUsd: agents.reduce((sum, a) => sum + (a.tokenCostUsd ?? 0), 0),
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
  celoBalance?: string | null;
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
      // Only stop retrying if selfclaw.ai itself confirmed the agent doesn't
      // exist (isBackend404 === true). A proxy-generated 404 (API server down)
      // should still be retried so we don't show a false "Agent not found".
      if (err instanceof ApiError && err.status === 404 && err.isBackend404) return false;
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

type RawUsageStats = {
  tokens?: Record<string, number>;
  cost?: Record<string, number>;
  totalCalls30d?: number;
  avgLatencyMs?: number;
  topModels?: { model: string; provider?: string; calls: number; tokens: number; costUsd?: number }[];
  callTypeBreakdown?: Record<string, number>;
};

function normalizeUsageStats(raw: RawUsageStats): AgentUsageStats {
  const tokens = raw.tokens ?? {};
  const cost = raw.cost ?? {};

  const callsByType: AgentUsageStats['callsByType'] = Object.entries(raw.callTypeBreakdown ?? {}).map(
    ([type, calls]) => ({ type, calls })
  );

  const callsByModel: AgentUsageStats['callsByModel'] = (raw.topModels ?? []).map(m => ({
    model: m.model,
    provider: m.provider,
    calls: m.calls,
    tokens: m.tokens,
    costUsd: m.costUsd,
  }));

  return {
    tokens: {
      last24h: tokens['24h'] ?? 0,
      last7d: tokens['7d'] ?? 0,
      last30d: tokens['30d'] ?? 0,
    },
    cost: {
      last24h: cost['24h'] ?? 0,
      last7d: cost['7d'] ?? 0,
      last30d: cost['30d'] ?? 0,
    },
    totalCalls30d: raw.totalCalls30d ?? 0,
    avgLatencyMs: raw.avgLatencyMs ?? 0,
    callsByType,
    callsByModel: callsByModel.length > 0 ? callsByModel : undefined,
  };
}

// GET /:id/usage-stats — per-agent LLM consumption (owner-only)
export function useUsageStats(agentId: string | number | undefined) {
  return useQuery<AgentUsageStats>({
    queryKey: ['usage-stats', qid(agentId)],
    queryFn: async () => {
      const raw = await apiFetch<RawUsageStats>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/usage-stats`
      );
      return normalizeUsageStats(raw);
    },
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

// --- FEED ---

type RawFeedEnvelope = FeedPost[] | { posts?: FeedPost[]; items?: FeedPost[]; feed?: FeedPost[] };

function normaliseFeedResponse(raw: RawFeedEnvelope): FeedPost[] {
  if (Array.isArray(raw)) return raw;
  const env = raw as { posts?: FeedPost[]; items?: FeedPost[]; feed?: FeedPost[] };
  return env.posts ?? env.items ?? env.feed ?? [];
}

// GET /v1/feed?source=miniclaw — returns posts from the authenticated user's agents.
// Optionally filter to a single agent with agentId.
export function useFeed(filters?: { agentId?: string | number }) {
  const agentKey = filters?.agentId != null ? String(filters.agentId) : 'all';
  return useQuery<FeedPost[]>({
    queryKey: ['feed', agentKey],
    queryFn: async () => {
      const params = new URLSearchParams({ source: 'miniclaw', limit: '20' });
      if (filters?.agentId != null) params.set('agentId', String(filters.agentId));
      const raw = await apiFetch<RawFeedEnvelope>(`/api/selfclaw/v1/feed?${params.toString()}`);
      return normaliseFeedResponse(raw);
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
  });
}

// GET /v1/hosted-agents/:id/feed/:postId/comments — loaded lazily when a post is expanded.
export function useFeedPostComments(
  agentId: string | number | undefined,
  postId: string | undefined,
  enabled = false,
) {
  return useQuery<FeedComment[]>({
    queryKey: ['feed-comments', qid(agentId), postId],
    queryFn: async () => {
      const raw = await apiFetch<FeedComment[] | { comments?: FeedComment[] }>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/feed/${postId}/comments`,
      );
      if (Array.isArray(raw)) return raw;
      return (raw as { comments?: FeedComment[] }).comments ?? [];
    },
    enabled: enabled && agentId != null && postId != null,
    staleTime: 30_000,
  });
}

// POST /v1/hosted-agents/:id/feed/:postId/like — toggles like state.
export function useLikeFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, postId }: { agentId: string | number; postId: string }) =>
      apiFetch<void>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/feed/${postId}/like`,
        { method: 'POST' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

// POST /v1/hosted-agents/:id/feed/:postId/comment — adds a comment.
export function useCommentFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      postId,
      content,
    }: {
      agentId: string | number;
      postId: string;
      content: string;
    }) =>
      apiFetch<FeedComment>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/feed/${postId}/comment`,
        { method: 'POST', body: JSON.stringify({ content }) },
      ),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['feed-comments', qid(v.agentId), v.postId] });
    },
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
    retry: 0,
  });
}

// Convenience hook — returns true when the endpoint is present in the manifest,
// or undefined while the manifest is still loading.
// method defaults to 'GET' so callers can write useHasEndpoint('/v1/feed').
export function useHasEndpoint(path: string, method = 'GET'): boolean | undefined {
  const { data, isLoading } = useGatewayEndpoints();
  if (isLoading) return undefined;
  if (!data) return false;
  return data.has(`${method.toUpperCase()} ${path}`);
}

// POST /v1/hosted-agents/:id/feed/post — owner composes a feed post on behalf of an agent.
export function useCreateFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      content,
      category,
      title,
    }: {
      agentId: string | number;
      content: string;
      category?: string;
      title?: string;
    }) =>
      apiFetch<FeedPost>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/feed/post`,
        { method: 'POST', body: JSON.stringify({ content, category, title }) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
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

// --- MARKETPLACE ---

function normaliseServiceList(raw: unknown): MarketplaceService[] {
  if (Array.isArray(raw)) return raw as MarketplaceService[];
  const env = raw as Record<string, unknown>;
  return (env.services ?? env.items ?? env.data ?? []) as MarketplaceService[];
}

function normaliseOrderList(raw: unknown): MarketplaceOrder[] {
  const candidate = Array.isArray(raw)
    ? raw
    : (raw as Record<string, unknown>).orders
      ?? (raw as Record<string, unknown>).items
      ?? (raw as Record<string, unknown>).data
      ?? [];
  const list: unknown[] = Array.isArray(candidate) ? candidate : [];
  return (list as MarketplaceOrder[]).map(o => ({ ...o, id: String((o as MarketplaceOrder).id) }));
}

// GET /v1/hosted-agents/:agentId/marketplace/services — browse + optional text search
// Alias: useMarketplaceSearch is a thin wrapper with the same signature
export function useMarketplaceSearch(agentId: string | number | undefined, search?: string) {
  return useMarketplaceServices(agentId, search);
}

export function useMarketplaceServices(agentId: string | number | undefined, search?: string) {
  return useQuery<MarketplaceService[]>({
    queryKey: ['marketplace-services', qid(agentId), search ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search && search.trim()) params.set('q', search.trim());
      const url = `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/marketplace/services${params.toString() ? `?${params}` : ''}`;
      const raw = await apiFetch<unknown>(url);
      return normaliseServiceList(raw);
    },
    enabled: agentId != null && agentId !== '',
    staleTime: 60_000,
  });
}

// POST /v1/hosted-agents/:agentId/marketplace/services/:serviceId/order — place an order
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, input, agentId }: { serviceId: string; input?: string; agentId: string | number }) =>
      apiFetch<MarketplaceOrder>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/marketplace/services/${serviceId}/order`,
        {
          method: 'POST',
          body: JSON.stringify({
            input_data: {},
            delivery_instructions: input ?? '',
          }),
        }
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['marketplace-orders-my', qid(variables.agentId)] });
      qc.invalidateQueries({ queryKey: ['marketplace-orders-incoming', qid(variables.agentId)] });
    },
  });
}

// GET /v1/hosted-agents/:agentId/marketplace/orders/my — orders you placed (outgoing)
export function useMyOrders(agentId: string | number | undefined) {
  return useQuery<MarketplaceOrder[]>({
    queryKey: ['marketplace-orders-my', qid(agentId)],
    queryFn: async () => {
      const raw = await apiFetch<unknown>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/marketplace/orders/my`);
      return normaliseOrderList(raw);
    },
    enabled: agentId != null && agentId !== '',
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// GET /v1/hosted-agents/:agentId/marketplace/orders/incoming — orders placed to your agents
export function useIncomingOrders(agentId: string | number | undefined) {
  return useQuery<MarketplaceOrder[]>({
    queryKey: ['marketplace-orders-incoming', qid(agentId)],
    queryFn: async () => {
      const raw = await apiFetch<unknown>(`/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/marketplace/orders/incoming`);
      return normaliseOrderList(raw);
    },
    enabled: agentId != null && agentId !== '',
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// POST /v1/hosted-agents/:agentId/marketplace/orders/:orderId/:action — accept | reject | deliver | confirm | rate
// When action is 'rate', ratingPayload must be provided ({ rating, comment? })
export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      action,
      agentId,
      ratingPayload,
    }: {
      orderId: string;
      action: 'accept' | 'reject' | 'deliver' | 'confirm' | 'rate';
      agentId: string | number;
      ratingPayload?: { rating: number; comment?: string };
    }) =>
      apiFetch<MarketplaceOrder>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/marketplace/orders/${orderId}/${action}`,
        {
          method: 'POST',
          body: ratingPayload ? JSON.stringify(ratingPayload) : undefined,
        }
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['marketplace-orders-my', qid(variables.agentId)] });
      qc.invalidateQueries({ queryKey: ['marketplace-orders-incoming', qid(variables.agentId)] });
    },
  });
}

// POST /v1/hosted-agents/:agentId/marketplace/orders/:orderId/rate — 1-5 stars + optional comment
export function useRateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      agentId,
      rating,
      comment,
    }: {
      orderId: string;
      agentId: string | number;
      rating: number;
      comment?: string;
    }) =>
      apiFetch<MarketplaceOrder>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/marketplace/orders/${orderId}/rate`,
        {
          method: 'POST',
          body: JSON.stringify({ rating, comment }),
        }
      ),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['marketplace-orders-my', qid(variables.agentId)] });
      qc.invalidateQueries({ queryKey: ['marketplace-orders-incoming', qid(variables.agentId)] });
    },
  });
}

// --- DEEP REFLECTION ---

// POST /v1/hosted-agents/:agentId/marketplace/services/skill-deep-reflection/order — trigger a $1 deep reflection job
// The order endpoint returns a MarketplaceOrder; we normalize the response to { jobId } using the order id as the reflectionId.
export function useTriggerReflection() {
  return useMutation({
    mutationFn: async (agentId: string | number) => {
      const order = await apiFetch<MarketplaceOrder>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId)}/marketplace/services/skill-deep-reflection/order`,
        {
          method: 'POST',
          body: JSON.stringify({ input_data: {}, delivery_instructions: '' }),
        }
      );
      // The reflectionId used for polling is the order id
      return { jobId: String(order.id) };
    },
  });
}

// GET /v1/hosted-agents/:agentId/deep-reflection/:reflectionId — poll until status is done | failed
export function usePollReflection(
  agentId: string | number | undefined,
  jobId: string | undefined,
  enabled = false,
) {
  return useQuery<DeepReflection>({
    queryKey: ['reflection', qid(agentId), jobId],
    queryFn: () =>
      apiFetch<DeepReflection>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/deep-reflection/${jobId}`,
      ),
    enabled: enabled && agentId != null && jobId != null,
    refetchInterval: (query) => {
      const status = (query.state.data as DeepReflection | undefined)?.status;
      if (status === 'done' || status === 'failed') return false;
      return 3_000;
    },
    staleTime: 0,
    retry: 1,
  });
}

// GET /v1/hosted-agents/:id/reflect/history — past reflections for this agent
export function useReflectionHistory(agentId: string | number | undefined, enabled = false) {
  return useQuery<DeepReflection[]>({
    queryKey: ['reflection-history', qid(agentId)],
    queryFn: async () => {
      const raw = await apiFetch<DeepReflection[] | { reflections?: DeepReflection[] }>(
        `/api/selfclaw/v1/hosted-agents/${sid(agentId!)}/reflect/history`,
      );
      if (Array.isArray(raw)) return raw;
      return (raw as { reflections?: DeepReflection[] }).reflections ?? [];
    },
    enabled: enabled && agentId != null,
    staleTime: 60_000,
  });
}
