import { useMissionControl } from '@/hooks/useMissionControl';
import CommandPrompt from '@/components/dashboard/CommandPrompt';
import AgentFlowChart from '@/components/dashboard/AgentFlowChart';
import ExecutionFeed from '@/components/dashboard/ExecutionFeed';
import CompletedTasks from '@/components/dashboard/CompletedTasks';
import AgentDetailDrawer from '@/components/dashboard/AgentDetailDrawer';
import GatewayStatusCard from '@/components/gateway/GatewayStatusCard';
import SystemVitals from '@/components/dashboard/SystemVitals';
import CodexApiUsage from '@/components/dashboard/CodexApiUsage';
import SwarmEventLog from '@/components/dashboard/SwarmEventLog';
import { useState } from 'react';
import { Agent, Task, SwarmAgent } from '@/data/types';

const Dashboard = () => {
  const { agents, tasks, events, metrics, settings, swarmSessions, submitTask, toggleSetting } = useMissionControl();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSwarmAgent, setSelectedSwarmAgent] = useState<{ sessionId: string; agent: SwarmAgent } | null>(null);

  const activeTask = tasks.find((t) => t.status === 'active');
  const focusTaskPath = activeTask?.agentPath || [];
  const activeSwarm = swarmSessions?.find((s) => s.status === 'active');

  const handleNodeClick = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
  };

  const handleSwarmNodeClick = (sessionId: string, agentId: string) => {
    const session = swarmSessions?.find((s) => s.id === sessionId);
    const agent = session?.agents.find((a) => a.id === agentId);
    if (session && agent) setSelectedSwarmAgent({ sessionId, agent });
  };

  const handleTaskClick = (task: Task) => {
    if (task.currentAgentId) {
      const agent = agents.find((a) => a.id === task.currentAgentId);
      if (agent) setSelectedAgent(agent);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3">
        <CommandPrompt onSubmit={(prompt) => submitTask(prompt)} />
        <GatewayStatusCard />
      </div>
      <SystemVitals />
      <CodexApiUsage />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
        <div className="space-y-3">
          <AgentFlowChart
            agents={agents}
            activeTaskPath={focusTaskPath}
            swarmSessions={swarmSessions || []}
            onNodeClick={handleNodeClick}
            onSwarmNodeClick={handleSwarmNodeClick}
          />
          {activeSwarm && <SwarmEventLog session={activeSwarm} />}
        </div>
        <div className="grid grid-rows-2 gap-3 h-[420px]">
          <ExecutionFeed events={events} />
          <CompletedTasks tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      </div>

      {/* Swarm agent detail popover */}
      {selectedSwarmAgent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={() => setSelectedSwarmAgent(null)}
          />
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-[320px] glass-panel-strong p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{selectedSwarmAgent.agent.name}</h3>
              <button onClick={() => setSelectedSwarmAgent(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize text-foreground">{selectedSwarmAgent.agent.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Task</span>
                <span className="font-medium text-foreground text-right max-w-[180px] truncate">{selectedSwarmAgent.agent.currentTask || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spawned</span>
                <span className="font-mono text-foreground">{new Date(selectedSwarmAgent.agent.spawnedAt).toLocaleTimeString()}</span>
              </div>
              {selectedSwarmAgent.agent.error && (
                <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                  {selectedSwarmAgent.agent.error}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          />
          <AgentDetailDrawer
            agent={selectedAgent}
            tasks={tasks}
            onClose={() => setSelectedAgent(null)}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
