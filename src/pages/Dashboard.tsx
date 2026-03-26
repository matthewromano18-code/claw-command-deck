import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import CommandPrompt from '@/components/dashboard/CommandPrompt';
import UsageBar from '@/components/dashboard/UsageBar';
import QuickSettings from '@/components/dashboard/QuickSettings';
import AgentFlowChart from '@/components/dashboard/AgentFlowChart';
import ExecutionFeed from '@/components/dashboard/ExecutionFeed';
import CompletedTasks from '@/components/dashboard/CompletedTasks';
import AgentDetailDrawer from '@/components/dashboard/AgentDetailDrawer';
import { mockAgents, mockTasks, mockEvents, mockMetrics, mockSettings } from '@/data/mockData';
import { Agent, Task, TaskEvent, SettingToggle } from '@/data/types';

const Dashboard = () => {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [events, setEvents] = useState<TaskEvent[]>(mockEvents);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [settings, setSettings] = useState<SettingToggle[]>(mockSettings);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [focusTaskPath, setFocusTaskPath] = useState<string[]>(['main-agent', 'dev-dept', 'frontend-spec']);

  const handleSubmitTask = useCallback((prompt: string) => {
    const newTaskId = `task-${Date.now()}`;
    const now = new Date().toISOString();

    const newTask: Task = {
      id: newTaskId,
      prompt,
      status: 'active',
      priority: 'medium',
      createdAt: now,
      startedAt: now,
      agentPath: ['main-agent'],
      currentAgentId: 'main-agent',
    };
    setTasks((prev) => [newTask, ...prev]);

    const newEvent: TaskEvent = {
      id: `evt-${Date.now()}`,
      taskId: newTaskId,
      agentId: 'main-agent',
      agentName: 'Main Agent',
      type: 'received',
      message: `New task received: ${prompt.slice(0, 60)}...`,
      timestamp: now,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setMetrics((prev) => ({ ...prev, activeTasks: prev.activeTasks + 1 }));

    // Simulate delegation after 1.5s
    setTimeout(() => {
      const depts = agents.filter((a) => a.type === 'department');
      const randomDept = depts[Math.floor(Math.random() * depts.length)];
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTaskId
            ? { ...t, agentPath: ['main-agent', randomDept.id], currentAgentId: randomDept.id, department: randomDept.department }
            : t
        )
      );
      setFocusTaskPath(['main-agent', randomDept.id]);
      setEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          taskId: newTaskId,
          agentId: randomDept.id,
          agentName: randomDept.name,
          type: 'delegated',
          message: `Task routed to ${randomDept.name}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Simulate specialist assignment after 3s
      setTimeout(() => {
        const specs = agents.filter((a) => a.parentId === randomDept.id);
        if (specs.length > 0) {
          const randomSpec = specs[Math.floor(Math.random() * specs.length)];
          setTasks((prev) =>
            prev.map((t) =>
              t.id === newTaskId
                ? { ...t, agentPath: ['main-agent', randomDept.id, randomSpec.id], currentAgentId: randomSpec.id }
                : t
            )
          );
          setFocusTaskPath(['main-agent', randomDept.id, randomSpec.id]);
          setEvents((prev) => [
            {
              id: `evt-${Date.now()}`,
              taskId: newTaskId,
              agentId: randomSpec.id,
              agentName: randomSpec.name,
              type: 'processing',
              message: `Processing task...`,
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }, 1500);
    }, 1500);
  }, [agents]);

  const handleToggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

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
      <CommandPrompt onSubmit={handleSubmitTask} />
      <UsageBar metrics={metrics} />
      <QuickSettings settings={settings} onToggle={handleToggleSetting} />

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
