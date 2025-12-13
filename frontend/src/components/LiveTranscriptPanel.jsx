import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Minimize2, Maximize2, Send, User, Users } from 'lucide-react';

/**
 * 实时语音转文字展示面板
 * 显示实时的语音识别结果和对话流
 */
const LiveTranscriptPanel = ({ 
  isRecording = false,
  transcripts = [],
  currentText = '',
  onClose,
  onClear,
  onSendText  // 新增：发送文本回调
}) => {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('other'); // 'user' | 'other'

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, currentText, isMinimized]);

  // 生成模拟波形数据
  const WaveformAnimation = () => {
    const bars = 20;
    return (
      <div className="flex items-center justify-center gap-0.5 h-8">
        {Array.from({ length: bars }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full"
            animate={{
              height: isRecording 
                ? [4, Math.random() * 24 + 8, 4] 
                : 4
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-28 right-6 z-40"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
            ${isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200'}
            border border-gray-200 dark:border-zinc-700
          `}
        >
          {isRecording ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-medium">录音中...</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span className="text-sm font-medium">语音面板</span>
            </>
          )}
          <Maximize2 size={14} className="ml-1 opacity-60" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[600px] max-w-[90vw]"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${isRecording 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-zinc-400'}
            `}>
              {isRecording ? <Volume2 size={16} /> : <MicOff size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                实时语音转写
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                {isRecording ? '正在捕捉对话...' : '等待开始录音'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {transcripts.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
              >
                清空
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Waveform Visualization */}
        {showWaveform && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
            <WaveformAnimation />
          </div>
        )}

        {/* Transcript Content */}
        <div 
          ref={scrollRef}
          className="max-h-64 overflow-y-auto p-4 space-y-3 scroll-smooth"
        >
          {transcripts.length === 0 && !currentText ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500">
              <Mic size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">开始录音后，对话内容将在这里实时显示</p>
              <p className="text-xs mt-1">支持双人对话自动识别</p>
            </div>
          ) : (
            <>
              {/* Previous transcripts */}
              {transcripts.map((t, index) => (
                <motion.div
                  key={t.id || index}
                  initial={{ opacity: 0, x: t.speaker === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[80%] rounded-2xl px-4 py-2
                    ${t.speaker === 'user' 
                      ? 'bg-indigo-500 text-white rounded-br-md' 
                      : 'bg-gray-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-bl-md'}
                  `}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium opacity-70">
                        {t.speaker === 'user' ? '👤 你' : '🧑 对方'}
                      </span>
                      {t.confidence && (
                        <span className="text-[10px] opacity-50">
                          {Math.round(t.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{t.text}</p>
                    {t.timestamp && (
                      <p className="text-[10px] opacity-50 mt-1 text-right">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Current (in-progress) text */}
              {currentText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2 max-w-[90%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                        正在识别...
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{currentText}</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Text Input Area */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
          {/* Speaker Selection */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">模拟对话:</span>
            <button
              onClick={() => setSelectedSpeaker('user')}
              className={`
                flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all
                ${selectedSpeaker === 'user' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-gray-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}
              `}
            >
              <User size={10} />
              你
            </button>
            <button
              onClick={() => setSelectedSpeaker('other')}
              className={`
                flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all
                ${selectedSpeaker === 'other' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'bg-gray-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}
              `}
            >
              <Users size={10} />
              对方
            </button>
          </div>
          
          {/* Input Field */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputText.trim() && onSendText) {
                  onSendText(inputText.trim(), selectedSpeaker);
                  setInputText('');
                }
              }}
              placeholder="输入文字模拟对话..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200
                placeholder-slate-400 dark:placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                transition-all"
            />
            <button
              onClick={() => {
                if (inputText.trim() && onSendText) {
                  onSendText(inputText.trim(), selectedSpeaker);
                  setInputText('');
                  inputRef.current?.focus();
                }
              }}
              disabled={!inputText.trim()}
              className={`
                p-2 rounded-lg transition-all
                ${inputText.trim()
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-gray-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'}
              `}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/30 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
          <span>共 {transcripts.length} 条对话记录</span>
          <div className="flex items-center gap-3">
            <span>
              {transcripts.reduce((sum, t) => sum + (t.text?.length || 0), 0)} 字
            </span>
            <button
              onClick={() => setShowWaveform(!showWaveform)}
              className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showWaveform ? '隐藏波形' : '显示波形'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveTranscriptPanel;
