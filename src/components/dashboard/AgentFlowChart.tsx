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
import { Agent, AgentStatus, SwarmSession, SwarmAgentStatus } from '@/data/types';
import AgentNode from './AgentNode';
import SwarmNode from './SwarmNode';

interface AgentFlowChartProps {
  agents: Agent[];
  activeTaskPath?: string[];
  swarmSessions?: SwarmSession[];
  onNodeClick: (agentId: string) => void;
  onSwarmNodeClick?: (sessionId: string, agentId: string) => void;
}

// ── Helpers ──

const isAgentActive = (status: AgentStatus) =>
  status === 'running' || status === 'thinking';

const isSwarmActive = (status: SwarmAgentStatus) =>
  status === 'running' || status === 'spawning';

const edgeColor = {
  active: 'hsl(218, 68%, 50%)',
  idle: 'hsl(218, 20%, 78%)',
  success: 'hsl(150, 45%, 38%)',
  error: 'hsl(0, 55%, 50%)',
};

const swarmEdgeColor = (status: SwarmAgentStatus) => {
  if (status === 'running' || status === 'spawning') return edgeColor.active;
  if (status === 'completed') return edgeColor.success;
  if (status === 'error') return edgeColor.error;
  return edgeColor.idle;
};

const nodeTypes = { agentNode: AgentNode, swarmNode: SwarmNode };

// ── Inner Component ──

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

    const ns: Node[] = [];
    const es: Edge[] = [];

    // ── Calculate dynamic department spacing ──
    // Each department's width is determined by its specialist count
    const NODE_WIDTH = 160;
    const SPEC_GAP = 30; // gap between specialist nodes
    const DEPT_GAP = 60; // gap between department columns

    const deptWidths = departments.map((dept) => {
      const specCount = specialists.filter((s) => s.parentId === dept.id).length;
      return Math.max(NODE_WIDTH, specCount * NODE_WIDTH + (specCount - 1) * SPEC_GAP);
    });
    const totalWidth = deptWidths.reduce((sum, w) => sum + w, 0) + (departments.length - 1) * DEPT_GAP;

    // Build cumulative X positions so each dept is centered over its specialists
    const deptPositions: number[] = [];
    let cursor = -totalWidth / 2;
    deptWidths.forEach((w, i) => {
      deptPositions.push(cursor + w / 2);
      cursor += w + DEPT_GAP;
    });

    // ── Main Agent ──
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

    // ── Departments & Specialists ──
    departments.forEach((dept, i) => {
      const deptX = deptPositions[i];
      const onPath = activeTaskPath.includes(dept.id);

      ns.push({
        id: dept.id,
        type: 'agentNode',
        position: { x: deptX, y: 180 },
        data: { agent: dept, isOnPath: onPath },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      es.push({
        id: `e-main-${dept.id}`,
        source: 'main-agent',
        target: dept.id,
        animated: onPath || isAgentActive(dept.status),
        style: {
          stroke: onPath ? edgeColor.active : edgeColor.idle,
          strokeWidth: onPath ? 2 : 1,
          transition: 'stroke 0.5s, stroke-width 0.3s',
        },
      });

      // ── Specialists — centered under their department ──
      const deptSpecs = specialists.filter((s) => s.parentId === dept.id);
      const specTotalWidth = deptSpecs.length * NODE_WIDTH + (deptSpecs.length - 1) * SPEC_GAP;
      const specStartX = deptX - specTotalWidth / 2 + NODE_WIDTH / 2;

      deptSpecs.forEach((spec, j) => {
        const sx = specStartX + j * (NODE_WIDTH + SPEC_GAP);
        const specOnPath = activeTaskPath.includes(spec.id);

        ns.push({
          id: spec.id,
          type: 'agentNode',
          position: { x: sx, y: 380 },
          data: { agent: spec, isOnPath: specOnPath },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });

        es.push({
          id: `e-${dept.id}-${spec.id}`,
          source: dept.id,
          target: spec.id,
          animated: specOnPath || isAgentActive(spec.status),
          style: {
            stroke: specOnPath ? edgeColor.active : edgeColor.idle,
            strokeWidth: specOnPath ? 2 : 1,
            transition: 'stroke 0.5s, stroke-width 0.3s',
          },
        });
      });
    });

    // ── Swarm Branches ──
    const activeSessions = swarmSessions.filter(
      (s) => s.status === 'active' || s.agents.length > 0
    );

    if (activeSessions.length > 0) {
      const maxX = Math.max(...ns.map((n) => n.position.x), 0);
      let swarmOffsetX = maxX + NODE_WIDTH + 200;

      activeSessions.forEach((session) => {
        const triggerNode = ns.find((n) => n.id === session.triggerAgentId);
        if (!triggerNode) return;

        const triggerY = triggerNode.position.y;

        // Find the leader
        const leader =
          session.agents.find(
            (a) => a.parentId === session.triggerAgentId && a.role === 'leader'
          ) || session.agents.find((a) => a.parentId === session.triggerAgentId);

        if (!leader) return;

        const workers = session.agents.filter((a) => a.parentId === leader.id);
        const leaderNodeId = `swarm-${session.id}-${leader.id}`;

        // Leader node — positioned to the right of trigger, same Y
        ns.push({
          id: leaderNodeId,
          type: 'swarmNode',
          position: { x: swarmOffsetX, y: triggerY },
          data: { swarmAgent: leader, isRoot: true },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Left,
        });

        // Edge: trigger → leader (horizontal branch)
        es.push({
          id: `e-swarm-trigger-${leader.id}`,
          source: session.triggerAgentId,
          sourceHandle: null,
          target: leaderNodeId,
          animated: isSwarmActive(leader.status),
          style: {
            stroke: swarmEdgeColor(leader.status),
            strokeWidth: 2,
            transition: 'stroke 0.5s',
          },
        });

        // Worker nodes — fan out below the leader
        const workerSpacing = 200;
        const workerStartX = swarmOffsetX - ((workers.length - 1) * workerSpacing) / 2;

        workers.forEach((worker, i) => {
          const workerNodeId = `swarm-${session.id}-${worker.id}`;
          const wx = workerStartX + i * workerSpacing;
          const wy = triggerY + 180;

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
            animated: isSwarmActive(worker.status),
            style: {
              stroke: swarmEdgeColor(worker.status),
              strokeWidth: 1.5,
              strokeDasharray: worker.status === 'completed' ? undefined : '6 4',
              transition: 'stroke 0.5s',
            },
          });
        });

        // Shift for next swarm session (if multiple)
        swarmOffsetX += (workers.length + 1) * workerSpacing;
      });
    }

    return { nodes: ns, edges: es };
  }, [agents, activeTaskPath, swarmSessions]);

  // Auto-fit when node count changes (swarm spawns)
  const nodeCount = nodes.length;
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 600 });
    }, 200);
    return () => clearTimeout(timer);
  }, [nodeCount, fitView]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
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
    },
    [onNodeClick, onSwarmNodeClick, swarmSessions]
  );

  const hasSwarm = swarmSessions.some(
    (s) => s.agents.length > 0
  );
  const chartHeight = hasSwarm ? 580 : 440;

  return (
    <div
      className="w-full glass-panel overflow-hidden transition-all duration-500"
      style={{ height: chartHeight }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.15}
        maxZoom={1.5}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(218, 25%, 15%)"
        />
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
