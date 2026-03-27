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

// ─── Clear stale state before bus init (ensures new fields like swarmSessions exist) ─
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

// ─── Wednesday Demo: Engineering kicks off a swarm ─────────
setTimeout(() => {
  bus.setAgentStatus('dept-engineering', 'running');
  bus.pushEvent({
    taskId: 'demo-swarm',
    agentId: 'dept-engineering',
    agentName: 'Engineering',
    type: 'processing',
    message: 'Executing: clawteam spawn --parallel refactor',
  });

  const swarm = bus.startSwarm('dept-engineering', 'clawteam spawn --parallel refactor');

  // Wave 1 — Leader spawns
  setTimeout(() => {
    const leader = bus.spawnSwarmAgent(swarm.id, {
      name: 'Swarm Leader',
      role: 'leader',
      parentId: 'dept-engineering',
      status: 'running',
      currentTask: 'Coordinating refactor across codebase',
    });

    bus.pushEvent({
      taskId: 'demo-swarm',
      agentId: leader!.id,
      agentName: 'Swarm Leader',
      type: 'received',
      message: 'Swarm leader online — planning worker allocation',
    });

    // Wave 2 — Leader spawns 3 workers
    setTimeout(() => {
      if (!leader) return;

      const w1 = bus.spawnSwarmAgent(swarm.id, {
        name: 'Code Analyzer',
        role: 'worker',
        parentId: leader.id,
        status: 'running',
        currentTask: 'Scanning for dead imports & unused code',
      });

      const w2 = bus.spawnSwarmAgent(swarm.id, {
        name: 'Test Runner',
        role: 'worker',
        parentId: leader.id,
        status: 'running',
        currentTask: 'Running full test suite (147 tests)',
      });

      const w3 = bus.spawnSwarmAgent(swarm.id, {
        name: 'Dependency Auditor',
        role: 'worker',
        parentId: leader.id,
        status: 'spawning',
        currentTask: 'Checking outdated packages',
      });

      bus.updateSwarmAgent(swarm.id, leader.id, {
        currentTask: 'Monitoring 3 workers…',
      });

      bus.pushEvent({
        taskId: 'demo-swarm',
        agentId: leader.id,
        agentName: 'Swarm Leader',
        type: 'delegated',
        message: 'Spawned 3 workers: Analyzer, Tests, Auditor',
      });

      // Wave 3 — Workers start completing
      setTimeout(() => {
        if (!w1 || !w2 || !w3) return;

        bus.updateSwarmAgent(swarm.id, w3.id, {
          status: 'running',
          currentTask: 'Found 4 outdated packages',
        });

        bus.updateSwarmAgent(swarm.id, w1.id, {
          status: 'completed',
          currentTask: 'Removed 12 dead imports ✓',
        });

        bus.pushEvent({
          taskId: 'demo-swarm',
          agentId: w1.id,
          agentName: 'Code Analyzer',
          type: 'completed',
          message: 'Removed 12 dead imports across 8 files',
        });

        // Wave 4 — More results
        setTimeout(() => {
          bus.updateSwarmAgent(swarm.id, w2.id, {
            status: 'completed',
            currentTask: '147/147 tests passed ✓',
          });

          bus.updateSwarmAgent(swarm.id, w3.id, {
            status: 'error',
            currentTask: 'Version conflict detected',
            error: 'react-dom@18 conflicts with react@19 peer dep',
          });

          bus.updateSwarmAgent(swarm.id, leader.id, {
            status: 'completed',
            currentTask: 'Swarm done — 2 success, 1 conflict',
          });

          bus.pushEvent({
            taskId: 'demo-swarm',
            agentId: leader.id,
            agentName: 'Swarm Leader',
            type: 'completed',
            message: 'Swarm finished — 2 workers passed, 1 conflict found',
          });
        }, 3500);
      }, 3000);
    }, 2000);
  }, 1000);
}, 800);

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

export { bus, api };
export default bus;
