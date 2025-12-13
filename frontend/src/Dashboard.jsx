import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sun, Moon, MoreHorizontal } from 'lucide-react';

import ConversationHistory from './components/ConversationHistory';
import MindMap from './components/MindMap';
import AudioVisualizer from './components/AudioVisualizer';

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState([
    { id: Date.now(), type: 'system', message: 'System started - Session begins', timestamp: new Date().toLocaleTimeString() }
  ]);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Support both old string format and new object format
  const addHistory = (entry) => {
    const timestamp = new Date().toLocaleTimeString();
    if (typeof entry === 'string') {
      // Old format: just a string
      setHistory(prev => [...prev, { id: Date.now() + Math.random(), type: 'event', message: entry, timestamp }]);
    } else {
      // New format: object with type, message, tokens, etc.
      setHistory(prev => [...prev, { id: Date.now() + Math.random(), ...entry, timestamp: entry.timestamp || timestamp }]);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    const timestamp = new Date().toLocaleTimeString();
    setHistory([{ id: Date.now(), type: 'system', message: 'Session cleared - New session begins', timestamp }]);
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Top Bar (Minimal) */}
      <div className="h-12 border-b border-gray-100 dark:border-zinc-800 flex items-center px-6 justify-between select-none bg-white dark:bg-zinc-900 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-indigo-600" />
          <span className="font-semibold text-sm tracking-tight">ChatBuff</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-48px)] relative">
        <PanelGroup direction="horizontal">
          
          {/* Left Pane: History */}
          <Panel defaultSize={25} minSize={20} maxSize={35} className="bg-white dark:bg-zinc-900">
            <ConversationHistory history={history} onClear={clearHistory} />
          </Panel>

          {/* Resizer (Invisible but draggable) */}
          <PanelResizeHandle className="w-1 hover:bg-indigo-500/20 transition-colors flex items-center justify-center group focus:outline-none cursor-col-resize" />

          {/* Right Pane: Mind Map */}
          <Panel defaultSize={75}>
            <div className="h-full w-full relative bg-gray-50/50 dark:bg-zinc-900">
              <MindMap addHistory={addHistory} />
              
              {/* Floating Audio Visualizer */}
              <AudioVisualizer 
                isActive={isListening} 
                onClick={() => {
                  const next = !isListening;
                  setIsListening(next);
                  addHistory(next ? '🎤 语音输入已启动' : '🎤 语音输入已停止', false);
                }}
              />
            </div>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
};

export default Dashboard;
