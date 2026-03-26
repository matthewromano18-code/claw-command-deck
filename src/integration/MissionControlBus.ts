import { Agent, Task, TaskEvent, UsageMetrics, SettingToggle, AgentStatus, TaskStatus, TaskPriority } from './types';

// ─── Event Types ───────────────────────────────────────────
export type MCEventType =
  | 'agent:update'
  | 'agent:add'
  | 'agent:remove'
  | 'task:submit'
  | 'task:update'
  | 'task:complete'
  | 'event:push'
  | 'metrics:update'
  | 'settings:update'
  | 'state:reset'
  | 'state:sync';

export interface MCEvent<T = any> {
  type: MCEventType;
  payload: T;
  timestamp: string;
}

type Listener<T = any> = (event: MCEvent<T>) => void;

// ─── State ─────────────────────────────────────────────────
export interface MCState {
  agents: Agent[];
  tasks: Task[];
  events: TaskEvent[];
  metrics: UsageMetrics;
  settings: SettingToggle[];
}

const STORAGE_KEY = 'mission-control-state';

// ─── Event Bus ─────────────────────────────────────────────
class MissionControlBus {
  private listeners: Map<MCEventType | '*', Set<Listener>> = new Map();
  private state: MCState;

  constructor(initialState: MCState) {
    // Try to restore from localStorage, fall back to initial
    const saved = this.loadState();
    this.state = saved || initialState;
  }

  // ── Subscribe ──
  on<T = any>(type: MCEventType | '*', listener: Listener<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener as Listener);
    return () => this.listeners.get(type)?.delete(listener as Listener);
  }

  // ── Emit ──
  private emit<T>(type: MCEventType, payload: T) {
    const event: MCEvent<T> = { type, payload, timestamp: new Date().toISOString() };
    this.listeners.get(type)?.forEach((fn) => fn(event));
    this.listeners.get('*')?.forEach((fn) => fn(event));
    this.persistState();
  }

  // ── State Access ──
  getState(): MCState {
    return { ...this.state };
  }

  // ── Agent Operations ──
  updateAgent(agentId: string, updates: Partial<Agent>) {
    this.state.agents = this.state.agents.map((a) =>
      a.id === agentId ? { ...a, ...updates } : a
    );
    this.emit('agent:update', { agentId, updates });
  }

  addAgent(agent: Agent) {
    if (this.state.agents.find((a) => a.id === agent.id)) {
      return this.updateAgent(agent.id, agent);
    }
    this.state.agents.push(agent);
    this.emit('agent:add', agent);
  }

  removeAgent(agentId: string) {
    this.state.agents = this.state.agents.filter((a) => a.id !== agentId);
    this.emit('agent:remove', { agentId });
  }

  setAgentStatus(agentId: string, status: AgentStatus) {
    this.updateAgent(agentId, { status });
  }

  // ── Task Operations ──
  submitTask(task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) {
    const fullTask: Task = {
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...task,
    };
    this.state.tasks = [fullTask, ...this.state.tasks];
    this.state.metrics.activeTasks += 1;
    this.emit('task:submit', fullTask);
    return fullTask;
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    this.state.tasks = this.state.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    this.emit('task:update', { taskId, updates });
  }

  completeTask(taskId: string, result: string, confidence?: number) {
    const now = new Date().toISOString();
    const task = this.state.tasks.find((t) => t.id === taskId);
    const duration = task?.startedAt
      ? Math.floor((new Date(now).getTime() - new Date(task.startedAt).getTime()) / 1000)
      : undefined;

    this.updateTask(taskId, {
      status: 'completed',
      completedAt: now,
      result,
      confidence,
      duration,
    });
    this.state.metrics.activeTasks = Math.max(0, this.state.metrics.activeTasks - 1);
    this.state.metrics.completedToday += 1;
    this.emit('task:complete', { taskId, result });
  }

  // ── Event/Log Operations ──
  pushEvent(event: Omit<TaskEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
    const fullEvent: TaskEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };
    this.state.events = [fullEvent, ...this.state.events.slice(0, 199)]; // keep last 200
    this.emit('event:push', fullEvent);
    return fullEvent;
  }

  // ── Metrics ──
  updateMetrics(updates: Partial<UsageMetrics>) {
    this.state.metrics = { ...this.state.metrics, ...updates };
    this.emit('metrics:update', updates);
  }

  // ── Settings ──
  updateSetting(settingId: string, enabled: boolean) {
    this.state.settings = this.state.settings.map((s) =>
      s.id === settingId ? { ...s, enabled } : s
    );
    this.emit('settings:update', { settingId, enabled });
  }

  addSetting(setting: SettingToggle) {
    if (this.state.settings.find((s) => s.id === setting.id)) {
      return this.updateSetting(setting.id, setting.enabled);
    }
    this.state.settings.push(setting);
    this.emit('settings:update', setting);
  }

  // ── Bulk Operations ──
  syncState(newState: Partial<MCState>) {
    if (newState.agents) this.state.agents = newState.agents;
    if (newState.tasks) this.state.tasks = newState.tasks;
    if (newState.events) this.state.events = newState.events;
    if (newState.metrics) this.state.metrics = newState.metrics;
    if (newState.settings) this.state.settings = newState.settings;
    this.emit('state:sync', newState);
  }

  resetState(initialState: MCState) {
    this.state = { ...initialState };
    this.emit('state:reset', null);
  }

  // ── Persistence ──
  private persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // quota exceeded or unavailable
    }
  }

  private loadState(): MCState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export default MissionControlBus;
