import MissionControlBus from './MissionControlBus';
import { mockAgents, mockTasks, mockEvents, mockMetrics, mockSettings } from '@/data/mockData';
import { mockSkills } from '@/data/mockSkills';
import { SystemVitalsData, CodexApiUsageData } from '@/data/types';

const defaultVitals: SystemVitalsData = {
  cpu: { percentage: 42, subtitle: 'Apple M4', details: [
    { label: 'user', value: '26.3%' }, { label: 'sys', value: '15.8%' },
    { label: 'idle', value: '57.9%' }, { label: 'cores', value: '10' },
  ]},
  memory: { percentage: 74, details: [
    { label: 'used of total', value: '11.9 GB of 16.0 GB' }, { label: 'available', value: '4.1 GB' },
  ]},
  disk: { percentage: 34, details: [
    { label: 'used of total', value: '157.2 GB of 460.4 GB' }, { label: 'available', value: '266.4 GB' },
  ]},
  temperature: { value: null, unit: '°C', message: 'Requires elevated access' },
  uptime: '4 days',
  hostname: 'Mission-Control.local',
};

const defaultCodexApi: CodexApiUsageData = {
  fiveHourPct: 0,
  weeklyPct: 0,
  codexTasks: 0,
  plan: 'ChatGPT Plus',
};

// ─── Clear stale state to ensure new fields exist ─
localStorage.removeItem('mission-control-state');

// ─── Singleton Bus Instance ────────────────────────────────
const bus = new MissionControlBus({
  agents: mockAgents,
  tasks: mockTasks,
  events: mockEvents,
  metrics: mockMetrics,
  settings: mockSettings,
  skills: mockSkills,
  chatMessages: [],
  systemVitals: defaultVitals,
  codexApiUsage: defaultCodexApi,
  swarmSessions: [],
});

// ─── Expose on Window for External Agent Access ────────────
const api = {
  // State
  getState: bus.getState.bind(bus),

  // Agents
  addAgent: bus.addAgent.bind(bus),
  updateAgent: bus.updateAgent.bind(bus),
  removeAgent: bus.removeAgent.bind(bus),
  setAgentStatus: bus.setAgentStatus.bind(bus),

  // Tasks
  submitTask: bus.submitTask.bind(bus),
  updateTask: bus.updateTask.bind(bus),
  completeTask: bus.completeTask.bind(bus),

  // Events / Logs
  pushEvent: bus.pushEvent.bind(bus),

  // Metrics
  updateMetrics: bus.updateMetrics.bind(bus),

  // Settings
  updateSetting: bus.updateSetting.bind(bus),
  addSetting: bus.addSetting.bind(bus),

  // Skills
  addSkill: bus.addSkill.bind(bus),
  updateSkill: bus.updateSkill.bind(bus),
  removeSkill: bus.removeSkill.bind(bus),
  toggleSkill: bus.toggleSkill.bind(bus),

  // Chat
  sendChatMessage: bus.sendChatMessage.bind(bus),
  getChatMessages: bus.getChatMessages.bind(bus),
  clearChat: bus.clearChat.bind(bus),

  // System Vitals
  updateSystemVitals: bus.updateSystemVitals.bind(bus),

  // Codex API Usage
  updateCodexApiUsage: bus.updateCodexApiUsage.bind(bus),

  // Swarm
  startSwarm: bus.startSwarm.bind(bus),
  spawnSwarmAgent: bus.spawnSwarmAgent.bind(bus),
  updateSwarmAgent: bus.updateSwarmAgent.bind(bus),
  completeSwarm: bus.completeSwarm.bind(bus),
  getActiveSwarm: bus.getActiveSwarm.bind(bus),

  // Bulk
  syncState: bus.syncState.bind(bus),
  resetState: bus.resetState.bind(bus),
  clearStorage: bus.clearStorage.bind(bus),

  // Subscribe
  on: bus.on.bind(bus),

  // Meta
  version: '2.2.0',
};

// Attach to window
(window as any).MissionControl = api;

console.log(
  '%c🚀 Mission Control API v2.2 — window.MissionControl\n' +
  '%cAgents • Tasks • Skills • Chat • Vitals • Codex • Swarm • Events • Metrics • Settings',
  'color: hsl(175, 70%, 50%); font-weight: bold; font-size: 12px;',
  'color: hsl(215, 15%, 52%); font-size: 10px;'
);

// ─── Auto Demo: Swarm Branch from Engineering ─────────────
setTimeout(() => {
  const s = bus.startSwarm('dept-engineering', 'clawteam spawn');
  setTimeout(() => {
    const leader = bus.spawnSwarmAgent(s.id, {
      name: 'Swarm Leader',
      role: 'leader',
      parentId: 'dept-engineering',
      status: 'running',
      currentTask: 'Coordinating analysis',
    });
    if (!leader) return;
    setTimeout(() => {
      bus.spawnSwarmAgent(s.id, {
        name: 'Code Analyzer',
        role: 'worker',
        parentId: leader.id,
        status: 'running',
        currentTask: 'Scanning codebase',
      });
    }, 800);
    setTimeout(() => {
      bus.spawnSwarmAgent(s.id, {
        name: 'Test Runner',
        role: 'worker',
        parentId: leader.id,
        status: 'running',
        currentTask: 'Running test suite',
      });
    }, 1500);
  }, 600);
}, 1000);

export { bus, api };
export default bus;
