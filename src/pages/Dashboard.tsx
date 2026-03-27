import { useMissionControl } from '@/hooks/useMissionControl';
import CommandPrompt from '@/components/dashboard/CommandPrompt';
import AgentFlowChart from '@/components/dashboard/AgentFlowChart';
import ExecutionFeed from '@/components/dashboard/ExecutionFeed';
import CompletedTasks from '@/components/dashboard/CompletedTasks';
import AgentDetailDrawer from '@/components/dashboard/AgentDetailDrawer';
import GatewayStatusCard from '@/components/gateway/GatewayStatusCard';
import CodexUsageTracker from '@/components/dashboard/CodexUsageTracker';
import SystemVitals from '@/components/dashboard/SystemVitals';
import CodexApiUsage from '@/components/dashboard/CodexApiUsage';
import { useState } from 'react';
import { Agent, Task } from '@/data/types';

const Dashboard = () => {
  const { agents, tasks, events, metrics, settings, submitTask, toggleSetting } = useMissionControl();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Derive focus path from the most recent active task
  const activeTask = tasks.find((t) => t.status === 'active');
  const focusTaskPath = activeTask?.agentPath || [];

  const handleNodeClick = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
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
      <CodexUsageTracker />
      

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
        <AgentFlowChart
          agents={agents}
          activeTaskPath={focusTaskPath}
          onNodeClick={handleNodeClick}
        />
        <div className="grid grid-rows-2 gap-3 h-[420px]">
          <ExecutionFeed events={events} />
          <CompletedTasks tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      </div>


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
