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
    const activeSessions = swarmSessions.filter((s) => s.status === 'active' || s.agents.length > 0);

    activeSessions.forEach((session) => {
      const triggerNode = ns.find((n) => n.id === session.triggerAgentId);
      const baseX = triggerNode ? triggerNode.position.x : 0;
      const baseY = triggerNode ? triggerNode.position.y : 340;

      // Build a map of swarm agent children
      const rootAgents = session.agents.filter((a) => a.parentId === session.triggerAgentId);
      const childMap = new Map<string, typeof session.agents>();
      session.agents.forEach((a) => {
        if (!childMap.has(a.parentId)) childMap.set(a.parentId, []);
        childMap.get(a.parentId)!.push(a);
      });

      // BFS layout for swarm agents
      const swarmSpacing = 180;
      let queue = rootAgents.map((a, i) => ({
        agent: a,
        depth: 1,
        index: i,
        total: rootAgents.length,
      }));

      const visited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.agent.id)) continue;
        visited.add(current.agent.id);

        const offsetX = baseX + (current.index - (current.total - 1) / 2) * swarmSpacing;
        const offsetY = baseY + current.depth * 120;

        const nodeId = `swarm-${session.id}-${current.agent.id}`;

        ns.push({
          id: nodeId,
          type: 'swarmNode',
          position: { x: offsetX, y: offsetY },
          data: {
            swarmAgent: current.agent,
            isRoot: current.depth === 1,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        // Edge from parent
        const parentNodeId = current.agent.parentId === session.triggerAgentId
          ? session.triggerAgentId
          : `swarm-${session.id}-${current.agent.parentId}`;

        es.push({
          id: `e-swarm-${session.id}-${current.agent.id}`,
          source: parentNodeId,
          target: nodeId,
          animated: current.agent.status === 'running' || current.agent.status === 'spawning',
          style: {
            stroke: current.agent.status === 'error'
              ? 'hsl(0, 55%, 50%)'
              : current.agent.status === 'running'
              ? 'hsl(218, 68%, 50%)'
              : undefined,
            strokeDasharray: '4 3',
          },
        });

        // Queue children
        const children = childMap.get(current.agent.id) || [];
        children.forEach((child, ci) => {
          queue.push({
            agent: child,
            depth: current.depth + 1,
            index: ci,
            total: children.length,
          });
        });
      }
    });

    return { nodes: ns, edges: es };
  }, [agents, activeTaskPath, swarmSessions]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'swarmNode' && onSwarmNodeClick) {
      // Extract sessionId and agentId from node id: swarm-{sessionId}-{agentId}
      const parts = node.id.replace('swarm-', '').split('-');
      // Session IDs have format swarm-{timestamp}-{rand}, so we need to reconstruct
      const data = node.data as any;
      if (data?.swarmAgent?.id) {
        // find which session this belongs to
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

export default AgentFlowChart;
