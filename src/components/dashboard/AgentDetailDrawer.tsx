import { X, Activity, Clock, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Agent, Task } from '@/data/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentDetailDrawerProps {
  agent: Agent | null;
  tasks: Task[];
  onClose: () => void;
}

const statusBadge: Record<string, string> = {
  idle: 'bg-muted-foreground/20 text-muted-foreground',
  thinking: 'bg-warning/20 text-warning',
  running: 'bg-primary/20 text-primary',
  waiting: 'bg-info/20 text-info',
  blocked: 'bg-destructive/20 text-destructive',
  complete: 'bg-success/20 text-success',
  failed: 'bg-destructive/20 text-destructive',
};

const AgentDetailDrawer = ({ agent, tasks, onClose }: AgentDetailDrawerProps) => {
  if (!agent) return null;

  const agentTasks = tasks.filter((t) => t.agentPath.includes(agent.id));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-[380px] z-50 glass-panel-strong border-l border-border/50 shadow-2xl overflow-y-auto scrollbar-thin"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">{agent.name}</h2>
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${statusBadge[agent.status]}`}>
                {agent.status}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-5">{agent.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="metric-card">
              <span className="text-[10px] text-muted-foreground uppercase">Tasks Done</span>
              <span className="text-sm font-semibold">{agent.tasksCompleted}</span>
            </div>
            <div className="metric-card">
              <span className="text-[10px] text-muted-foreground uppercase">Success Rate</span>
              <span className="text-sm font-semibold">{(agent.successRate * 100).toFixed(0)}%</span>
            </div>
            <div className="metric-card">
              <span className="text-[10px] text-muted-foreground uppercase">Avg Latency</span>
              <span className="text-sm font-semibold">{agent.avgLatency}ms</span>
            </div>
            <div className="metric-card">
              <span className="text-[10px] text-muted-foreground uppercase">Queue</span>
              <span className="text-sm font-semibold">{agent.queueCount}</span>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Tools
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {agent.tools.map((tool) => (
                <span key={tool} className="text-[10px] px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground border border-border/30">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" /> Recent Tasks
            </h3>
            <div className="space-y-1.5">
              {agentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="px-2.5 py-2 rounded-md bg-secondary/20 border border-border/20">
                  <p className="text-xs text-foreground truncate">{task.prompt}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="capitalize">{task.status}</span>
                    {task.priority === 'critical' && <AlertTriangle className="w-2.5 h-2.5 text-destructive" />}
                    {task.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-success" />}
                  </div>
                </div>
              ))}
              {agentTasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No recent tasks</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentDetailDrawer;
