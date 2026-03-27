import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Agent } from '@/data/types';
import { Plus, Pencil, Trash2, Network } from 'lucide-react';
import AgentThoughtStream from '@/components/agents/AgentThoughtStream';
import bus from '@/integration';

const statusColors: Record<string, string> = {
  idle: 'bg-muted-foreground/20 text-muted-foreground',
  thinking: 'bg-warning/20 text-warning',
  running: 'bg-primary/20 text-primary',
  waiting: 'bg-info/20 text-info',
  blocked: 'bg-destructive/20 text-destructive',
  complete: 'bg-success/20 text-success',
  failed: 'bg-destructive/20 text-destructive',
};

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>(bus.getState().agents);
  const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set());

  // Live-sync agents from bus
  useEffect(() => {
    const unsubs = [
      bus.on('agent:add', () => setAgents([...bus.getState().agents])),
      bus.on('agent:update', () => setAgents([...bus.getState().agents])),
      bus.on('agent:remove', () => setAgents([...bus.getState().agents])),
      bus.on('state:sync', () => setAgents([...bus.getState().agents])),
      bus.on('state:reset', () => setAgents([...bus.getState().agents])),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const toggleThought = (agentId: string) => {
    setExpandedThoughts((prev) => {
      const next = new Set(prev);
      next.has(agentId) ? next.delete(agentId) : next.add(agentId);
      return next;
    });
  };

  const mainAgent = agents.find((a) => a.type === 'main');
  const departments = agents.filter((a) => a.type === 'department');

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Agent Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your agent organization structure</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Add Agent
        </button>
      </div>

      {/* Main agent card */}
      {mainAgent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{mainAgent.name}</h2>
                <p className="text-xs text-muted-foreground">{mainAgent.description}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${statusColors[mainAgent.status]}`}>
              {mainAgent.status}
            </span>
          </div>
          <AgentThoughtStream
            agentId={mainAgent.id}
            agentName={mainAgent.name}
            isExpanded={expandedThoughts.has(mainAgent.id)}
            onToggle={() => toggleThought(mainAgent.id)}
          />
        </motion.div>
      )}

      {/* Departments */}
      <div className="space-y-4">
        {departments.map((dept) => {
          const specs = agents.filter((a) => a.parentId === dept.id);
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${statusColors[dept.status]}`}>
                    {dept.status}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{dept.name}</h3>
                  <span className="text-xs text-muted-foreground">({specs.length} specialists)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Department thought stream */}
              <AgentThoughtStream
                agentId={dept.id}
                agentName={dept.name}
                isExpanded={expandedThoughts.has(dept.id)}
                onToggle={() => toggleThought(dept.id)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {specs.map((spec) => (
                  <div key={spec.id} className="px-3 py-2.5 rounded-md bg-secondary/30 border border-border/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{spec.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${statusColors[spec.status]}`}>
                        {spec.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{spec.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                      <span>{spec.tasksCompleted} done</span>
                      <span>{(spec.successRate * 100).toFixed(0)}%</span>
                      <span>{spec.avgLatency}ms</span>
                    </div>
                    <AgentThoughtStream
                      agentId={spec.id}
                      agentName={spec.name}
                      isExpanded={expandedThoughts.has(spec.id)}
                      onToggle={() => toggleThought(spec.id)}
                    />
                  </div>
                ))}
                <button className="px-3 py-2.5 rounded-md border border-dashed border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3 h-3" /> Add Specialist
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentsPage;
