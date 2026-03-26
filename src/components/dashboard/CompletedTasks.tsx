import { motion } from 'framer-motion';
import { Task } from '@/data/types';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface CompletedTasksProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const CompletedTasks = ({ tasks, onTaskClick }: CompletedTasksProps) => {
  const completed = tasks.filter((t) => t.status === 'completed' || t.status === 'failed');

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
        Completed Tasks
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {completed.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onTaskClick(task)}
            className="px-3 py-2.5 rounded-md bg-secondary/30 border border-border/20 hover:border-border/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
                <p className="text-xs font-medium text-foreground truncate">{task.prompt}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {task.completedAt && (
                <span>{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {task.duration && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {Math.floor(task.duration / 60)}m {task.duration % 60}s
                </span>
              )}
              {task.department && <span className="text-primary/70">{task.department}</span>}
              {task.confidence && <span>{(task.confidence * 100).toFixed(0)}% conf</span>}
            </div>
            {task.result && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{task.result}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompletedTasks;
