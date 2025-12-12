import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send, Sparkles, Copy, Check } from 'lucide-react'
import './index.css'

export default function App() {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [relatedQuotes, setRelatedQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef(null)

  // 获取建议
  const handleGetSuggestion = async () => {
    if (!input.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setRelatedQuotes(data.related_quotes)
      }
    } catch (error) {
      console.error('获取建议失败:', error)
    } finally {
      setLoading(false)
    }
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

  // 监听语音（未来实现）
  const toggleListening = () => {
    setIsListening(!isListening)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* 动态背景 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* 主容器 */}
      <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6 sm:py-8">
        
        {/* 顶部标题区 */}
        <motion.header
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl font-bold font-code gradient-text">
              ChatBuff
            </h1>
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            你的实时社交副驾驶 · 让每一句回复都掷地有声
          </p>
        </motion.header>

        {/* 输入区 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="glass p-4 sm:p-6">
            <label className="block text-sm text-slate-400 mb-3 font-code">
              输入你想说的话
            </label>
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="例如：今天心情不好"
                className="input-primary flex-1 resize-none h-24 sm:h-32"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGetSuggestion}
                  disabled={loading || !input.trim()}
                  className="btn-primary flex-1 h-full flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">获取建议</span>
                </button>
                <button
                  onClick={toggleListening}
                  className={`px-3 py-2 sm:px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isListening
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'glass text-slate-200 hover:border-cyan-500/30'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">
                    {isListening ? '录音中' : '语音'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 结果区 */}
        {(suggestions.length > 0 || loading) && (
          <motion.div
            className="flex-1 flex flex-col gap-6 min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 建议区 */}
            <div className="flex-1 overflow-y-auto">
              <div className="glass p-4 sm:p-6 h-full flex flex-col">
                <h2 className="text-lg font-semibold text-cyan-400 mb-4 font-code flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  智能建议
                </h2>
                
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass p-3 sm:p-4 group hover:border-cyan-500/30 cursor-pointer"
                        onClick={() => copyToClipboard(suggestion, index)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-cyan-400 font-code text-sm flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 text-sm sm:text-base break-words">
                              {suggestion}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(suggestion, index)
                            }}
                            className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {copied === index ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 相关金句区 */}
            {relatedQuotes.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <div className="glass p-4 sm:p-6 h-full flex flex-col">
                  <h2 className="text-lg font-semibold text-violet-400 mb-4 font-code flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    相关金句
                  </h2>
                  <div className="space-y-3 overflow-y-auto">
                    {relatedQuotes.map((quote, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass p-3 sm:p-4 border-l-2 border-violet-500/50 hover:border-violet-400"
                      >
                        <p className="text-slate-200 italic text-sm sm:text-base mb-2">
                          「{quote.quote}」
                        </p>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs text-slate-400 font-code">
                          <span>—— {quote.author}</span>
                          <span className="text-violet-400/70">《{quote.source}》</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                          💡 {quote.context}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 空状态 */}
        {suggestions.length === 0 && !loading && (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-4"
              >
                <Sparkles className="w-12 h-12 mx-auto text-cyan-400/50" />
              </motion.div>
              <p className="text-slate-400 text-sm">
                输入你想说的话，获取智能建议
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 底部信息栏 */}
      <motion.footer
        className="relative z-10 text-center py-4 border-t border-white/5 text-xs text-slate-500 font-code"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <p>ChatBuff v0.1.0 · Powered by DeepSeek AI</p>
      </motion.footer>
    </div>
  )
}
