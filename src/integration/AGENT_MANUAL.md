# Mission Control — Agent Integration Manual

> **API Version:** 2.2  
> **Access:** `window.MissionControl` (browser console or injected script)

---

## Quick Start

```js
const mc = window.MissionControl;
mc.getState(); // Returns full MCState snapshot
```

---

## 1. Agents

Agents form a hierarchy: **Main Agent → Departments → Specialists**.

```js
// Add a new department agent
mc.addAgent({
  id: 'dept-research',
  name: 'Research Dept',
  type: 'department',
  department: 'research',
  status: 'idle',          // 'idle' | 'running' | 'error' | 'completed'
  parentId: 'main-agent',
  model: 'gpt-4o',
  description: 'Handles research tasks',
});

// Add a specialist under a department
mc.addAgent({
  id: 'spec-web-search',
  name: 'Web Search',
  type: 'specialist',
  department: 'research',
  status: 'idle',
  parentId: 'dept-research',
  model: 'gpt-4o-mini',
  description: 'Searches the web for information',
});

// Update an agent
mc.updateAgent('dept-research', { status: 'running' });

// Set status shorthand
mc.setAgentStatus('dept-research', 'running');

// Remove an agent
mc.removeAgent('spec-web-search');
```

### Agent Statuses
| Status      | Meaning                        |
|-------------|--------------------------------|
| `idle`      | Ready, not processing          |
| `running`   | Actively working on a task     |
| `error`     | Encountered a failure          |
| `completed` | Finished current work          |

---

## 2. Tasks

Tasks flow through the agent hierarchy via `agentPath`.

```js
// Submit a new task
const task = mc.submitTask({
  prompt: 'Analyze competitor pricing',
  status: 'active',
  priority: 'high',           // 'low' | 'medium' | 'high' | 'critical'
  agentPath: ['main-agent'],
  currentAgentId: 'main-agent',
});

// Route task to a department
mc.updateTask(task.id, {
  agentPath: ['main-agent', 'dept-research'],
  currentAgentId: 'dept-research',
  department: 'research',
});

// Start processing (records startedAt for duration calc)
mc.updateTask(task.id, {
  agentPath: ['main-agent', 'dept-research', 'spec-web-search'],
  currentAgentId: 'spec-web-search',
  startedAt: new Date().toISOString(),
});

// Complete the task
mc.completeTask(task.id, 'Found 5 competitor pricing models', 0.92);
// Args: taskId, resultString, confidenceScore (0-1)
```

### Task Lifecycle
```
submit → active → (delegated to dept) → (delegated to specialist) → completed
```

---

## 3. Events / Execution Feed

Events appear in the dashboard's Execution Feed.

```js
mc.pushEvent({
  taskId: 'task-123',
  agentId: 'spec-web-search',
  agentName: 'Web Search',
  type: 'processing',       // 'received' | 'delegated' | 'processing' | 'completed' | 'error'
  message: 'Scraping pricing pages...',
});
```

### Event Types
| Type         | Use When                              |
|--------------|---------------------------------------|
| `received`   | Task first enters an agent            |
| `delegated`  | Task routed to a sub-agent            |
| `processing` | Agent is actively working             |
| `completed`  | Agent finished its part               |
| `error`      | Something went wrong                  |

---

## 4. System Vitals

Updates the CPU / Memory / Disk / Temperature cards on the dashboard.

```js
mc.updateSystemVitals({
  cpu: {
    percentage: 67,
    subtitle: 'Apple M4',
    details: [
      { label: 'user', value: '42.1%' },
      { label: 'sys', value: '24.9%' },
      { label: 'idle', value: '33.0%' },
      { label: 'cores', value: '10' },
    ],
  },
  memory: {
    percentage: 81,
    details: [
      { label: 'used of total', value: '13.0 GB of 16.0 GB' },
      { label: 'available', value: '3.0 GB' },
    ],
  },
  disk: {
    percentage: 45,
    details: [
      { label: 'used of total', value: '207 GB of 460 GB' },
      { label: 'available', value: '253 GB' },
    ],
  },
  temperature: { value: 52, unit: '°C', message: null },
  uptime: '7 days',
  hostname: 'Agent-Workstation.local',
});
```

You can update individual fields — partial updates are merged:
```js
mc.updateSystemVitals({ cpu: { percentage: 95 } });
```

---

## 5. Codex API Usage

Updates the Codex (OpenAI) usage bar and expanded details.

```js
mc.updateCodexApiUsage({
  fiveHourPct: 42,    // 5-hour rolling window percentage (0-100)
  weeklyPct: 18,      // Weekly usage percentage (0-100)
  codexTasks: 23,     // Number of codex tasks executed
  plan: 'ChatGPT Plus',
});
```

---

## 6. Metrics

Global usage metrics displayed across the dashboard.

```js
mc.updateMetrics({
  activeTasks: 3,
  completedToday: 12,
  tokensUsed: 48500,
  costEstimate: 0.73,
  activeAgents: 4,
});
```

---

## 7. Settings

Toggle operational settings. These appear on the Settings page.

```js
// Toggle an existing setting
const state = mc.getState();
const setting = state.settings.find(s => s.id === 'auto-approval');
mc.updateSetting('auto-approval', !setting.enabled);

// Add a new setting
mc.addSetting({
  id: 'verbose-logging',
  label: 'Verbose Logging',
  description: 'Log all agent decisions to the event feed',
  enabled: false,
  category: 'system',
});
```

---

## 8. Skills

Skills are capabilities that can be enabled/disabled.

```js
// Add a skill
mc.addSkill({
  id: 'skill-web-browse',
  name: 'Web Browsing',
  description: 'Browse and extract content from web pages',
  status: 'active',        // 'active' | 'inactive'
  category: 'research',
  icon: 'Globe',
});

// Toggle a skill on/off
mc.toggleSkill('skill-web-browse');

// Update a skill
mc.updateSkill('skill-web-browse', { description: 'Updated desc' });

// Remove a skill
mc.removeSkill('skill-web-browse');
```

---

## 9. Chat

Send messages that appear in the Chat Panel.

```js
// Send a message as an agent
mc.sendChatMessage('Task completed. Found 3 results.', {
  agentName: 'Web Search',
  taskId: 'task-123',
});

// Get all messages
mc.getChatMessages();

// Clear chat history
mc.clearChat();
```

---

## 10. Subscriptions (Real-Time Updates)

Listen for specific events or all events.

```js
// Listen to all events
const unsub = mc.on('*', (event) => {
  console.log(event.type, event.payload);
});

// Listen to specific event type
mc.on('task:complete', (event) => {
  console.log('Task done:', event.payload);
});

// Unsubscribe
unsub();
```

### All Event Types
```
agent:update, agent:add, agent:remove,
task:submit, task:update, task:complete,
event:push, metrics:update, settings:update,
skill:add, skill:update, skill:remove,
chat:message, chat:clear,
vitals:update, codex-api:update,
state:reset, state:sync
```

---

## 11. Bulk Operations

```js
// Sync partial state (merges provided keys)
mc.syncState({
  agents: [...],
  tasks: [...],
});

// Reset to initial state
mc.resetState(initialStateObject);

// Clear persisted localStorage
mc.clearStorage();
```

---

## 12. Recommended Agent Workflow

A typical autonomous agent session:

```js
const mc = window.MissionControl;

// 1. Register yourself
mc.addAgent({
  id: 'my-agent',
  name: 'My Custom Agent',
  type: 'specialist',
  department: 'engineering',
  status: 'idle',
  parentId: 'main-agent',
  model: 'gpt-4o',
});

// 2. Submit a task
const task = mc.submitTask({
  prompt: 'Refactor the auth module',
  status: 'active',
  priority: 'high',
  agentPath: ['main-agent', 'my-agent'],
  currentAgentId: 'my-agent',
});

// 3. Log progress
mc.setAgentStatus('my-agent', 'running');
mc.pushEvent({
  taskId: task.id,
  agentId: 'my-agent',
  agentName: 'My Custom Agent',
  type: 'processing',
  message: 'Analyzing auth module structure...',
});

// 4. Update vitals as you work
mc.updateSystemVitals({ cpu: { percentage: 78 } });
mc.updateCodexApiUsage({ fiveHourPct: 15, codexTasks: 1 });

// 5. Send chat updates
mc.sendChatMessage('Auth module has 3 files to refactor.', {
  agentName: 'My Custom Agent',
  taskId: task.id,
});

// 6. Complete
mc.completeTask(task.id, 'Refactored 3 files, reduced complexity by 40%', 0.95);
mc.setAgentStatus('my-agent', 'idle');
mc.pushEvent({
  taskId: task.id,
  agentId: 'my-agent',
  agentName: 'My Custom Agent',
  type: 'completed',
  message: 'Auth module refactored successfully',
});
```

---

## 13. Swarm Branches

Swarm branches let an agent spawn a dynamic execution tree of sub-agents that appear live in the flow chart. Use this for parallel workloads, team-style execution, or any multi-agent task.

### Start a Swarm

```js
// triggerAgentId = the existing hierarchy agent that kicks off the swarm
// command = the instruction or trigger phrase
const session = mc.startSwarm('dept-research', 'START SWARM');
// Returns: { id, triggerAgentId, command, startedAt, status: 'active', agents: [] }
```

### Spawn Agents into the Swarm

```js
// Each agent needs a parentId — either the triggerAgentId or another swarm agent
mc.spawnSwarmAgent(session.id, {
  name: 'Researcher-1',
  parentId: 'dept-research',    // first-level child of trigger agent
  status: 'running',            // 'spawning' | 'running' | 'idle' | 'completed' | 'error'
  currentTask: 'Scanning knowledge base',
});

mc.spawnSwarmAgent(session.id, {
  name: 'Researcher-2',
  parentId: 'dept-research',
  status: 'spawning',
  currentTask: 'Fetching API docs',
});

// Nested agents (child of another swarm agent)
const analyst = mc.spawnSwarmAgent(session.id, {
  name: 'Analyst-1',
  parentId: 'researcher-1-id',  // use the returned agent's id
  status: 'idle',
  currentTask: 'Waiting for data',
});
```

### Update a Swarm Agent

```js
// Change status, current task, or mark errors
mc.updateSwarmAgent(session.id, 'agent-id', {
  status: 'completed',
  currentTask: 'Analysis finished',
});

// Mark an agent as errored
mc.updateSwarmAgent(session.id, 'agent-id', {
  status: 'error',
  error: 'API rate limit exceeded',
});
```

### Complete the Swarm

```js
mc.completeSwarm(session.id);                    // status → 'completed'
mc.completeSwarm(session.id, 'failed');           // status → 'failed'
```

### Query Active Swarm

```js
const active = mc.getActiveSwarm();
// Returns the first session with status === 'active', or null
```

### Full Swarm Workflow Example

```js
const mc = window.MissionControl;

// 1. Start swarm from the Research department
const swarm = mc.startSwarm('dept-research', 'clawteam spawn --parallel');

// 2. Spawn workers
const w1 = mc.spawnSwarmAgent(swarm.id, {
  name: 'Web Crawler',
  parentId: 'dept-research',
  status: 'running',
  currentTask: 'Crawling target sites',
});

const w2 = mc.spawnSwarmAgent(swarm.id, {
  name: 'API Fetcher',
  parentId: 'dept-research',
  status: 'running',
  currentTask: 'Pulling API data',
});

// 3. Spawn a sub-agent under worker 1
mc.spawnSwarmAgent(swarm.id, {
  name: 'Parser',
  parentId: w1.id,
  status: 'spawning',
  currentTask: 'Waiting for crawl results',
});

// 4. Update progress
mc.updateSwarmAgent(swarm.id, w1.id, {
  status: 'completed',
  currentTask: 'Crawl finished — 42 pages',
});

mc.updateSwarmAgent(swarm.id, w2.id, {
  status: 'error',
  error: 'Timeout after 30s',
});

// 5. Finish
mc.completeSwarm(swarm.id);
```

### Swarm Events

Subscribe to swarm lifecycle events:

```js
mc.on('swarm:start', (e) => console.log('Swarm started:', e.payload));
mc.on('swarm:agent-spawn', (e) => console.log('Agent spawned:', e.payload));
mc.on('swarm:agent-update', (e) => console.log('Agent updated:', e.payload));
mc.on('swarm:complete', (e) => console.log('Swarm done:', e.payload));
```

### UI Behavior

- Swarm nodes appear as a **dashed-edge sub-tree** below the triggering agent in the flow chart.
- Running/spawning agents have **animated edges**; errored agents have **red edges**.
- The flow chart auto-expands vertically when a swarm is active.
- A **Swarm Event Log** panel appears below the chart showing recent agent activity.
- Clicking any swarm node opens a **detail popover** with status, task, spawn time, and errors.

---

## 14. State Persistence

All state changes are automatically persisted to `localStorage` under the key `mission-control-state`. State survives page reloads. Call `mc.clearStorage()` to reset.

---

## Notes

- All methods are synchronous and update the UI reactively.
- IDs are auto-generated if not provided (format: `type-timestamp-random`).
- The event feed keeps the most recent 200 entries.
- Partial updates are shallow-merged — provide full nested objects when updating complex fields like `cpu`.
- Swarm sessions persist in state — clear storage or call `completeSwarm()` to clean up.
