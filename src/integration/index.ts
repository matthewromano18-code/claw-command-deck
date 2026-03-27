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

  // Agent Thoughts
  pushAgentThought: bus.pushAgentThought.bind(bus),

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

// ═══════════════════════════════════════════════════════════
// FULL AGENCY DEMO — "Build from scratch"
// Starts blank, Main Agent builds the entire agency, then
// every specialist spawns a swarm.
// ═══════════════════════════════════════════════════════════
function runAgencyDemo() {
  const t = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const log = (agentId: string, agentName: string, msg: string, type: 'received' | 'delegated' | 'processing' | 'completed' | 'failed' = 'processing') =>
    bus.pushEvent({ taskId: 'demo', agentId, agentName, type, message: msg });
  const think = (agentId: string, agentName: string, content: string, type: 'thinking' | 'action' | 'result' | 'error' | 'plan' = 'thinking') =>
    bus.pushAgentThought(agentId, agentName, content, type);

  // Agent templates
  const mainAgent = mockAgents.find((a) => a.id === 'main-agent')!;
  const departments = mockAgents.filter((a) => a.type === 'department');
  const specialists = mockAgents.filter((a) => a.type === 'specialist');

  (async () => {
    // ── CLEAR: Start with a blank slate ──
    bus.syncState({
      agents: [],
      tasks: [],
      events: [],
      swarmSessions: [],
      chatMessages: [],
      metrics: { activeTasks: 0, queuedTasks: 0, completedToday: 0, estimatedTokens: 0, estimatedCost: 0, successRate: 0, avgCompletionTime: 0, uptime: 99.97 },
      codexApiUsage: { fiveHourPct: 0, weeklyPct: 0, codexTasks: 0, plan: 'ChatGPT Plus' },
    });

    await t(1200);

    // ─────────────────────────────────────────────
    // PHASE 1 — Main Agent spawns
    // ─────────────────────────────────────────────
    bus.sendChatMessage('🧠 Initializing Main Agent...', { agentName: 'System' });
    bus.addAgent({ ...mainAgent, status: 'thinking', queueCount: 0 });
    log('main-agent', 'Main Agent', 'Booting up — analyzing incoming project', 'received');

    await t(1500);

    bus.updateAgent('main-agent', { status: 'running' });
    bus.sendChatMessage('🚀 I\'m online. Received directive: "Build full product for Q3 launch." Let me spin up the agency.', { agentName: 'Main Agent' });

    bus.submitTask({
      prompt: 'Q3 Product Launch — Full agency deployment',
      status: 'active',
      priority: 'critical',
      agentPath: ['main-agent'],
      currentAgentId: 'main-agent',
    });

    await t(1200);

    // ─────────────────────────────────────────────
    // PHASE 2 — Main Agent creates departments one by one
    // ─────────────────────────────────────────────
    bus.sendChatMessage('Standing up departments...', { agentName: 'Main Agent' });

    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      await t(800);
      bus.addAgent({ ...dept, status: 'idle', queueCount: 0 });
      log('main-agent', 'Main Agent', `Created department: ${dept.name}`, 'delegated');
      bus.sendChatMessage(`📂 **${dept.name}** department online.`, { agentName: 'Main Agent' });
    }

    bus.updateCodexApiUsage({ fiveHourPct: 5, codexTasks: 4 });
    await t(1000);

    // ─────────────────────────────────────────────
    // PHASE 3 — Departments recruit specialists
    // ─────────────────────────────────────────────
    bus.sendChatMessage('Departments are recruiting specialists...', { agentName: 'Main Agent' });

    for (let i = 0; i < specialists.length; i++) {
      const spec = specialists[i];
      await t(600);
      bus.addAgent({ ...spec, status: 'idle', queueCount: 0 });
      const parentDept = departments.find((d) => d.id === spec.parentId);
      log(spec.parentId!, parentDept?.name || 'Department', `Recruited ${spec.name}`, 'processing');
    }

    bus.updateCodexApiUsage({ fiveHourPct: 12, codexTasks: 11 });
    await t(1000);

    // ─────────────────────────────────────────────
    // PHASE 4 — Activate all agents, delegate work
    // ─────────────────────────────────────────────
    bus.sendChatMessage('⚡ All positions filled. Activating the full agency and distributing tasks.', { agentName: 'Main Agent' });

    // Light up departments
    for (const dept of departments) {
      bus.updateAgent(dept.id, { status: 'running', queueCount: 2 });
      await t(300);
    }

    // Light up specialists
    for (const spec of specialists) {
      bus.updateAgent(spec.id, { status: 'running', queueCount: 1 });
      await t(200);
    }

    bus.updateMetrics({ activeTasks: specialists.length });
    bus.updateSystemVitals({ cpu: { percentage: 58, subtitle: 'Apple M4', details: [
      { label: 'user', value: '38.2%' }, { label: 'sys', value: '19.8%' },
      { label: 'idle', value: '42.0%' }, { label: 'cores', value: '10' },
    ]}});
    bus.updateCodexApiUsage({ fiveHourPct: 25, weeklyPct: 8, codexTasks: 18 });

    await t(2000);

    // ─────────────────────────────────────────────
    // PHASE 5 — Every specialist spawns a swarm
    // ─────────────────────────────────────────────
    bus.sendChatMessage('🐝 Workload is massive — every specialist is spawning a swarm!', { agentName: 'Main Agent' });

    const swarmConfigs: Record<string, { command: string; leaderName: string; workers: { name: string; task: string }[] }> = {
      'frontend-spec': {
        command: 'clawteam spawn --ui-build',
        leaderName: 'UI Build Lead',
        workers: [
          { name: 'Component Builder', task: 'Building 14 React components' },
          { name: 'Style Architect', task: 'Implementing design system tokens' },
          { name: 'Animation Dev', task: 'Adding Framer Motion transitions' },
        ],
      },
      'backend-spec': {
        command: 'clawteam spawn --api-build',
        leaderName: 'API Build Lead',
        workers: [
          { name: 'REST Scaffolder', task: 'Generating 8 REST endpoints' },
          { name: 'DB Migrator', task: 'Running schema migrations' },
          { name: 'Auth Builder', task: 'Implementing JWT auth flow' },
        ],
      },
      'qa-spec': {
        command: 'clawteam spawn --test-suite',
        leaderName: 'Test Coordinator',
        workers: [
          { name: 'Unit Tester', task: 'Writing 47 unit tests' },
          { name: 'E2E Runner', task: 'Running Playwright test suite' },
        ],
      },
      'copywriter-spec': {
        command: 'clawteam spawn --content-gen',
        leaderName: 'Content Lead',
        workers: [
          { name: 'Blog Writer', task: 'Drafting 2,000-word launch post' },
          { name: 'Landing Copy', task: 'Writing hero + CTA sections' },
          { name: 'Social Posts', task: 'Creating 30 social media posts' },
        ],
      },
      'seo-spec': {
        command: 'clawteam spawn --seo-audit',
        leaderName: 'SEO Lead',
        workers: [
          { name: 'Keyword Miner', task: 'Analyzing 500 keyword opportunities' },
          { name: 'Meta Generator', task: 'Generating meta tags for 12 pages' },
        ],
      },
      'analyst-spec': {
        command: 'clawteam spawn --data-crunch',
        leaderName: 'Analytics Lead',
        workers: [
          { name: 'Price Analyzer', task: 'Comparing pricing across 8 competitors' },
          { name: 'Trend Mapper', task: 'Mapping market trends Q1-Q3' },
          { name: 'Report Builder', task: 'Generating executive summary PDF' },
        ],
      },
      'scraper-spec': {
        command: 'clawteam spawn --scrape-all',
        leaderName: 'Scrape Coordinator',
        workers: [
          { name: 'Product Scraper', task: 'Extracting data from 5 competitor sites' },
          { name: 'Review Scraper', task: 'Collecting 1,200 user reviews' },
        ],
      },
    };

    // Spawn swarms one specialist at a time
    const swarmIds: { specId: string; sessionId: string; leaderId: string; workerIds: string[] }[] = [];

    for (const spec of specialists) {
      const cfg = swarmConfigs[spec.id];
      if (!cfg) continue;

      await t(700);

      const parentDept = departments.find((d) => d.id === spec.parentId);
      bus.sendChatMessage(`⚡ **${spec.name}** spawning swarm: \`${cfg.command}\``, { agentName: parentDept?.name || 'Department' });
      log(spec.id, spec.name, `Workload critical — spawning swarm`, 'processing');

      const session = bus.startSwarm(spec.id, cfg.command);

      await t(400);

      const leader = bus.spawnSwarmAgent(session.id, {
        name: cfg.leaderName,
        role: 'leader',
        parentId: spec.id,
        status: 'spawning',
        currentTask: 'Initializing...',
      });
      if (!leader) continue;

      await t(300);
      bus.updateSwarmAgent(session.id, leader.id, { status: 'running', currentTask: `Orchestrating ${cfg.workers.length} workers` });

      const workerIds: string[] = [];
      for (const w of cfg.workers) {
        await t(250);
        const worker = bus.spawnSwarmAgent(session.id, {
          name: w.name,
          role: 'worker',
          parentId: leader.id,
          status: 'running',
          currentTask: w.task,
        });
        if (worker) workerIds.push(worker.id);
      }

      swarmIds.push({ specId: spec.id, sessionId: session.id, leaderId: leader.id, workerIds });
    }

    bus.updateSystemVitals({ cpu: { percentage: 92, subtitle: 'Apple M4', details: [
      { label: 'user', value: '64.1%' }, { label: 'sys', value: '27.9%' },
      { label: 'idle', value: '8.0%' }, { label: 'cores', value: '10' },
    ]}});
    bus.updateCodexApiUsage({ fiveHourPct: 68, weeklyPct: 22, codexTasks: 45 });
    bus.updateMetrics({ activeTasks: specialists.length + swarmIds.reduce((s, sw) => s + sw.workerIds.length, 0) });

    bus.sendChatMessage('🐝 **All 7 swarms active.** Agency at full capacity — every specialist has spawned workers.\n\nTotal workers: ' +
      swarmIds.reduce((s, sw) => s + sw.workerIds.length, 0) + ' across ' + swarmIds.length + ' swarms.', { agentName: 'Main Agent' });

    await t(4000);

    // ─────────────────────────────────────────────
    // PHASE 6 — Workers start completing
    // ─────────────────────────────────────────────
    bus.sendChatMessage('✅ Swarm workers starting to report back...', { agentName: 'Main Agent' });

    for (const sw of swarmIds) {
      for (let i = 0; i < sw.workerIds.length; i++) {
        await t(600);
        const session = bus.getState().swarmSessions.find((s) => s.id === sw.sessionId);
        const worker = session?.agents.find((a) => a.id === sw.workerIds[i]);
        if (!worker) continue;

        // Random chance of error (1 in 10)
        const hasError = Math.random() < 0.1;
        if (hasError) {
          bus.updateSwarmAgent(sw.sessionId, worker.id, {
            status: 'error',
            currentTask: 'Failed — rate limited',
            error: '429 Too Many Requests',
          });
          log(sw.specId, specialists.find((s) => s.id === sw.specId)?.name || '', `${worker.name} hit rate limit`, 'failed');
        } else {
          bus.updateSwarmAgent(sw.sessionId, worker.id, {
            status: 'completed',
            currentTask: 'Done ✓',
          });
          log(sw.specId, specialists.find((s) => s.id === sw.specId)?.name || '', `${worker.name} completed`, 'completed');
        }
      }

      // Leader completes
      await t(300);
      bus.updateSwarmAgent(sw.sessionId, sw.leaderId, { status: 'completed', currentTask: 'All workers finished' });
      bus.completeSwarm(sw.sessionId);
    }

    bus.updateCodexApiUsage({ fiveHourPct: 85, weeklyPct: 32, codexTasks: 72 });

    await t(1500);

    // ─────────────────────────────────────────────
    // PHASE 7 — Wrap up
    // ─────────────────────────────────────────────
    for (const spec of specialists) {
      bus.updateAgent(spec.id, { status: 'complete', queueCount: 0 });
    }
    await t(500);
    for (const dept of departments) {
      bus.updateAgent(dept.id, { status: 'idle', queueCount: 0 });
    }
    await t(500);

    bus.updateAgent('main-agent', { status: 'idle', queueCount: 0 });
    bus.updateMetrics({ activeTasks: 0, completedToday: 72 });
    bus.updateSystemVitals({ cpu: { percentage: 28, subtitle: 'Apple M4', details: [
      { label: 'user', value: '14.2%' }, { label: 'sys', value: '13.8%' },
      { label: 'idle', value: '72.0%' }, { label: 'cores', value: '10' },
    ]}});

    bus.sendChatMessage('🎉 **Agency build complete.**\n\n• 1 Main Agent\n• 4 Departments\n• 7 Specialists\n• 7 Swarms spawned (' +
      swarmIds.reduce((s, sw) => s + sw.workerIds.length, 0) + ' total workers)\n• 72 Codex calls\n\nFull Q3 Product Launch delivered.', { agentName: 'Main Agent' });
    log('main-agent', 'Main Agent', 'Agency demo complete — all swarms resolved', 'completed');
  })();
}

// Start demo 1.5s after page loads
setTimeout(runAgencyDemo, 1500);

export { bus, api };
export default bus;
