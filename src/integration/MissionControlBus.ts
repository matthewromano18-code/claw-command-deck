import { Agent, Task, TaskEvent, UsageMetrics, SettingToggle, AgentStatus, Skill, SystemVitalsData, CodexApiUsageData, SwarmSession, SwarmAgent, SwarmAgentStatus } from '@/data/types';
import { ChatMessage } from '@/data/chatTypes';

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
  | 'skill:add'
  | 'skill:update'
  | 'skill:remove'
  | 'chat:message'
  | 'chat:clear'
  | 'vitals:update'
  | 'codex-api:update'
  | 'swarm:start'
  | 'swarm:agent-spawn'
  | 'swarm:agent-update'
  | 'swarm:complete'
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
  skills: Skill[];
  chatMessages: ChatMessage[];
  systemVitals: SystemVitalsData;
  codexApiUsage: CodexApiUsageData;
  swarmSessions: SwarmSession[];
}

const STORAGE_KEY = 'mission-control-state';

// ─── Event Bus ─────────────────────────────────────────────
class MissionControlBus {
  private listeners: Map<MCEventType | '*', Set<Listener>> = new Map();
  private state: MCState;

  constructor(initialState: MCState) {
    const saved = this.loadState();
    // Merge saved state with initial to handle newly added fields
    this.state = saved ? { ...initialState, ...saved } : initialState;
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

  // ══════════════════════════════════════════════════════════
  // AGENTS
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  // EVENTS / LOGS
  // ══════════════════════════════════════════════════════════
  pushEvent(event: Omit<TaskEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
    const fullEvent: TaskEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };
    this.state.events = [fullEvent, ...this.state.events.slice(0, 199)];
    this.emit('event:push', fullEvent);
    return fullEvent;
  }

  // ══════════════════════════════════════════════════════════
  // METRICS
  // ══════════════════════════════════════════════════════════
  updateMetrics(updates: Partial<UsageMetrics>) {
    this.state.metrics = { ...this.state.metrics, ...updates };
    this.emit('metrics:update', updates);
  }

  // ══════════════════════════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  // SKILLS
  // ══════════════════════════════════════════════════════════
  addSkill(skill: Skill) {
    const existing = this.state.skills.find((s) => s.id === skill.id);
    if (existing) {
      return this.updateSkill(skill.id, skill);
    }
    this.state.skills.push(skill);
    this.emit('skill:add', skill);
  }

  updateSkill(skillId: string, updates: Partial<Skill>) {
    this.state.skills = this.state.skills.map((s) =>
      s.id === skillId ? { ...s, ...updates } : s
    );
    this.emit('skill:update', { skillId, updates });
  }

  removeSkill(skillId: string) {
    this.state.skills = this.state.skills.filter((s) => s.id !== skillId);
    this.emit('skill:remove', { skillId });
  }

  toggleSkill(skillId: string) {
    const skill = this.state.skills.find((s) => s.id === skillId);
    if (skill) {
      this.updateSkill(skillId, { status: skill.status === 'active' ? 'inactive' : 'active' });
    }
  }

  // ══════════════════════════════════════════════════════════
  // CHAT
  // ══════════════════════════════════════════════════════════
  sendChatMessage(content: string, options?: { agentName?: string; taskId?: string }) {
    const msg: ChatMessage = {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'agent',
      content,
      timestamp: new Date().toISOString(),
      agentName: options?.agentName || 'Main Agent',
      taskId: options?.taskId,
    };
    this.state.chatMessages.push(msg);
    this.emit('chat:message', msg);
    return msg;
  }

  getChatMessages(): ChatMessage[] {
    return [...this.state.chatMessages];
  }

  clearChat() {
    this.state.chatMessages = [];
    this.emit('chat:clear', null);
  }

  // ══════════════════════════════════════════════════════════
  // BULK
  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // SYSTEM VITALS
  // ══════════════════════════════════════════════════════════
  updateSystemVitals(updates: Partial<SystemVitalsData>) {
    this.state.systemVitals = { ...this.state.systemVitals, ...updates };
    this.emit('vitals:update', updates);
  }

  // ══════════════════════════════════════════════════════════
  // CODEX API USAGE
  // ══════════════════════════════════════════════════════════
  updateCodexApiUsage(updates: Partial<CodexApiUsageData>) {
    this.state.codexApiUsage = { ...this.state.codexApiUsage, ...updates };
    this.emit('codex-api:update', updates);
  }

  // ══════════════════════════════════════════════════════════
  // SWARM
  // ══════════════════════════════════════════════════════════
  startSwarm(triggerAgentId: string, command: string): SwarmSession {
    const session: SwarmSession = {
      id: `swarm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      triggerAgentId,
      command,
      startedAt: new Date().toISOString(),
      status: 'active',
      agents: [],
    };
    this.state.swarmSessions = [session, ...this.state.swarmSessions];
    this.emit('swarm:start', session);
    return session;
  }

  spawnSwarmAgent(sessionId: string, agent: Omit<SwarmAgent, 'id' | 'spawnedAt'> & { id?: string }): SwarmAgent | null {
    const session = this.state.swarmSessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const full: SwarmAgent = {
      id: agent.id || `sw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      spawnedAt: new Date().toISOString(),
      ...agent,
    };
    // Create new array references so React detects the change
    this.state.swarmSessions = this.state.swarmSessions.map((s) =>
      s.id === sessionId ? { ...s, agents: [...s.agents, full] } : s
    );
    this.emit('swarm:agent-spawn', { sessionId, agent: full });
    return full;
  }

  updateSwarmAgent(sessionId: string, agentId: string, updates: Partial<SwarmAgent>) {
    const session = this.state.swarmSessions.find((s) => s.id === sessionId);
    if (!session) return;
    session.agents = session.agents.map((a) =>
      a.id === agentId ? { ...a, ...updates } : a
    );
    this.emit('swarm:agent-update', { sessionId, agentId, updates });
  }

  completeSwarm(sessionId: string, status: 'completed' | 'failed' = 'completed') {
    this.state.swarmSessions = this.state.swarmSessions.map((s) =>
      s.id === sessionId ? { ...s, status } : s
    );
    this.emit('swarm:complete', { sessionId, status });
  }

  getActiveSwarm(): SwarmSession | null {
    return this.state.swarmSessions.find((s) => s.status === 'active') || null;
  }

  // ══════════════════════════════════════════════════════════
  // BULK
  // ══════════════════════════════════════════════════════════
  syncState(newState: Partial<MCState>) {
    if (newState.agents) this.state.agents = newState.agents;
    if (newState.tasks) this.state.tasks = newState.tasks;
    if (newState.events) this.state.events = newState.events;
    if (newState.metrics) this.state.metrics = newState.metrics;
    if (newState.settings) this.state.settings = newState.settings;
    if (newState.skills) this.state.skills = newState.skills;
    if (newState.chatMessages) this.state.chatMessages = newState.chatMessages;
    if (newState.systemVitals) this.state.systemVitals = newState.systemVitals;
    if (newState.codexApiUsage) this.state.codexApiUsage = newState.codexApiUsage;
    if (newState.swarmSessions) this.state.swarmSessions = newState.swarmSessions;
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
    } catch { /* quota exceeded */ }
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
