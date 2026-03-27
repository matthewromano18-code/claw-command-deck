import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  BackgroundVariant,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Agent, AgentStatus, SwarmSession } from '@/data/types';
import AgentNode from './AgentNode';
import SwarmNode from './SwarmNode';

interface AgentFlowChartProps {
  agents: Agent[];
  activeTaskPath?: string[];
  swarmSessions?: SwarmSession[];
  onNodeClick: (agentId: string) => void;
  onSwarmNodeClick?: (sessionId: string, agentId: string) => void;
}

const statusToAnimated = (status: AgentStatus) =>
  status === 'running' || status === 'thinking';

const nodeTypes = { agentNode: AgentNode, swarmNode: SwarmNode };

const AgentFlowChartInner = ({
  agents,
  activeTaskPath = [],
  swarmSessions = [],
  onNodeClick,
  onSwarmNodeClick,
}: AgentFlowChartProps) => {
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => {
    const mainAgent = agents.find((a) => a.type === 'main');
    const departments = agents.filter((a) => a.type === 'department');
    const specialists = agents.filter((a) => a.type === 'specialist');

    const totalDepts = departments.length;
    const deptSpacing = 240;
    const deptStartX = -(totalDepts - 1) * deptSpacing / 2;

    const ns: Node[] = [];
    const es: Edge[] = [];

    if (mainAgent) {
      ns.push({
        id: mainAgent.id,
        type: 'agentNode',
        position: { x: 0, y: 0 },
        data: { agent: mainAgent, isOnPath: activeTaskPath.includes(mainAgent.id) },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    }

    departments.forEach((dept, i) => {
      const x = deptStartX + i * deptSpacing;
      ns.push({
        id: dept.id,
        type: 'agentNode',
        position: { x, y: 160 },
        data: { agent: dept, isOnPath: activeTaskPath.includes(dept.id) },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      es.push({
        id: `e-main-${dept.id}`,
        source: 'main-agent',
        target: dept.id,
        animated: activeTaskPath.includes(dept.id) || statusToAnimated(dept.status),
        style: { stroke: activeTaskPath.includes(dept.id) ? 'hsl(218, 68%, 50%)' : undefined },
      });

      const deptSpecs = specialists.filter((s) => s.parentId === dept.id);
      const specSpacing = 200;
      const specStartX = x - (deptSpecs.length - 1) * specSpacing / 2;

      deptSpecs.forEach((spec, j) => {
        const sx = specStartX + j * specSpacing;
        ns.push({
          id: spec.id,
          type: 'agentNode',
          position: { x: sx, y: 340 },
          data: { agent: spec, isOnPath: activeTaskPath.includes(spec.id) },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
        es.push({
          id: `e-${dept.id}-${spec.id}`,
          source: dept.id,
          target: spec.id,
          animated: activeTaskPath.includes(spec.id) || statusToAnimated(spec.status),
          style: { stroke: activeTaskPath.includes(spec.id) ? 'hsl(218, 68%, 50%)' : undefined },
        });
      });
    });

    // ── Swarm Branches ──
    // Place swarm tree to the far right of all existing nodes
    const activeSessions = swarmSessions.filter((s) => s.status === 'active' || s.agents.length > 0);

    if (activeSessions.length > 0) {
      // Find rightmost node X to position swarm branch clear of everything
      const maxX = Math.max(...ns.map((n) => n.position.x), 0);
      const swarmBaseX = maxX + 350;

      activeSessions.forEach((session) => {
        const triggerNode = ns.find((n) => n.id === session.triggerAgentId);
        if (!triggerNode) return;

        const triggerY = triggerNode.position.y;

        // Find the leader
        const leader = session.agents.find(
          (a) => a.parentId === session.triggerAgentId && a.role === 'leader'
        ) || session.agents.find((a) => a.parentId === session.triggerAgentId);

        if (!leader) return;

        const workers = session.agents.filter((a) => a.parentId === leader.id);

        // Leader — same Y as trigger, offset to the right
        const leaderNodeId = `swarm-${session.id}-${leader.id}`;
        ns.push({
          id: leaderNodeId,
          type: 'swarmNode',
          position: { x: swarmBaseX, y: triggerY },
          data: { swarmAgent: leader, isRoot: true },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        // Edge: trigger → leader (horizontal branch)
        es.push({
          id: `e-swarm-trigger-${leader.id}`,
          source: session.triggerAgentId,
          target: leaderNodeId,
          animated: leader.status === 'running' || leader.status === 'spawning',
          style: {
            stroke: 'hsl(218, 68%, 50%)',
            strokeWidth: 2,
          },
        });

        // Workers fan out below the leader
        const workerSpacing = 200;
        const workerStartX = swarmBaseX - ((workers.length - 1) * workerSpacing) / 2;

        workers.forEach((worker, i) => {
          const workerNodeId = `swarm-${session.id}-${worker.id}`;
          const wx = workerStartX + i * workerSpacing;
          const wy = triggerY + 160;

          ns.push({
            id: workerNodeId,
            type: 'swarmNode',
            position: { x: wx, y: wy },
            data: { swarmAgent: worker, isRoot: false },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });

          es.push({
            id: `e-swarm-${session.id}-${worker.id}`,
            source: leaderNodeId,
            target: workerNodeId,
            animated: worker.status === 'running' || worker.status === 'spawning',
            style: {
              stroke: worker.status === 'error'
                ? 'hsl(0, 55%, 50%)'
                : worker.status === 'running' || worker.status === 'spawning'
                ? 'hsl(218, 68%, 50%)'
                : 'hsl(var(--border))',
              strokeDasharray: '5 4',
            },
          });
        });
      });
    }

    return { nodes: ns, edges: es };
  }, [agents, activeTaskPath, swarmSessions]);

  // Re-fit when swarm nodes appear/change
  const swarmNodeCount = swarmSessions.reduce((sum, s) => sum + s.agents.length, 0);
  useEffect(() => {
    // Delay to let React Flow measure new nodes
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 500 });
    }, 250);
    return () => clearTimeout(timer);
  }, [swarmNodeCount, nodes.length, fitView]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'swarmNode' && onSwarmNodeClick) {
      const data = node.data as any;
      if (data?.swarmAgent?.id) {
        const session = swarmSessions.find((s) =>
          s.agents.some((a) => a.id === data.swarmAgent.id)
        );
        if (session) onSwarmNodeClick(session.id, data.swarmAgent.id);
      }
    } else {
      onNodeClick(node.id);
    }
  }, [onNodeClick, onSwarmNodeClick, swarmSessions]);

  const chartHeight = swarmSessions.some((s) => s.status === 'active' && s.agents.length > 0) ? 560 : 420;

  return (
    <div className={`w-full glass-panel overflow-hidden transition-all duration-500`} style={{ height: chartHeight }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(218, 25%, 15%)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

const AgentFlowChart = (props: AgentFlowChartProps) => (
  <ReactFlowProvider>
    <AgentFlowChartInner {...props} />
  </ReactFlowProvider>
);

export default AgentFlowChart;
