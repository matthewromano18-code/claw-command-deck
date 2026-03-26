import MissionControlBus from './MissionControlBus';
import { mockAgents, mockTasks, mockEvents, mockMetrics, mockSettings } from '@/data/mockData';

// ─── Singleton Bus Instance ────────────────────────────────
const bus = new MissionControlBus({
  agents: mockAgents,
  tasks: mockTasks,
  events: mockEvents,
  metrics: mockMetrics,
  settings: mockSettings,
});

// ─── Expose on Window for External Agent Access ────────────
// OpenClaw or any agent can call: window.MissionControl.submitTask(...)
interface MissionControlAPI {
  // State
  getState: typeof bus.getState;

  // Agents
  addAgent: typeof bus.addAgent;
  updateAgent: typeof bus.updateAgent;
  removeAgent: typeof bus.removeAgent;
  setAgentStatus: typeof bus.setAgentStatus;

  // Tasks
  submitTask: typeof bus.submitTask;
  updateTask: typeof bus.updateTask;
  completeTask: typeof bus.completeTask;

  // Events
  pushEvent: typeof bus.pushEvent;

  // Metrics
  updateMetrics: typeof bus.updateMetrics;

  // Settings
  updateSetting: typeof bus.updateSetting;
  addSetting: typeof bus.addSetting;

  // Bulk
  syncState: typeof bus.syncState;
  resetState: typeof bus.resetState;
  clearStorage: typeof bus.clearStorage;

  // Events
  on: typeof bus.on;

  // Version
  version: string;
}

const api: MissionControlAPI = {
  getState: bus.getState.bind(bus),
  addAgent: bus.addAgent.bind(bus),
  updateAgent: bus.updateAgent.bind(bus),
  removeAgent: bus.removeAgent.bind(bus),
  setAgentStatus: bus.setAgentStatus.bind(bus),
  submitTask: bus.submitTask.bind(bus),
  updateTask: bus.updateTask.bind(bus),
  completeTask: bus.completeTask.bind(bus),
  pushEvent: bus.pushEvent.bind(bus),
  updateMetrics: bus.updateMetrics.bind(bus),
  updateSetting: bus.updateSetting.bind(bus),
  addSetting: bus.addSetting.bind(bus),
  syncState: bus.syncState.bind(bus),
  resetState: bus.resetState.bind(bus),
  clearStorage: bus.clearStorage.bind(bus),
  on: bus.on.bind(bus),
  version: '1.0.0',
};

// Attach to window
(window as any).MissionControl = api;

// Log availability
console.log(
  '%c🚀 Mission Control API available at window.MissionControl',
  'color: hsl(175, 70%, 50%); font-weight: bold; font-size: 12px;'
);

export { bus, api };
export default bus;
