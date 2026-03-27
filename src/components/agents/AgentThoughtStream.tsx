import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, CheckCircle2, AlertTriangle, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import { AgentThought } from '@/data/agentThoughtTypes';
import bus from '@/integration';

interface AgentThoughtStreamProps {
  agentId: string;
  agentName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const typeConfig: Record<AgentThought['type'], { icon: typeof Brain; color: string; label: string }> = {
  thinking: { icon: Brain, color: 'text-warning', label: 'Thinking' },
  action: { icon: Zap, color: 'text-primary', label: 'Action' },
  result: { icon: CheckCircle2, color: 'text-success', label: 'Result' },
  error: { icon: AlertTriangle, color: 'text-destructive', label: 'Error' },
  plan: { icon: ListChecks, color: 'text-info', label: 'Planning' },
};

const AgentThoughtStream = ({ agentId, agentName, isExpanded, onToggle }: AgentThoughtStreamProps) => {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = bus.on('agent:thought', (event) => {
      const thought = event.payload as AgentThought;
      if (thought.agentId === agentId) {
        setThoughts((prev) => [...prev, thought]);
      }
    });
    return unsub;
  }, [agentId]);

  // Clear on state sync (demo restart)
  useEffect(() => {
    const unsub = bus.on('state:sync', () => setThoughts([]));
    return unsub;
  }, []);

  useEffect(() => {
    if (isExpanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts, isExpanded]);

  const latestThought = thoughts[thoughts.length - 1];

  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-secondary/20 hover:bg-secondary/40 border border-border/20 transition-colors text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Brain className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground font-medium">Thoughts</span>
          {thoughts.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              {thoughts.length}
            </span>
          )}
          {latestThought && !isExpanded && (
            <span className="text-[10px] text-muted-foreground truncate">
              — {latestThought.content}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 max-h-[200px] overflow-y-auto scrollbar-thin rounded-md bg-background/50 border border-border/20 p-2 space-y-1.5">
              {thoughts.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic text-center py-3">
                  No thoughts yet — waiting for activity...
                </p>
              )}
              {thoughts.map((thought) => {
                const cfg = typeConfig[thought.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-1.5 items-start"
                  >
                    <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-foreground leading-relaxed">{thought.content}</p>
                      <span className="text-[8px] text-muted-foreground">
                        {new Date(thought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentThoughtStream;
