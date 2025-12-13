import React from 'react';
import { Clock, MessageSquare, Search } from 'lucide-react';

const HistoryItem = ({ time, text, isUser }) => (
  <div className="group flex gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
    <div className="mt-1">
      <div className={`w-2 h-2 rounded-full ${isUser ? 'bg-slate-400' : 'bg-indigo-500'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-900 dark:text-zinc-200 truncate pr-2">
          {isUser ? '用户' : 'ChatBuff'}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">
          {time}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 leading-snug">
        {text}
      </p>
    </div>
  </div>
);

const ConversationHistory = ({ history = [], onClear }) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-1">历史记录</h2>
          <div className="text-xs text-slate-400 dark:text-zinc-500">仅保留本次会话记录</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-xs px-3 py-1 rounded-md bg-gray-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            清空会话
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 dark:text-zinc-400">会话为空。您可以开始新的对话。</div>
        ) : (
          history.map(item => (
            <HistoryItem key={item.id} time={item.timestamp} text={item.text} isUser={item.isUser} />
          ))
        )}
      </div>

      {/* Footer (User Profile) */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">CB</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-zinc-200">ChatBuff 用户</div>
            <div className="text-xs text-slate-500 dark:text-zinc-500">本次会话仅保留内存</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;
