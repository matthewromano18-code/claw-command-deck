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

// ─── Clear stale persisted state so demo swarm always shows ─
bus.clearStorage();

// ─── Wednesday Demo: Engineering kicks off a swarm ─────────
setTimeout(() => {
  // Engineering agent goes active
  bus.setAgentStatus('dept-engineering', 'running');
  bus.pushEvent({
    taskId: 'demo-swarm',
    agentId: 'dept-engineering',
    agentName: 'Engineering',
    type: 'processing',
    message: 'Executing: clawteam spawn --parallel refactor',
  });

  const swarm = bus.startSwarm('dept-engineering', 'clawteam spawn --parallel refactor');

  // Wave 1 — first two workers spawn immediately
  setTimeout(() => {
    const w1 = bus.spawnSwarmAgent(swarm.id, {
      name: 'Code Analyzer',
      parentId: 'dept-engineering',
      status: 'running',
      currentTask: 'Scanning codebase for dead imports',
    });

    const w2 = bus.spawnSwarmAgent(swarm.id, {
      name: 'Test Runner',
      parentId: 'dept-engineering',
      status: 'running',
      currentTask: 'Running full test suite',
    });

    bus.pushEvent({
      taskId: 'demo-swarm',
      agentId: 'dept-engineering',
      agentName: 'Engineering',
      type: 'delegated',
      message: 'Spawned Code Analyzer + Test Runner',
    });

    // Wave 2 — sub-agents spawn under workers
    setTimeout(() => {
      if (!w1 || !w2) return;

      bus.spawnSwarmAgent(swarm.id, {
        name: 'Lint Fixer',
        parentId: w1.id,
        status: 'running',
        currentTask: 'Auto-fixing 23 lint violations',
      });

      bus.spawnSwarmAgent(swarm.id, {
        name: 'Import Cleaner',
        parentId: w1.id,
        status: 'spawning',
        currentTask: 'Removing 8 unused imports',
      });

      bus.updateSwarmAgent(swarm.id, w2.id, {
        status: 'running',
        currentTask: 'Running 147 unit tests…',
      });

      bus.pushEvent({
        taskId: 'demo-swarm',
        agentId: w1.id,
        agentName: 'Code Analyzer',
        type: 'delegated',
        message: 'Spawned Lint Fixer + Import Cleaner',
      });

      // Wave 3 — results come in
      setTimeout(() => {
        bus.updateSwarmAgent(swarm.id, w1.id, {
          status: 'completed',
          currentTask: 'Analysis complete — 31 issues found',
        });

        bus.updateSwarmAgent(swarm.id, w2.id, {
          status: 'completed',
          currentTask: '147/147 tests passed ✓',
        });

        bus.pushEvent({
          taskId: 'demo-swarm',
          agentId: w2.id,
          agentName: 'Test Runner',
          type: 'completed',
          message: 'All 147 tests passed',
        });

        // Wave 4 — sub-agents finish, one errors
        setTimeout(() => {
          const agents = bus.getState().swarmSessions
            .find(s => s.id === swarm.id)?.agents || [];
          const lintFixer = agents.find(a => a.name === 'Lint Fixer');
          const importCleaner = agents.find(a => a.name === 'Import Cleaner');

          if (lintFixer) {
            bus.updateSwarmAgent(swarm.id, lintFixer.id, {
              status: 'completed',
              currentTask: 'Fixed 23/23 violations',
            });
          }
          if (importCleaner) {
            bus.updateSwarmAgent(swarm.id, importCleaner.id, {
              status: 'error',
              currentTask: 'Failed on circular dependency',
              error: 'Circular import detected: utils → helpers → utils',
            });
          }

          bus.pushEvent({
            taskId: 'demo-swarm',
            agentId: 'dept-engineering',
            agentName: 'Engineering',
            type: 'completed',
            message: 'Swarm finished — 3 completed, 1 error',
          });
        }, 4000);
      }, 3500);
    }, 2500);
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
