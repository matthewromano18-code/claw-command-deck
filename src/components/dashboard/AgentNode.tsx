import { Handle, Position } from '@xyflow/react';
import { Agent } from '@/data/types';

interface AgentNodeData {
  agent: Agent;
  isOnPath: boolean;
}

const statusColors: Record<string, string> = {
  idle: 'bg-muted-foreground',
  thinking: 'bg-warning animate-pulse',
  running: 'bg-primary animate-pulse',
  waiting: 'bg-info',
  blocked: 'bg-destructive',
  complete: 'bg-success',
  failed: 'bg-destructive',
};

const typeStyles: Record<string, string> = {
  main: 'min-w-[180px]',
  department: 'min-w-[160px]',
  specialist: 'min-w-[150px]',
};

const AgentNode = ({ data }: { data: AgentNodeData }) => {
  const { agent, isOnPath } = data;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <div
        className={`px-4 py-3 rounded-lg border transition-all duration-300 cursor-pointer ${
          typeStyles[agent.type]
        } ${
          isOnPath
            ? 'bg-primary/8 border-primary/40 shadow-[0_0_12px_hsl(218,68%,33%,0.15)]'
            : 'bg-card/90 border-border/50 hover:border-border'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[agent.status]}`} />
          <span className="text-xs font-semibold text-foreground truncate">{agent.name}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground capitalize">{agent.status}</span>
          {agent.queueCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              {agent.queueCount} queued
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </>
  );
};

export default AgentNode;
