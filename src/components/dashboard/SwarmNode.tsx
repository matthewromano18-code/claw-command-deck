import { Handle, Position } from '@xyflow/react';
import { SwarmAgent, SwarmAgentStatus } from '@/data/types';

interface SwarmNodeData {
  swarmAgent: SwarmAgent;
  isRoot?: boolean;
}

const statusConfig: Record<SwarmAgentStatus, { dot: string; label: string }> = {
  spawning: { dot: 'bg-warning animate-pulse', label: 'Spawning' },
  running: { dot: 'bg-primary animate-pulse', label: 'Running' },
  idle: { dot: 'bg-muted-foreground', label: 'Idle' },
  completed: { dot: 'bg-success', label: 'Done' },
  error: { dot: 'bg-destructive', label: 'Error' },
};

const SwarmNode = ({ data }: { data: SwarmNodeData }) => {
  const { swarmAgent, isRoot } = data;
  const cfg = statusConfig[swarmAgent.status];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <div
        className={`px-3 py-2.5 rounded-md border transition-all duration-300 cursor-pointer min-w-[170px] ${
          isRoot
            ? 'bg-primary/10 border-primary/40 shadow-[0_0_10px_hsl(var(--glow-primary))]'
            : swarmAgent.status === 'error'
            ? 'bg-destructive/8 border-destructive/30'
            : 'bg-card/80 border-border/40 hover:border-border/70'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          <span className="text-[11px] font-semibold text-foreground truncate">
            {swarmAgent.name}
          </span>
          {isRoot && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-primary/15 text-primary font-medium ml-auto">
              ROOT
            </span>
          )}
        </div>

        {/* Status */}
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{cfg.label}</span>

        {/* Current task */}
        {swarmAgent.currentTask && (
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
            {swarmAgent.currentTask}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </>
  );
};

export default SwarmNode;
