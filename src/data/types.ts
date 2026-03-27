export type AgentStatus = 'idle' | 'thinking' | 'running' | 'waiting' | 'blocked' | 'complete' | 'failed';
export type TaskStatus = 'queued' | 'active' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AgentType = 'main' | 'department' | 'specialist';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  department?: string;
  status: AgentStatus;
  parentId: string | null;
  tools: string[];
  description: string;
  tasksCompleted: number;
  avgLatency: number; // ms
  successRate: number; // 0-1
  queueCount: number;
}

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number; // seconds
  agentPath: string[]; // agent IDs in order
  currentAgentId?: string;
  result?: string;
  department?: string;
  confidence?: number;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  type: 'received' | 'delegated' | 'processing' | 'completed' | 'failed' | 'waiting';
  message: string;
  timestamp: string;
}

export interface UsageMetrics {
  activeTasks: number;
  queuedTasks: number;
  completedToday: number;
  estimatedTokens: number;
  estimatedCost: number;
  successRate: number;
  avgCompletionTime: number; // seconds
  uptime: number; // percentage
}

export interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  category: 'connection' | 'automation' | 'safety' | 'integration';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  agentIds: string[];
  triggers: string[];
  cooldown: number;
  usageCount: number;
  lastUsed: string;
}

// ─── System Vitals ─────────────────────────────────────────
export interface VitalMetric {
  percentage: number;
  subtitle?: string;
  details: { label: string; value: string }[];
}

export interface SystemVitalsData {
  cpu: VitalMetric;
  memory: VitalMetric;
  disk: VitalMetric;
  temperature: { value: number | null; unit: string; message?: string };
  uptime: string;
  hostname: string;
}

// ─── Swarm ─────────────────────────────────────────────────
export type SwarmAgentStatus = 'spawning' | 'running' | 'idle' | 'completed' | 'error';

export interface SwarmAgent {
  id: string;
  name: string;
  role?: 'leader' | 'worker';
  parentId: string; // swarm-internal parent (trigger agent or another swarm agent)
  status: SwarmAgentStatus;
  currentTask: string;
  spawnedAt: string;
  completedAt?: string;
  error?: string;
}

export interface SwarmSession {
  id: string;
  triggerAgentId: string; // the main hierarchy agent that started the swarm
  command: string;
  startedAt: string;
  status: 'active' | 'completed' | 'failed';
  agents: SwarmAgent[];
}

// ─── Codex API Usage ───────────────────────────────────────
export interface CodexApiUsageData {
  fiveHourPct: number;
  weeklyPct: number;
  codexTasks: number;
  plan: string;
}
