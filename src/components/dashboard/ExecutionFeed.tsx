import { motion } from 'framer-motion';
import { TaskEvent } from '@/data/types';

interface ExecutionFeedProps {
  events: TaskEvent[];
}

const typeIcons: Record<string, string> = {
  received: '📥',
  delegated: '➡️',
  processing: '⚙️',
  completed: '✅',
  failed: '❌',
  waiting: '⏳',
};

const typeColors: Record<string, string> = {
  received: 'text-info',
  delegated: 'text-primary',
  processing: 'text-warning',
  completed: 'text-success',
  failed: 'text-destructive',
  waiting: 'text-muted-foreground',
};

const ExecutionFeed = ({ events }: ExecutionFeedProps) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
        Live Execution Feed
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {sortedEvents.map((evt, i) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/30 transition-colors"
          >
            <span className="text-xs shrink-0 mt-0.5">{typeIcons[evt.type]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-semibold ${typeColors[evt.type]}`}>
                  {evt.agentName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-secondary-foreground leading-snug">{evt.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionFeed;
