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

// ═══════════════════════════════════════════════════════════
// FULL AGENCY DEMO — "Wednesday morning, all hands on deck"
// ═══════════════════════════════════════════════════════════
function runAgencyDemo() {
  const t = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const log = (agentId: string, agentName: string, msg: string, type: 'received' | 'delegated' | 'processing' | 'completed' | 'error' = 'processing') =>
    bus.pushEvent({ agentId, agentName, type, message: msg });

  const findSwarmAgent = (sessionId: string, name: string) =>
    bus.getState().swarmSessions.find((s) => s.id === sessionId)?.agents.find((a) => a.name === name);

  (async () => {
    // ─────────────────────────────────────────────
    // PHASE 1 — Main Agent receives a big project
    // ─────────────────────────────────────────────
    await t(800);

    bus.sendChatMessage('🚀 New project incoming: Full product launch for Q3. Spinning up all departments.', { agentName: 'Main Agent' });
    log('main-agent', 'Main Agent', 'Received project: Q3 Product Launch — delegating to all departments', 'received');

    const masterTask = bus.submitTask({
      prompt: 'Q3 Product Launch — Full agency deployment',
      status: 'active',
      priority: 'critical',
      agentPath: ['main-agent'],
      currentAgentId: 'main-agent',
    });

    bus.updateAgent('main-agent', { status: 'running', queueCount: 4 });

    await t(1200);

    // ─────────────────────────────────────────────
    // PHASE 2 — Delegate to ALL departments
    // ─────────────────────────────────────────────
    bus.sendChatMessage('Routing tasks: Engineering → build product, Content → launch copy, Research → competitor intel, Operations → deploy pipeline.', { agentName: 'Main Agent' });

    // Engineering
    bus.updateAgent('dev-dept', { status: 'running', queueCount: 3 });
    log('dev-dept', 'Engineering', 'Received: Build and ship the product', 'received');
    const engTask = bus.submitTask({ prompt: 'Build product frontend + backend + tests', status: 'active', priority: 'critical', agentPath: ['main-agent', 'dev-dept'], currentAgentId: 'dev-dept', department: 'Engineering' });

    await t(400);

    // Content
    bus.updateAgent('content-dept', { status: 'running', queueCount: 2 });
    log('content-dept', 'Content', 'Received: Create all launch materials', 'received');
    bus.submitTask({ prompt: 'Write launch blog, landing page copy, social posts', status: 'active', priority: 'high', agentPath: ['main-agent', 'content-dept'], currentAgentId: 'content-dept', department: 'Content' });

    await t(400);

    // Research
    bus.updateAgent('research-dept', { status: 'running', queueCount: 2 });
    log('research-dept', 'Research', 'Received: Competitive analysis for launch positioning', 'received');
    bus.submitTask({ prompt: 'Analyze competitor products and pricing', status: 'active', priority: 'high', agentPath: ['main-agent', 'research-dept'], currentAgentId: 'research-dept', department: 'Research' });

    await t(400);

    // Operations
    bus.updateAgent('ops-dept', { status: 'running', queueCount: 1 });
    log('ops-dept', 'Operations', 'Received: Set up CI/CD and monitoring', 'received');
    bus.submitTask({ prompt: 'Configure deployment pipeline and alerts', status: 'active', priority: 'medium', agentPath: ['main-agent', 'ops-dept'], currentAgentId: 'ops-dept', department: 'Operations' });

    bus.updateMetrics({ activeTasks: 5 });
    bus.updateCodexApiUsage({ fiveHourPct: 12, codexTasks: 5 });

    await t(1000);

    // ─────────────────────────────────────────────
    // PHASE 3 — Departments delegate to specialists
    // ─────────────────────────────────────────────
    bus.sendChatMessage('All departments online. Specialists spinning up...', { agentName: 'Main Agent' });

    // Engineering → specialists
    bus.updateAgent('frontend-spec', { status: 'running', queueCount: 2 });
    log('frontend-spec', 'Frontend Dev', 'Building React components for product dashboard', 'processing');
    bus.updateAgent('backend-spec', { status: 'running', queueCount: 1 });
    log('backend-spec', 'Backend Dev', 'Setting up API routes and database schema', 'processing');
    bus.updateAgent('qa-spec', { status: 'thinking', queueCount: 1 });
    log('qa-spec', 'QA Agent', 'Preparing test suites, waiting for code', 'processing');

    await t(600);

    // Content → specialists
    bus.updateAgent('copywriter-spec', { status: 'running', queueCount: 2 });
    log('copywriter-spec', 'Copywriter', 'Drafting launch blog post and hero copy', 'processing');
    bus.updateAgent('seo-spec', { status: 'running', queueCount: 1 });
    log('seo-spec', 'SEO Specialist', 'Keyword research for launch landing page', 'processing');

    await t(600);

    // Research → specialists
    bus.updateAgent('analyst-spec', { status: 'running', queueCount: 1 });
    log('analyst-spec', 'Data Analyst', 'Pulling competitor pricing data from 12 sources', 'processing');
    bus.updateAgent('scraper-spec', { status: 'running', queueCount: 1 });
    log('scraper-spec', 'Web Scraper', 'Scraping product pages from 5 competitors', 'processing');

    bus.updateSystemVitals({ cpu: { percentage: 68, subtitle: 'Apple M4', details: [
      { label: 'user', value: '45.2%' }, { label: 'sys', value: '22.8%' },
      { label: 'idle', value: '32.0%' }, { label: 'cores', value: '10' },
    ]}});
    bus.updateCodexApiUsage({ fiveHourPct: 28, weeklyPct: 8, codexTasks: 12 });

    await t(1500);

    // ─────────────────────────────────────────────
    // PHASE 4 — Engineering spawns a SWARM
    // ─────────────────────────────────────────────
    bus.sendChatMessage('⚡ Engineering is spawning a build swarm — too much code to handle alone.', { agentName: 'Engineering' });
    log('dev-dept', 'Engineering', 'Workload critical — initiating swarm: clawteam spawn', 'processing');

    const engSwarm = bus.startSwarm('dev-dept', 'clawteam spawn --build');

    await t(600);

    const buildLeader = bus.spawnSwarmAgent(engSwarm.id, {
      name: 'Build Coordinator',
      role: 'leader',
      parentId: 'dev-dept',
      status: 'running',
      currentTask: 'Orchestrating parallel build',
    });
    if (!buildLeader) return;

    await t(700);

    bus.spawnSwarmAgent(engSwarm.id, {
      name: 'Component Builder',
      role: 'worker',
      parentId: buildLeader.id,
      status: 'running',
      currentTask: 'Building 14 React components',
    });

    await t(500);

    bus.spawnSwarmAgent(engSwarm.id, {
      name: 'API Scaffolder',
      role: 'worker',
      parentId: buildLeader.id,
      status: 'running',
      currentTask: 'Generating 8 REST endpoints',
    });

    await t(500);

    bus.spawnSwarmAgent(engSwarm.id, {
      name: 'DB Migrator',
      role: 'worker',
      parentId: buildLeader.id,
      status: 'running',
      currentTask: 'Running schema migrations',
    });

    bus.updateSystemVitals({ cpu: { percentage: 82, subtitle: 'Apple M4', details: [
      { label: 'user', value: '58.1%' }, { label: 'sys', value: '24.3%' },
      { label: 'idle', value: '17.6%' }, { label: 'cores', value: '10' },
    ]}});

    await t(2000);

    // ─────────────────────────────────────────────
    // PHASE 5 — Research spawns a SWARM
    // ─────────────────────────────────────────────
    bus.sendChatMessage('🔍 Research needs more firepower — spawning data collection swarm.', { agentName: 'Research' });
    log('research-dept', 'Research', 'Spawning parallel scraping swarm', 'processing');

    const researchSwarm = bus.startSwarm('research-dept', 'clawteam spawn --scrape');

    await t(600);

    const scrapeLeader = bus.spawnSwarmAgent(researchSwarm.id, {
      name: 'Scrape Coordinator',
      role: 'leader',
      parentId: 'research-dept',
      status: 'running',
      currentTask: 'Distributing scrape targets',
    });
    if (!scrapeLeader) return;

    await t(600);

    bus.spawnSwarmAgent(researchSwarm.id, {
      name: 'Price Scraper',
      role: 'worker',
      parentId: scrapeLeader.id,
      status: 'running',
      currentTask: 'Extracting pricing from 5 sites',
    });

    await t(400);

    bus.spawnSwarmAgent(researchSwarm.id, {
      name: 'Feature Scraper',
      role: 'worker',
      parentId: scrapeLeader.id,
      status: 'running',
      currentTask: 'Comparing feature matrices',
    });

    bus.updateCodexApiUsage({ fiveHourPct: 52, weeklyPct: 18, codexTasks: 24 });

    await t(2500);

    // ─────────────────────────────────────────────
    // PHASE 6 — Workers start completing
    // ─────────────────────────────────────────────
    bus.sendChatMessage('✅ Build swarm workers reporting back...', { agentName: 'Engineering' });

    // Engineering swarm results
    const engSession = () => bus.getState().swarmSessions.find((s) => s.id === engSwarm.id);

    const dbMigrator = engSession()?.agents.find((a) => a.name === 'DB Migrator');
    if (dbMigrator) {
      bus.updateSwarmAgent(engSwarm.id, dbMigrator.id, { status: 'completed', currentTask: '6 migrations applied' });
      log('dev-dept', 'Engineering', 'DB Migrator: 6 migrations applied successfully', 'completed');
    }

    await t(1200);

    const apiScaffolder = engSession()?.agents.find((a) => a.name === 'API Scaffolder');
    if (apiScaffolder) {
      bus.updateSwarmAgent(engSwarm.id, apiScaffolder.id, { status: 'completed', currentTask: '8 endpoints ready' });
      log('dev-dept', 'Engineering', 'API Scaffolder: 8 REST endpoints generated', 'completed');
    }

    await t(1000);

    const componentBuilder = engSession()?.agents.find((a) => a.name === 'Component Builder');
    if (componentBuilder) {
      bus.updateSwarmAgent(engSwarm.id, componentBuilder.id, { status: 'completed', currentTask: '14 components built' });
      log('dev-dept', 'Engineering', 'Component Builder: 14 React components ready', 'completed');
    }

    await t(600);

    bus.updateSwarmAgent(engSwarm.id, buildLeader.id, { status: 'completed', currentTask: 'Build complete — all workers done' });
    bus.completeSwarm(engSwarm.id);

    // QA kicks in
    bus.updateAgent('qa-spec', { status: 'running' });
    log('qa-spec', 'QA Agent', 'Running full test suite against build output', 'processing');

    await t(1500);

    // ─────────────────────────────────────────────
    // PHASE 7 — Research swarm finishes (one error)
    // ─────────────────────────────────────────────
    const resSession = () => bus.getState().swarmSessions.find((s) => s.id === researchSwarm.id);

    const priceScraper = resSession()?.agents.find((a) => a.name === 'Price Scraper');
    if (priceScraper) {
      bus.updateSwarmAgent(researchSwarm.id, priceScraper.id, { status: 'completed', currentTask: 'Pricing data collected' });
    }

    await t(800);

    const featureScraper = resSession()?.agents.find((a) => a.name === 'Feature Scraper');
    if (featureScraper) {
      bus.updateSwarmAgent(researchSwarm.id, featureScraper.id, { status: 'error', currentTask: 'Rate limited on 2 sites', error: '429 Too Many Requests — competitor-a.com' });
      log('research-dept', 'Research', 'Feature Scraper hit rate limit on competitor-a.com', 'error');
    }

    await t(600);

    bus.updateSwarmAgent(researchSwarm.id, scrapeLeader!.id, { status: 'completed', currentTask: 'Partial results — 1 worker failed' });
    bus.completeSwarm(researchSwarm.id, 'completed');

    await t(1500);

    // ─────────────────────────────────────────────
    // PHASE 8 — Content finishes, specialists wrap up
    // ─────────────────────────────────────────────
    bus.sendChatMessage('📝 Content team delivering launch materials.', { agentName: 'Content' });

    bus.updateAgent('copywriter-spec', { status: 'complete', queueCount: 0 });
    log('copywriter-spec', 'Copywriter', 'Launch blog + hero copy delivered', 'completed');

    await t(600);

    bus.updateAgent('seo-spec', { status: 'complete', queueCount: 0 });
    log('seo-spec', 'SEO Specialist', 'Keywords mapped, meta tags generated', 'completed');
    bus.updateAgent('content-dept', { status: 'idle', queueCount: 0 });

    await t(800);

    // Research specialists finish
    bus.updateAgent('analyst-spec', { status: 'complete', queueCount: 0 });
    log('analyst-spec', 'Data Analyst', 'Competitor report ready — 3 key insights', 'completed');
    bus.updateAgent('scraper-spec', { status: 'complete', queueCount: 0 });
    bus.updateAgent('research-dept', { status: 'idle', queueCount: 0 });

    await t(800);

    // QA finishes
    bus.updateAgent('qa-spec', { status: 'complete', queueCount: 0 });
    log('qa-spec', 'QA Agent', '47 tests passed, 2 warnings', 'completed');

    // Engineering wraps
    bus.updateAgent('frontend-spec', { status: 'complete', queueCount: 0 });
    bus.updateAgent('backend-spec', { status: 'complete', queueCount: 0 });
    bus.updateAgent('dev-dept', { status: 'idle', queueCount: 0 });

    await t(600);

    // Ops finishes
    bus.updateAgent('ops-dept', { status: 'idle', queueCount: 0 });
    log('ops-dept', 'Operations', 'CI/CD pipeline configured, monitoring active', 'completed');

    await t(800);

    // ─────────────────────────────────────────────
    // PHASE 9 — Main Agent wraps up
    // ─────────────────────────────────────────────
    bus.updateMetrics({ activeTasks: 0, completedToday: 12 });
    bus.updateCodexApiUsage({ fiveHourPct: 71, weeklyPct: 24, codexTasks: 38 });
    bus.updateSystemVitals({ cpu: { percentage: 35, subtitle: 'Apple M4', details: [
      { label: 'user', value: '18.4%' }, { label: 'sys', value: '16.6%' },
      { label: 'idle', value: '65.0%' }, { label: 'cores', value: '10' },
    ]}});

    bus.updateAgent('main-agent', { status: 'idle', queueCount: 0 });
    bus.sendChatMessage('🎉 Q3 Product Launch — all tasks complete.\n\n• **Engineering**: Product built, 14 components + 8 APIs\n• **Content**: Blog, landing page, and social ready\n• **Research**: Competitor intel gathered (1 partial failure)\n• **Operations**: Pipeline deployed\n\n2 swarms used, 38 Codex calls, 0 critical failures.', { agentName: 'Main Agent' });
    log('main-agent', 'Main Agent', 'Project complete: Q3 Product Launch delivered', 'completed');
  })();
}

// Start demo 1s after page loads
setTimeout(runAgencyDemo, 1000);

export { bus, api };
export default bus;
