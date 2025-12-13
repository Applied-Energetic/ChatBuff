import React from 'react';
import { Clock, MessageSquare, Search, Zap, AlertCircle, CheckCircle, GitBranch } from 'lucide-react';

const HistoryItem = ({ item }) => {
  // Support both old format (string) and new format (object with type, message, tokens, timestamp)
  const isOldFormat = typeof item === 'string' || (item && typeof item.text === 'string' && !item.type);
  
  if (isOldFormat) {
    const text = typeof item === 'string' ? item : item.text;
    const time = item.timestamp || new Date().toLocaleTimeString();
    return (
      <div className="group flex gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
        <div className="mt-1">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Event</span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">{time}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-300 line-clamp-2 leading-snug">{text}</p>
        </div>
      </div>
    );
  }

  // New structured format
  const { type, message, tokens, timestamp } = item;
  
  const getTypeConfig = (t) => {
    switch(t) {
      case 'generate':
        return { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'AI Generated' };
      case 'commit':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Committed' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Error' };
      default:
        return { icon: GitBranch, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-zinc-800', label: 'Event' };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <div className={`group flex gap-3 p-3 rounded-lg ${config.bg} transition-colors`}>
      <div className="mt-0.5">
        <Icon size={14} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-medium ${config.color} uppercase tracking-wide`}>{config.label}</span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">{timestamp}</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-zinc-200 line-clamp-2 leading-snug">{message}</p>
        {tokens && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
            <Zap size={10} />
            <span>~{tokens} tokens consumed</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationHistory = ({ history = [], onClear }) => {
  // Calculate total tokens used in session
  const totalTokens = history.reduce((sum, item) => {
    if (typeof item === 'object' && item.tokens) return sum + item.tokens;
    return sum;
  }, 0);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">Session Log</h2>
          <div className="text-xs text-slate-400 dark:text-zinc-500">Session-only, not persisted</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-xs px-3 py-1 rounded-md bg-gray-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Token Counter */}
      {totalTokens > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <Zap size={12} />
              Session Token Usage
            </span>
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">~{totalTokens} tokens</span>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 dark:text-zinc-400 text-center">
            <GitBranch size={24} className="mx-auto mb-2 opacity-30" />
            Session is empty. Click on a node to start branching.
          </div>
        ) : (
          [...history].reverse().map((item, idx) => (
            <HistoryItem key={item.id || idx} item={item} />
          ))
        )}
      </div>

      {/* Footer (User Profile) */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">CB</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-zinc-200">ChatBuff User</div>
            <div className="text-xs text-slate-500 dark:text-zinc-500">Session in memory only</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;
