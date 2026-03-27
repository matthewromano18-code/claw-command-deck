import { SwarmSession } from '@/data/types';
import { Activity } from 'lucide-react';

interface SwarmEventLogProps {
  session: SwarmSession;
}

const SwarmEventLog = ({ session }: SwarmEventLogProps) => {
  const recentAgents = [...session.agents]
    .sort((a, b) => new Date(b.spawnedAt).getTime() - new Date(a.spawnedAt).getTime())
    .slice(0, 6);

  return (
    <div className="glass-panel p-3 max-h-[160px] overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Swarm Log</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {session.agents.length} agents
        </span>
      </div>
      <div className="space-y-1">
        {recentAgents.map((a) => (
          <div key={a.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              a.status === 'running' ? 'bg-primary animate-pulse' :
              a.status === 'completed' ? 'bg-success' :
              a.status === 'error' ? 'bg-destructive' :
              a.status === 'spawning' ? 'bg-warning animate-pulse' :
              'bg-muted-foreground'
            }`} />
            <span className="font-medium text-foreground truncate">{a.name}</span>
            <span className="truncate flex-1">{a.currentTask || '—'}</span>
            <span className="capitalize shrink-0">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwarmEventLog;
