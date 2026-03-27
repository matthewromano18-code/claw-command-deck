export interface AgentThought {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  type: 'thinking' | 'action' | 'result' | 'error' | 'plan';
  timestamp: string;
}
