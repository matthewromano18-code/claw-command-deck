import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/data/chatTypes';
import bus from '@/integration';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const welcomeMsg: ChatMessage = {
  id: 'sys-1',
  role: 'agent',
  content: "👋 Hey! I'm your **Main Agent**. I'll post task results here as they complete. You can also ask me questions or give me instructions directly.",
  timestamp: new Date().toISOString(),
  agentName: 'Main Agent',
};

const ChatPanel = ({ open, onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMsg]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for agent-pushed chat messages
  useEffect(() => {
    const unsub = bus.on('chat:message', (event) => {
      setMessages((prev) => [...prev, event.payload as ChatMessage]);
    });
    return unsub;
  }, []);

  // Listen for task completions → auto-post to chat
  useEffect(() => {
    const unsub = bus.on('task:complete', (event) => {
      const state = bus.getState();
      const task = state.tasks.find((t) => t.id === event.payload.taskId);
      if (task) {
        const msg: ChatMessage = {
          id: `auto-${Date.now()}`,
          role: 'agent',
          content: `✅ **Task Complete**\n\n> ${task.prompt}\n\n**Result:** ${task.result || 'Done'}${task.confidence ? `\n**Confidence:** ${(task.confidence * 100).toFixed(0)}%` : ''}${task.duration ? ` · **Duration:** ${Math.floor(task.duration / 60)}m ${task.duration % 60}s` : ''}`,
          timestamp: new Date().toISOString(),
          taskId: task.id,
          agentName: 'Main Agent',
        };
        setMessages((prev) => [...prev, msg]);
      }
    });
    return unsub;
  }, []);

  // Listen for chat clear
  useEffect(() => {
    const unsub = bus.on('chat:clear', () => {
      setMessages([welcomeMsg]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setIsTyping(true);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: generateMockReply(userMsg.content),
        timestamp: new Date().toISOString(),
        agentName: 'Main Agent',
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 1200 + Math.random() * 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-4 top-14 bottom-4 w-[400px] z-50 glass-panel-strong border border-border/50 shadow-2xl flex flex-col rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Agent Chat</h3>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                    Online
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'agent' ? 'bg-primary/15' : 'bg-secondary'}`}>
                    {msg.role === 'agent' ? <Bot className="w-3 h-3 text-primary" /> : <User className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'agent' ? 'bg-secondary/50 text-foreground rounded-tl-sm' : 'bg-primary/15 text-foreground rounded-tr-sm'}`}>
                    {msg.agentName && msg.role === 'agent' && (
                      <span className="text-[9px] font-semibold text-primary block mb-0.5">{msg.agentName}</span>
                    )}
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_blockquote]:my-1 [&_blockquote]:pl-2 [&_blockquote]:border-primary/30 [&_strong]:text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-secondary/50 px-3 py-2 rounded-xl rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-border/30">
              <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-1.5 border border-border/30 focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to agent..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function generateMockReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('status') || lower.includes('how are')) {
    return "All systems operational. **2 tasks active**, 1 queued. Success rate is at **96%** and uptime is **99.97%**. Everything's running smoothly.";
  }
  if (lower.includes('task') || lower.includes('working on')) {
    return "Currently processing:\n\n1. **Build landing page** → Frontend Dev (running)\n2. **Write AI trends blog** → Copywriter (thinking)\n\nBoth on track. Want me to prioritize one?";
  }
  if (lower.includes('help') || lower.includes('what can')) {
    return "Here's what I can do:\n\n- 📋 **Submit tasks** and route them to the right department\n- 📊 **Monitor** all agent activity in real-time\n- ⚙️ **Configure** settings, routing, and guardrails\n- 📝 **Report** on completed work and metrics\n\nJust tell me what you need!";
  }
  if (lower.includes('stop') || lower.includes('pause') || lower.includes('cancel')) {
    return "Got it. I can pause active tasks or cancel queued ones. Which task do you want me to act on? You can reference it by name or check the **Tasks** tab.";
  }
  return `Understood. I'll process that and update you here when it's done. You can track progress in the **Dashboard** or check the **Tasks** tab for details.`;
}

export default ChatPanel;
