import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Filter, Zap, Clock, Hash, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMissionControl } from '@/hooks/useMissionControl';
import { Skill } from '@/data/types';

const categoryColors: Record<string, string> = {
  Engineering: 'bg-primary/15 text-primary border-primary/20',
  Content: 'bg-warning/15 text-warning border-warning/20',
  Research: 'bg-info/15 text-info border-info/20',
  Operations: 'bg-success/15 text-success border-success/20',
};

const SkillsPage = () => {
  const { skills, agents, bus } = useMissionControl();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = [...new Set(skills.map((s) => s.category))];
    return ['all', ...cats];
  }, [skills]);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.triggers.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [skills, search, categoryFilter]);

  const activeCount = skills.filter((s) => s.status === 'active').length;
  const totalUsage = skills.reduce((sum, s) => sum + s.usageCount, 0);

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      )
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Skills
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            All available capabilities across your agent network
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="metric-card flex-row items-center !gap-2 !p-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">{activeCount}</span>
            <span className="text-[10px] text-muted-foreground">active</span>
          </div>
          <div className="metric-card flex-row items-center !gap-2 !p-2">
            <Hash className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{totalUsage.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">total uses</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills, triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card/70 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((skill, i) => {
          const linkedAgents = skill.agentIds
            .map((id) => mockAgents.find((a) => a.id === id))
            .filter(Boolean);

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-panel p-4 transition-all ${
                skill.status === 'inactive' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium uppercase border ${
                      categoryColors[skill.category] || 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {skill.category}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{skill.name}</h3>
                </div>
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={skill.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {skill.status === 'active' ? (
                    <ToggleRight className="w-5 h-5 text-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {skill.description}
              </p>

              {/* Triggers */}
              <div className="flex flex-wrap gap-1 mb-3">
                {skill.triggers.map((trigger) => (
                  <span
                    key={trigger}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/60 text-secondary-foreground border border-border/20 font-mono"
                  >
                    {trigger}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <div className="flex items-center gap-1.5">
                  {linkedAgents.length > 0 ? (
                    linkedAgents.map((agent) => (
                      <span
                        key={agent!.id}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                      >
                        {agent!.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-muted-foreground italic">No agents linked</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {skill.usageCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(skill.lastUsed).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No skills match your search.
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
