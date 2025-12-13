import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sun, Moon, MoreHorizontal, Newspaper, Quote, MessageSquare } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import ConversationHistory from './components/ConversationHistory';
import MindMap from './components/MindMap';
import AudioVisualizer from './components/AudioVisualizer';
import LiveTranscriptPanel from './components/LiveTranscriptPanel';

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);
  const [history, setHistory] = useState([
    { id: Date.now(), type: 'system', message: 'System started - Session begins', timestamp: new Date().toLocaleTimeString() }
  ]);
  
  // 实时对话状态
  const [latestTranscript, setLatestTranscript] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  
  // 实时语音转文字状态
  const [transcripts, setTranscripts] = useState([]);
  const [currentStreamingText, setCurrentStreamingText] = useState('');

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Support both old string format and new object format
  const addHistory = useCallback((entry) => {
    const timestamp = new Date().toLocaleTimeString();
    if (typeof entry === 'string') {
      setHistory(prev => [...prev, { id: Date.now() + Math.random(), type: 'event', message: entry, timestamp }]);
    } else {
      setHistory(prev => [...prev, { id: Date.now() + Math.random(), ...entry, timestamp: entry.timestamp || timestamp }]);
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    setSuggestions([]);
    setRelatedNews([]);
    setLatestTranscript(null);
    setTranscripts([]);
    setCurrentStreamingText('');
    const timestamp = new Date().toLocaleTimeString();
    setHistory([{ id: Date.now(), type: 'system', message: 'Session cleared - New session begins', timestamp }]);
  };

  // 清空转录记录
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCurrentStreamingText('');
  }, []);

  // 处理语音转录结果
  const handleTranscript = useCallback((data) => {
    setLatestTranscript(data);
    
    // 添加到转录列表
    setTranscripts(prev => [...prev, {
      id: Date.now(),
      text: data.text,
      speaker: data.speaker,
      confidence: data.confidence,
      timestamp: data.timestamp || new Date().toISOString()
    }]);
    
    // 清空流式文本
    setCurrentStreamingText('');
    
    addHistory({
      type: data.speaker === 'user' ? 'user' : 'other',
      message: `${data.speaker === 'user' ? '👤 你' : '🧑 对方'}: ${data.text}`,
      confidence: data.confidence
    });
  }, [addHistory]);

  // 处理流式文本更新
  const handleStreamingText = useCallback((text) => {
    setCurrentStreamingText(text);
  }, []);

  // 处理录音状态变化
  const handleRecordingChange = useCallback((recording) => {
    setIsRecording(recording);
    if (recording) {
      setShowTranscriptPanel(true);
    }
  }, []);

  // 处理文本输入 - 模拟对话
  const handleSendText = useCallback(async (text, speaker) => {
    // 先添加到转录列表显示
    const newTranscript = {
      id: Date.now(),
      text: text,
      speaker: speaker,
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };
    
    setTranscripts(prev => [...prev, newTranscript]);
    
    addHistory({
      type: speaker === 'user' ? 'user' : 'other',
      message: `${speaker === 'user' ? '👤 你' : '🧑 对方'}: ${text}`,
      confidence: 1.0
    });

    // 调用后端 API 获取建议
    try {
      const response = await fetch('http://localhost:8000/api/assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        if (data.related_news) {
          setRelatedNews(data.related_news);
        }
        
        addHistory({
          type: 'generate',
          message: `AI 生成了 ${data.suggestions?.length || 0} 条建议`,
          tokens: data.suggestions?.reduce((sum, s) => sum + Math.ceil(s.content.length / 1.5), 0) || 0
        });
      }
    } catch (error) {
      console.error('获取建议失败:', error);
    }
  }, [addHistory]);

  // 处理建议
  const handleSuggestions = useCallback((data) => {
    if (data.suggestions) {
      setSuggestions(data.suggestions);
    }
    if (data.related_news) {
      setRelatedNews(data.related_news);
    }
    
    // 记录到历史
    if (data.suggestions?.length > 0) {
      addHistory({
        type: 'generate',
        message: `AI 生成了 ${data.suggestions.length} 条建议`,
        tokens: data.suggestions.reduce((sum, s) => sum + Math.ceil(s.content.length / 1.5), 0)
      });
    }
  }, [addHistory]);

  return (
    <div className="h-screen w-screen bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Top Bar */}
      <div className="h-12 border-b border-gray-100 dark:border-zinc-800 flex items-center px-6 justify-between select-none bg-white dark:bg-zinc-900 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-indigo-600" />
          <span className="font-semibold text-sm tracking-tight">ChatBuff</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            实时对话助手
          </span>
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

          {/* Resizer */}
          <PanelResizeHandle className="w-1 hover:bg-indigo-500/20 transition-colors flex items-center justify-center group focus:outline-none cursor-col-resize" />

          {/* Center Pane: Mind Map */}
          <Panel defaultSize={50}>
            <div className="h-full w-full relative bg-gray-50/50 dark:bg-zinc-900">
              <MindMap addHistory={addHistory} />
            </div>
          </Panel>

          {/* Resizer */}
          <PanelResizeHandle className="w-1 hover:bg-indigo-500/20 transition-colors flex items-center justify-center group focus:outline-none cursor-col-resize" />

          {/* Right Pane: Suggestions & News */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-gray-100 dark:border-zinc-800">
              
              {/* Suggestions Section */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Quote size={12} />
                  实时建议
                </h3>
                
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => (
                      <div 
                        key={i}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm
                          ${s.type === 'quote' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20' :
                            s.type === 'insight' ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20' :
                            s.type === 'humor' ? 'border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-900/20' :
                            'border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/50'}
                        `}
                      >
                        <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase mb-1">
                          {s.type === 'quote' ? '📜 名言' :
                           s.type === 'insight' ? '💡 深度' :
                           s.type === 'humor' ? '😄 幽默' :
                           s.type === 'question' ? '❓ 追问' :
                           '💭 建议'}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-zinc-200">{s.content}</p>
                        {s.source && (
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">— {s.source}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">
                    开始对话后将显示实时建议
                  </div>
                )}
              </div>

              {/* News Section */}
              <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Newspaper size={12} />
                  相关资讯
                </h3>
                
                {relatedNews.length > 0 ? (
                  <div className="space-y-2">
                    {relatedNews.map((news, i) => (
                      <div key={i} className="p-2 rounded bg-slate-50 dark:bg-zinc-800/50">
                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-200 line-clamp-1">{news.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">{news.source}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">
                    暂无相关资讯
                  </div>
                )}
              </div>
            </div>
          </Panel>

        </PanelGroup>
        
        {/* Live Transcript Panel */}
        <AnimatePresence>
          {showTranscriptPanel && (
            <LiveTranscriptPanel
              isRecording={isRecording}
              transcripts={transcripts}
              currentText={currentStreamingText}
              onClose={() => setShowTranscriptPanel(false)}
              onClear={clearTranscripts}
              onSendText={handleSendText}
            />
          )}
        </AnimatePresence>

        {/* Toggle Transcript Panel Button */}
        {!showTranscriptPanel && (
          <button
            onClick={() => setShowTranscriptPanel(true)}
            className="fixed bottom-28 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full 
              bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200
              border border-gray-200 dark:border-zinc-700 shadow-lg
              hover:shadow-xl transition-all"
          >
            <MessageSquare size={16} />
            <span className="text-sm font-medium">显示语音面板</span>
          </button>
        )}
        
        {/* Floating Audio Visualizer */}
        <AudioVisualizer 
          isActive={isListening} 
          onClick={(recording) => setIsListening(recording)}
          onTranscript={handleTranscript}
          onSuggestions={handleSuggestions}
          onStreamingText={handleStreamingText}
          onRecordingChange={handleRecordingChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;
