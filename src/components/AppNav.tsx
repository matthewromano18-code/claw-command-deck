import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Network, ListTodo, Settings, Sparkles, MessageCircle } from 'lucide-react';
import ChatPanel from './ChatPanel';
import nexxenLogo from '@/assets/nexxen-logo.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Network, label: 'Agents' },
  { to: '/skills', icon: Sparkles, label: 'Skills' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const AppNav = () => {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel-strong border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-foreground tracking-tight text-lg">Nexxen</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">Mission Control</span>
            </div>
            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chatOpen
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-medium text-success">Online</span>
            </div>
          </div>
        </div>
      </header>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default AppNav;
