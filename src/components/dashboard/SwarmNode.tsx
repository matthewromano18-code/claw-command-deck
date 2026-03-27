import { Handle, Position } from '@xyflow/react';
import { SwarmAgent, SwarmAgentStatus } from '@/data/types';

interface SwarmNodeData {
  swarmAgent: SwarmAgent;
  isRoot?: boolean;
}

const statusConfig: Record<SwarmAgentStatus, { dot: string; label: string; ring?: string }> = {
  spawning: { dot: 'bg-warning animate-pulse', label: 'Spawning', ring: 'ring-warning/30' },
  running: { dot: 'bg-primary animate-pulse', label: 'Running', ring: 'ring-primary/30' },
  idle: { dot: 'bg-muted-foreground', label: 'Idle' },
  completed: { dot: 'bg-success', label: 'Done', ring: 'ring-success/20' },
  error: { dot: 'bg-destructive animate-pulse', label: 'Error', ring: 'ring-destructive/30' },
};

const SwarmNode = ({ data }: { data: SwarmNodeData }) => {
  const { swarmAgent } = data;
  const cfg = statusConfig[swarmAgent.status];
  const isLeader = swarmAgent.role === 'leader';

  const borderClass =
    swarmAgent.status === 'error'
      ? 'border-destructive/40 bg-destructive/5'
      : swarmAgent.status === 'completed'
      ? 'border-success/40 bg-success/5'
      : isLeader
      ? 'border-primary/50 bg-primary/8 shadow-[0_0_14px_hsl(var(--glow-strong))]'
      : 'border-border/40 bg-card/80 hover:border-border/70';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <div
        className={`px-3 py-2.5 rounded-md border cursor-pointer transition-all duration-500 ${
          isLeader ? 'min-w-[190px]' : 'min-w-[160px]'
        } ${borderClass}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-500 ${cfg.dot} ${
              cfg.ring ? `ring-2 ${cfg.ring}` : ''
            }`}
          />
          <span
            className={`font-semibold text-foreground truncate ${
              isLeader ? 'text-xs' : 'text-[11px]'
            }`}
          >
            {swarmAgent.name}
          </span>
          {isLeader && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold ml-auto tracking-wider">
              LEADER
            </span>
          )}
        </div>

        {/* Status */}
        <span
          className={`text-[9px] uppercase tracking-wider transition-colors duration-300 ${
            swarmAgent.status === 'error'
              ? 'text-destructive'
              : swarmAgent.status === 'completed'
              ? 'text-success'
              : 'text-muted-foreground'
          }`}
        >
          {cfg.label}
        </span>

        {/* Current task */}
        {swarmAgent.currentTask && (
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2 transition-all duration-300">
            {swarmAgent.currentTask}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </>
  );
};

export default SwarmNode;
