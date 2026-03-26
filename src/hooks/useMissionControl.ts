import { useState, useEffect, useCallback, useRef } from 'react';
import bus from '@/integration';
import { MCState, MCEventType } from '@/integration/MissionControlBus';

/**
 * React hook that subscribes to Mission Control bus state.
 * Re-renders when any event fires (or specific event types).
 */
export function useMissionControl(listenTo: MCEventType | '*' = '*') {
  const [state, setState] = useState<MCState>(bus.getState());
  const stateRef = useRef(state);

  useEffect(() => {
    const unsub = bus.on(listenTo, () => {
      const next = bus.getState();
      stateRef.current = next;
      setState(next);
    });
    return unsub;
  }, [listenTo]);

  const submitTask = useCallback((prompt: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const task = bus.submitTask({
      prompt,
      status: 'active',
      priority,
      agentPath: ['main-agent'],
      currentAgentId: 'main-agent',
    });

    bus.pushEvent({
      taskId: task.id,
      agentId: 'main-agent',
      agentName: 'Main Agent',
      type: 'received',
      message: `New task: ${prompt.slice(0, 80)}`,
    });

    // Simulate delegation
    const agents = bus.getState().agents;
    const depts = agents.filter((a) => a.type === 'department');

    setTimeout(() => {
      const dept = depts[Math.floor(Math.random() * depts.length)];
      if (!dept) return;
      bus.updateTask(task.id, {
        agentPath: ['main-agent', dept.id],
        currentAgentId: dept.id,
        department: dept.department,
      });
      bus.setAgentStatus(dept.id, 'running');
      bus.pushEvent({
        taskId: task.id,
        agentId: dept.id,
        agentName: dept.name,
        type: 'delegated',
        message: `Task routed to ${dept.name}`,
      });

      setTimeout(() => {
        const specs = agents.filter((a) => a.parentId === dept.id);
        const spec = specs[Math.floor(Math.random() * specs.length)];
        if (!spec) return;
        bus.updateTask(task.id, {
          agentPath: ['main-agent', dept.id, spec.id],
          currentAgentId: spec.id,
          startedAt: new Date().toISOString(),
        });
        bus.setAgentStatus(spec.id, 'running');
        bus.pushEvent({
          taskId: task.id,
          agentId: spec.id,
          agentName: spec.name,
          type: 'processing',
          message: `Processing task...`,
        });
      }, 1500);
    }, 1500);

    return task;
  }, []);

  const toggleSetting = useCallback((id: string) => {
    const current = bus.getState().settings.find((s) => s.id === id);
    if (current) bus.updateSetting(id, !current.enabled);
  }, []);

  return {
    ...state,
    submitTask,
    toggleSetting,
    bus,
  };
}
