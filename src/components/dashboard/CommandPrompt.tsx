import { useState } from 'react';
import { Send, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommandPromptProps {
  onSubmit: (prompt: string) => void;
}

const CommandPrompt = ({ onSubmit }: CommandPromptProps) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center gap-3 glass-panel-strong p-2 pl-4 transition-all duration-200 ${
        isFocused ? 'glow-border' : ''
      }`}
    >
      <Terminal className="w-4 h-4 text-primary shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Send a task to Main Agent..."
        className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Send className="w-3.5 h-3.5" />
        Send
      </button>
    </motion.form>
  );
};

export default CommandPrompt;
