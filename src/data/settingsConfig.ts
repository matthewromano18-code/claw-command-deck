// ─── Settings Translation Layer ─────────────────────────────
// Maps beginner-friendly UI controls → real OpenClaw config keys

export type SettingType = 'toggle' | 'slider' | 'select' | 'number' | 'text' | 'list' | 'button';
export type RiskLevel = 'safe' | 'caution' | 'danger';
export type SettingSection =
  | 'ai-brain'
  | 'safety'
  | 'browser'
  | 'automation'
  | 'connections'
  | 'usage'
  | 'memory'
  | 'tools'
  | 'performance'
  | 'logs'
  | 'system';

export interface SettingItem {
  id: string;
  configKey: string; // real OpenClaw config key
  label: string;
  description: string;
  tooltip: string;
  type: SettingType;
  section: SettingSection;
  risk: RiskLevel;
  simpleMode: boolean; // visible in simple mode?
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  sliderLabels?: [string, string]; // [left, right]
  default: unknown;
  warning?: string;
  requiresConfirm?: boolean;
}

export interface SectionMeta {
  id: SettingSection;
  icon: string; // lucide icon name
  label: string;
  description: string;
  emoji: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: 'ai-brain', icon: 'Brain', label: 'AI Brain Settings', description: 'Control how the AI thinks and responds', emoji: '🤖' },
  { id: 'safety', icon: 'Shield', label: 'Safety & Permissions', description: 'Set boundaries for what the AI can do', emoji: '🔐' },
  { id: 'browser', icon: 'Globe', label: 'Browser Control', description: 'Manage how the AI uses web browsers', emoji: '🌐' },
  { id: 'automation', icon: 'Workflow', label: 'Automation & Workflows', description: 'Schedule and automate tasks', emoji: '⚙️' },
  { id: 'connections', icon: 'Link2', label: 'Connections', description: 'Link external tools and services', emoji: '🔗' },
  { id: 'usage', icon: 'BarChart3', label: 'Usage & Limits', description: 'Track how much the AI is being used', emoji: '📊' },
  { id: 'memory', icon: 'Database', label: 'Memory & Knowledge', description: 'Control what the AI remembers', emoji: '🧠' },
  { id: 'tools', icon: 'Wrench', label: 'Tools & Capabilities', description: 'Enable or disable AI abilities', emoji: '🧰' },
  { id: 'performance', icon: 'Cpu', label: 'System Performance', description: 'Adjust speed and resource usage', emoji: '🖥️' },
  { id: 'logs', icon: 'ScrollText', label: 'Activity & Logs', description: 'View history and debug info', emoji: '📜' },
  { id: 'system', icon: 'Radio', label: 'System Connection', description: 'Manage gateway connectivity', emoji: '🌍' },
];

export const SETTINGS: SettingItem[] = [
  // ── AI Brain ─────────────────────────────────
  { id: 'creativity', configKey: 'agent.temperature', label: 'AI Intelligence Level', description: 'How creative vs precise the AI should be', tooltip: 'Higher creativity means more varied responses but less predictable. Lower means more consistent and factual.', type: 'slider', section: 'ai-brain', risk: 'safe', simpleMode: true, min: 0, max: 100, step: 5, sliderLabels: ['Precise', 'Creative'], default: 50 },
  { id: 'response-length', configKey: 'agent.maxTokens', label: 'Response Length', description: 'How long the AI responses should be', tooltip: 'Controls the maximum length of AI-generated text. Short is faster; long gives more detail.', type: 'slider', section: 'ai-brain', risk: 'safe', simpleMode: true, min: 0, max: 100, step: 5, sliderLabels: ['Short', 'Long'], default: 60 },
  { id: 'main-model', configKey: 'models.default', label: 'Main AI Model', description: 'The primary AI model used for tasks', tooltip: 'Choose which AI model powers most tasks. GPT-4o is smartest, GPT-4o-mini is faster and cheaper.', type: 'select', section: 'ai-brain', risk: 'safe', simpleMode: true, options: [{ value: 'gpt-4o', label: 'GPT-4o (Smartest)' }, { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' }, { value: 'o3', label: 'o3 (Deep Thinking)' }, { value: 'codex', label: 'Codex (Code Expert)' }], default: 'gpt-4o' },
  { id: 'backup-model', configKey: 'models.fallback', label: 'Backup AI (if main fails)', description: 'Used when the main model is unavailable', tooltip: 'If the primary model goes down or hits rate limits, this model takes over automatically.', type: 'select', section: 'ai-brain', risk: 'safe', simpleMode: false, options: [{ value: 'gpt-4o-mini', label: 'GPT-4o Mini' }, { value: 'gpt-4o', label: 'GPT-4o' }, { value: 'none', label: 'None (stop on failure)' }], default: 'gpt-4o-mini' },
  { id: 'thinking-depth', configKey: 'agent.reasoning', label: 'Thinking Depth', description: 'How deeply the AI analyzes before acting', tooltip: 'Fast mode gives quick answers. Deep thinking mode spends more time analyzing for better results.', type: 'slider', section: 'ai-brain', risk: 'safe', simpleMode: true, min: 0, max: 100, step: 10, sliderLabels: ['Fast', 'Deep Thinking'], default: 40 },
  { id: 'tool-mode', configKey: 'agent.toolChoice', label: 'How the AI chooses tools', description: 'Should the AI pick tools automatically?', tooltip: 'Auto mode lets the AI decide which tools to use. Manual mode makes it ask you first.', type: 'select', section: 'ai-brain', risk: 'safe', simpleMode: false, options: [{ value: 'auto', label: 'Automatic' }, { value: 'manual', label: 'Ask Me First' }, { value: 'none', label: 'No Tools' }], default: 'auto' },

  // ── Safety ───────────────────────────────────
  { id: 'allow-actions', configKey: 'tools.exec.enabled', label: 'Allow AI to take actions on your computer', description: 'Let the AI run commands and make changes', tooltip: 'When enabled, the AI can execute programs, edit files, and interact with your system.', type: 'toggle', section: 'safety', risk: 'danger', simpleMode: true, default: false, warning: 'The AI will be able to make changes to your computer.', requiresConfirm: true },
  { id: 'ask-before-actions', configKey: 'tools.exec.requireApproval', label: 'Ask before taking actions', description: 'Get a confirmation prompt before the AI acts', tooltip: 'Recommended ON — the AI will show you what it plans to do and wait for your approval.', type: 'toggle', section: 'safety', risk: 'safe', simpleMode: true, default: true },
  { id: 'file-access', configKey: 'tools.filesystem.enabled', label: 'Allow file access', description: 'Let the AI read and write files', tooltip: 'Controls whether the AI can access files on your computer. Required for many tasks.', type: 'toggle', section: 'safety', risk: 'caution', simpleMode: true, default: true },
  { id: 'internet-access', configKey: 'tools.network.enabled', label: 'Allow internet access', description: 'Let the AI browse the web and make requests', tooltip: 'Required for web searches, downloading files, and accessing APIs.', type: 'toggle', section: 'safety', risk: 'caution', simpleMode: true, default: true },
  { id: 'browser-control', configKey: 'tools.browser.enabled', label: 'Allow browser control', description: 'Let the AI open and control browser tabs', tooltip: 'Enables the AI to interact with web pages on your behalf.', type: 'toggle', section: 'safety', risk: 'caution', simpleMode: true, default: false },
  { id: 'restricted-mode', configKey: 'security.mode', label: 'Restricted Mode', description: 'Overall safety level for AI actions', tooltip: 'Safe: very limited. Balanced: recommended. Full Control: AI can do anything without asking.', type: 'select', section: 'safety', risk: 'danger', simpleMode: true, options: [{ value: 'safe', label: '🛡️ Safe' }, { value: 'balanced', label: '⚖️ Balanced' }, { value: 'full', label: '⚡ Full Control' }], default: 'balanced', warning: 'Full Control allows the AI to make changes without asking.', requiresConfirm: true },

  // ── Browser ──────────────────────────────────
  { id: 'browser-enabled', configKey: 'browser.enabled', label: 'Let AI use your browser', description: 'Enable browser automation features', tooltip: 'When on, the AI can open web pages, fill forms, and extract information from websites.', type: 'toggle', section: 'browser', risk: 'caution', simpleMode: true, default: false },
  { id: 'max-tabs', configKey: 'browser.maxTabs', label: 'Max number of tabs AI can use', description: 'Limit how many browser tabs the AI opens', tooltip: 'Prevents the AI from opening too many tabs at once, keeping your system responsive.', type: 'number', section: 'browser', risk: 'safe', simpleMode: true, min: 1, max: 20, default: 5 },
  { id: 'keep-sessions', configKey: 'browser.persistSessions', label: 'Keep browser sessions saved', description: 'Remember login sessions between tasks', tooltip: 'When on, the AI keeps cookies and sessions so it does not need to re-login each time.', type: 'toggle', section: 'browser', risk: 'caution', simpleMode: false, default: false },
  { id: 'allowed-sites', configKey: 'browser.allowList', label: 'Allowed websites only', description: 'Only let AI visit these websites', tooltip: 'Leave empty to allow all sites, or add specific domains the AI is allowed to visit.', type: 'list', section: 'browser', risk: 'safe', simpleMode: false, default: [] },
  { id: 'blocked-sites', configKey: 'browser.blockList', label: 'Block certain websites', description: 'Prevent the AI from visiting these sites', tooltip: 'Add domains you never want the AI to access.', type: 'list', section: 'browser', risk: 'safe', simpleMode: false, default: [] },

  // ── Automation ───────────────────────────────
  { id: 'auto-tasks', configKey: 'automation.enabled', label: 'Run tasks automatically', description: 'Allow the system to start tasks on its own', tooltip: 'When enabled, scheduled tasks and triggered workflows will run without manual start.', type: 'toggle', section: 'automation', risk: 'caution', simpleMode: true, default: false },
  { id: 'failure-behavior', configKey: 'automation.onFailure', label: 'What should happen if something fails?', description: 'Choose the behavior when a task encounters an error', tooltip: 'Retry: try again automatically. Stop: halt and wait. Notify: alert you and continue.', type: 'select', section: 'automation', risk: 'safe', simpleMode: true, options: [{ value: 'retry', label: '🔄 Retry automatically' }, { value: 'stop', label: '🛑 Stop everything' }, { value: 'notify', label: '🔔 Notify me' }], default: 'notify' },
  { id: 'parallel-tasks', configKey: 'agents.maxConcurrent', label: 'Run multiple tasks at once', description: 'Allow several tasks to run simultaneously', tooltip: 'Running tasks in parallel is faster, but uses more resources.', type: 'toggle', section: 'automation', risk: 'caution', simpleMode: true, default: true },

  // ── Connections ──────────────────────────────
  { id: 'connect-openai', configKey: 'integrations.openai.connected', label: 'Connect OpenAI / Codex', description: 'Link your OpenAI account for AI features', tooltip: 'Required for using GPT models and Codex.', type: 'toggle', section: 'connections', risk: 'safe', simpleMode: true, default: true },
  { id: 'connect-gdrive', configKey: 'integrations.gdrive.connected', label: 'Connect Google Drive', description: 'Access and manage Google Drive files', tooltip: 'Lets the AI read and write files in your Google Drive.', type: 'toggle', section: 'connections', risk: 'safe', simpleMode: true, default: false },
  { id: 'connect-github', configKey: 'integrations.github.connected', label: 'Connect GitHub', description: 'Access repositories and manage code', tooltip: 'Enables the AI to read repos, create PRs, and manage issues.', type: 'toggle', section: 'connections', risk: 'safe', simpleMode: true, default: false },
  { id: 'connect-other', configKey: 'integrations.custom.connected', label: 'Connect other tools', description: 'Add custom API integrations', tooltip: 'Connect any service that has an API endpoint.', type: 'toggle', section: 'connections', risk: 'safe', simpleMode: false, default: false },

  // ── Usage ────────────────────────────────────
  { id: 'usage-warning', configKey: 'usage.warnNearLimit', label: 'Warning when near limit', description: 'Get notified when approaching usage limits', tooltip: 'Sends an alert when you reach 80% of your token or request limit.', type: 'toggle', section: 'usage', risk: 'safe', simpleMode: true, default: true },

  // ── Memory ───────────────────────────────────
  { id: 'remember-conversations', configKey: 'memory.conversations.enabled', label: 'Remember past conversations', description: 'Keep context from previous sessions', tooltip: 'When on, the AI can recall what you talked about before.', type: 'toggle', section: 'memory', risk: 'safe', simpleMode: true, default: true },
  { id: 'use-knowledge', configKey: 'memory.vectorDb.enabled', label: 'Use saved knowledge', description: 'Let the AI reference stored documents', tooltip: 'Enables the AI to search through your uploaded docs and notes.', type: 'toggle', section: 'memory', risk: 'safe', simpleMode: true, default: true },
  { id: 'memory-capacity', configKey: 'memory.capacity', label: 'How much memory to keep', description: 'Amount of past context the AI retains', tooltip: 'Low saves resources, High gives better long-term context.', type: 'select', section: 'memory', risk: 'safe', simpleMode: true, options: [{ value: 'low', label: 'Low (saves resources)' }, { value: 'medium', label: 'Medium (balanced)' }, { value: 'high', label: 'High (best context)' }], default: 'medium' },
  { id: 'clear-memory', configKey: 'memory.clear', label: 'Clear memory', description: 'Erase all stored conversations and knowledge', tooltip: 'This permanently deletes all AI memory. Cannot be undone.', type: 'button', section: 'memory', risk: 'danger', simpleMode: true, default: null, warning: 'This will permanently erase all AI memory.', requiresConfirm: true },

  // ── Tools ────────────────────────────────────
  { id: 'tool-file-editing', configKey: 'tools.fileEditor.enabled', label: 'File editing', description: 'Create, edit, and manage files', tooltip: 'Core capability for the AI to work with documents and code.', type: 'toggle', section: 'tools', risk: 'safe', simpleMode: true, default: true },
  { id: 'tool-web-browsing', configKey: 'tools.webBrowser.enabled', label: 'Web browsing', description: 'Search and browse the internet', tooltip: 'Lets the AI find information online and visit web pages.', type: 'toggle', section: 'tools', risk: 'safe', simpleMode: true, default: true },
  { id: 'tool-video', configKey: 'tools.video.enabled', label: 'Video processing', description: 'Analyze and process video files', tooltip: 'Enable AI to work with video content.', type: 'toggle', section: 'tools', risk: 'safe', simpleMode: true, default: false },
  { id: 'tool-automation', configKey: 'tools.automation.enabled', label: 'Automation tools', description: 'Scripts, cron jobs, and workflow tools', tooltip: 'Advanced tools for creating automated workflows.', type: 'toggle', section: 'tools', risk: 'caution', simpleMode: true, default: false },

  // ── Performance ──────────────────────────────
  { id: 'run-location', configKey: 'environment.runtime', label: 'Where tasks run', description: 'Run tasks locally or on external servers', tooltip: 'Local is private but limited by your hardware. External is faster but sends data out.', type: 'select', section: 'performance', risk: 'caution', simpleMode: true, options: [{ value: 'local', label: '💻 This computer' }, { value: 'cloud', label: '☁️ External server' }], default: 'local' },
  { id: 'speed-power', configKey: 'environment.priority', label: 'Speed vs power usage', description: 'Balance between speed and resource consumption', tooltip: 'Eco saves battery and CPU. Performance uses full resources for faster results.', type: 'slider', section: 'performance', risk: 'safe', simpleMode: true, min: 0, max: 100, step: 10, sliderLabels: ['Eco', 'Performance'], default: 50 },
  { id: 'max-concurrent', configKey: 'agents.maxConcurrent', label: 'Max tasks at once', description: 'Maximum number of simultaneous tasks', tooltip: 'More parallel tasks = faster, but uses more CPU and memory.', type: 'number', section: 'performance', risk: 'caution', simpleMode: false, min: 1, max: 20, default: 5 },
  { id: 'timeout', configKey: 'agents.defaultTimeout', label: 'Timeout limits (seconds)', description: 'How long to wait before canceling a stuck task', tooltip: 'Tasks running longer than this will be automatically stopped.', type: 'number', section: 'performance', risk: 'safe', simpleMode: false, min: 30, max: 3600, default: 300 },

  // ── Logs ──────────────────────────────────────
  { id: 'show-history', configKey: 'logging.history.enabled', label: 'Show activity history', description: 'Keep a log of all AI actions', tooltip: 'Records everything the AI does so you can review it later.', type: 'toggle', section: 'logs', risk: 'safe', simpleMode: true, default: true },
  { id: 'error-tracking', configKey: 'logging.errors.enabled', label: 'Error tracking', description: 'Track and report errors automatically', tooltip: 'Helps diagnose problems by keeping detailed error records.', type: 'toggle', section: 'logs', risk: 'safe', simpleMode: true, default: true },
  { id: 'debug-mode', configKey: 'logging.level', label: 'Detailed debug mode', description: 'Show extra technical details in logs', tooltip: 'Only useful for troubleshooting. Makes logs very verbose.', type: 'toggle', section: 'logs', risk: 'safe', simpleMode: false, default: false },

  // ── System ───────────────────────────────────
  { id: 'auto-reconnect', configKey: 'gateway.autoReconnect', label: 'Auto-reconnect', description: 'Automatically reconnect if the connection drops', tooltip: 'When enabled, the system will try to re-establish the connection automatically.', type: 'toggle', section: 'system', risk: 'safe', simpleMode: true, default: true },
];

// ── Default values map ──────────────────────────────────────
export function getDefaultValues(): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  SETTINGS.forEach((s) => { defaults[s.id] = s.default; });
  return defaults;
}

export const RECOMMENDED_PRESET: Record<string, unknown> = {
  'creativity': 50,
  'response-length': 60,
  'main-model': 'gpt-4o',
  'backup-model': 'gpt-4o-mini',
  'thinking-depth': 40,
  'tool-mode': 'auto',
  'allow-actions': false,
  'ask-before-actions': true,
  'file-access': true,
  'internet-access': true,
  'browser-control': false,
  'restricted-mode': 'balanced',
  'browser-enabled': false,
  'max-tabs': 5,
  'keep-sessions': false,
  'auto-tasks': false,
  'failure-behavior': 'notify',
  'parallel-tasks': true,
  'connect-openai': true,
  'usage-warning': true,
  'remember-conversations': true,
  'use-knowledge': true,
  'memory-capacity': 'medium',
  'tool-file-editing': true,
  'tool-web-browsing': true,
  'tool-video': false,
  'tool-automation': false,
  'run-location': 'local',
  'speed-power': 50,
  'max-concurrent': 5,
  'timeout': 300,
  'show-history': true,
  'error-tracking': true,
  'debug-mode': false,
  'auto-reconnect': true,
};
