import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, Copy, Check, Zap, Activity } from 'lucide-react'
import './index.css'

export default function Dashboard() {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [relatedQuotes, setRelatedQuotes] = useState([])
  const [transcript, setTranscript] = useState([
    { timestamp: '14:23:01', text: '系统已启动，等待用户输入...' },
    { timestamp: '14:23:02', text: 'RAG 向量数据库：就绪 [4 条记录]' },
    { timestamp: '14:23:03', text: 'DeepSeek LLM 连接：正常' },
  ])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const transcriptEndRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚动到最新日志
  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [transcript])

  // 获取建议
  const handleGetSuggestion = async () => {
    if (!input.trim()) return

    // 添加到转录日志
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setTranscript(prev => [...prev, { timestamp, text: `> 用户输入: ${input}` }])

    setLoading(true)
    try {
      const response = await fetch('/api/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setRelatedQuotes(data.related_quotes || [])
        setTranscript(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: `✓ 已生成 ${data.suggestions?.length || 0} 条建议和 ${data.related_quotes?.length || 0} 条相关引用` },
        ])
      } else {
        setTranscript(prev => [...prev, { timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: '✗ API 调用失败' }])
      }
    } catch (error) {
      console.error('获取建议失败:', error)
      setTranscript(prev => [...prev, { timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), text: `✗ 错误: ${error.message}` }])
    } finally {
      setLoading(false)
    }

    setInput('')
    inputRef.current?.focus()
  }

  // 复制到剪贴板
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  // 处理回车键
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGetSuggestion()
    }
  }

  // 切换麦克风（示例）
  const toggleListening = () => {
    setIsListening(!isListening)
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    if (!isListening) {
      setTranscript(prev => [...prev, { timestamp, text: '🎤 语音输入已启动...' }])
    } else {
      setTranscript(prev => [...prev, { timestamp, text: '🎤 语音输入已关闭' }])
    }
  }

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-mono">
      {/* 动态背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* HEADER */}
      <motion.header
        className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              ChatBuff System
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-sm text-slate-400">v0.1.0</div>
          </div>

          <div className="flex items-center gap-6">
            <motion.div
              className="flex items-center gap-2 text-sm"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-cyan-400 font-semibold">SYSTEM ONLINE</span>
            </motion.div>
            <motion.div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-violet-500" />
              <span className="text-slate-400">{transcript.length} Events</span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* MAIN AREA: 2-Column Layout */}
      <div className="relative z-10 flex-1 flex gap-4 overflow-hidden px-6 py-4">
        {/* LEFT: Transcript Panel */}
        <motion.div
          className="flex-1 border border-white/10 rounded-lg bg-slate-950/50 backdrop-blur-md overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="border-b border-white/10 px-4 py-3 bg-slate-900/40">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              Transcript Log
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 log-panel">
            <AnimatePresence>
              {transcript.map((entry, idx) => (
                <motion.div
                  key={idx}
                  className="text-xs leading-relaxed"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-violet-400 font-semibold">[{entry.timestamp}]</span>
                  <span className="ml-2 text-slate-300">{entry.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={transcriptEndRef} />
          </div>
        </motion.div>

        {/* RIGHT: Suggestions Panel */}
        <motion.div
          className="w-96 border border-white/10 rounded-lg bg-slate-950/50 backdrop-blur-md overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="border-b border-white/10 px-4 py-3 bg-slate-900/40">
            <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
              Knowledge Fragments
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 knowledge-panel">
            {!loading && suggestions.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Zap className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs text-center">等待用户输入...</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </div>
            )}

            <AnimatePresence>
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  className="group hud-card p-3 rounded border border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 cursor-pointer transition-all duration-300 hover:border-cyan-500/70 hover:shadow-glow-cyan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                      Suggestion #{idx + 1}
                    </div>
                    <motion.button
                      onClick={() => copyToClipboard(suggestion, idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copied === idx ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                      )}
                    </motion.button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200">
                    {suggestion}
                  </p>
                </motion.div>
              ))}

              {relatedQuotes.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-violet-400 uppercase mb-2">
                    Related Quotes
                  </div>
                  {relatedQuotes.map((quote, idx) => (
                    <motion.div
                      key={`quote-${idx}`}
                      className="p-2 rounded text-xs bg-violet-500/5 border border-violet-500/30 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: suggestions.length * 0.1 + idx * 0.08 }}
                    >
                      <p className="text-slate-300 italic">"{quote.quote || quote}"</p>
                      {quote.author && <p className="text-slate-500 text-xs mt-1">— {quote.author}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM BAR: Input & Controls */}
      <motion.footer
        className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <motion.button
            onClick={toggleListening}
            className={`p-3 rounded transition-all duration-300 ${
              isListening
                ? 'bg-red-500/30 border border-red-500/80 text-red-400 shadow-glow-red'
                : 'bg-slate-800 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic className="w-5 h-5" />
          </motion.button>

          {/* Input Field */}
          <div className="flex-1 relative group">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的想法或想说的话..."
              className="w-full bg-slate-800 border border-white/10 rounded px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300 font-mono"
            />
            <div className="absolute inset-0 rounded pointer-events-none border border-cyan-500/0 group-focus-within:border-cyan-500/30 transition-colors duration-300" />
          </div>

          {/* Send Button */}
          <motion.button
            onClick={handleGetSuggestion}
            disabled={loading || !input.trim()}
            className="p-3 rounded bg-gradient-to-r from-cyan-500 to-violet-500 text-slate-950 font-bold hover:shadow-glow-mix disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            whileHover={!loading && input.trim() ? { scale: 1.05 } : {}}
            whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.footer>
    </div>
  )
}
