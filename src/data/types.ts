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
