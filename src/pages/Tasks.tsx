import { useState } from 'react';
import { motion } from 'framer-motion';
import { mockTasks, mockAgents } from '@/data/mockData';
import { Task, TaskStatus, TaskPriority } from '@/data/types';
import { ListTodo, Filter, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  queued: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  active: <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />,
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
  failed: <XCircle className="w-3.5 h-3.5 text-destructive" />,
};

const priorityBadge: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/15 text-info',
  high: 'bg-warning/15 text-warning',
  critical: 'bg-destructive/15 text-destructive',
};

const TasksPage = () => {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [tasks] = useState<Task[]>(mockTasks);

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const statuses: (TaskStatus | 'all')[] = ['all', 'active', 'queued', 'completed', 'failed'];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          Tasks
        </h1>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                filter === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((task, i) => {
          const agentNames = task.agentPath.map((id) => mockAgents.find((a) => a.id === id)?.name || id);
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {statusIcon[task.status]}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{task.prompt}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{new Date(task.createdAt).toLocaleString()}</span>
                      {task.duration && <span>• {Math.floor(task.duration / 60)}m {task.duration % 60}s</span>}
                      {task.department && <span>• {task.department}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium uppercase ${priorityBadge[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-muted-foreground">Path:</span>
                {agentNames.map((name, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground">{name}</span>
                    {idx < agentNames.length - 1 && <span className="text-[10px] text-muted-foreground">→</span>}
                  </span>
                ))}
              </div>
              {task.result && (
                <p className="text-xs text-muted-foreground mt-2 bg-secondary/20 p-2 rounded-md">{task.result}</p>
              )}
              {task.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${task.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{(task.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksPage;
