import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  BackgroundVariant,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Agent, AgentStatus } from '@/data/types';
import AgentNode from './AgentNode';

interface AgentFlowChartProps {
  agents: Agent[];
  activeTaskPath?: string[];
  onNodeClick: (agentId: string) => void;
}

const statusToAnimated = (status: AgentStatus) =>
  status === 'running' || status === 'thinking';

const nodeTypes = { agentNode: AgentNode };

const AgentFlowChart = ({ agents, activeTaskPath = [], onNodeClick }: AgentFlowChartProps) => {
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

    return { nodes: ns, edges: es };
  }, [agents, activeTaskPath]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-[420px] glass-panel overflow-hidden">
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
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(218, 25%, 15%)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default AgentFlowChart;
