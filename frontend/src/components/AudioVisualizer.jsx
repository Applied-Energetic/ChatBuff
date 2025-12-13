import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AudioVisualizer = ({ isActive = false, onClick, onTranscript, onSuggestions }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wsRef = useRef(null);
  const clientIdRef = useRef(`client-${Date.now()}`);

  // WebSocket 连接
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${clientIdRef.current}`);
    
    ws.onopen = () => {
      console.log('✅ WebSocket 连接成功');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'transcript' && onTranscript) {
          onTranscript(data.data);
        }
        
        if (data.type === 'suggestions' && onSuggestions) {
          onSuggestions(data.data);
        }
      } catch (e) {
        console.error('WebSocket 消息解析失败:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('❌ WebSocket 连接关闭');
      setWsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
    
    wsRef.current = ws;
  }, [onTranscript, onSuggestions]);

  // 组件挂载时尝试连接 WebSocket
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // 每秒收集一次数据
      setIsRecording(true);
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 处理音频
  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // 转换为 Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        
        // 通过 WebSocket 发送
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            audio_data: base64Audio,
            sample_rate: 16000
          }));
        } else {
          // 回退到 HTTP API
          sendViaHttp(base64Audio);
        }
        
        setIsProcessing(false);
      };
      
    } catch (error) {
      console.error('音频处理失败:', error);
      setIsProcessing(false);
    }
  };

  // HTTP 回退方式
  const sendViaHttp = async (base64Audio) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_data: base64Audio,
          sample_rate: 16000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onTranscript) {
          onTranscript(data);
        }
      }
    } catch (error) {
      console.error('HTTP 请求失败:', error);
    }
  };

  // 处理点击
  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    
    if (onClick) {
      onClick(!isRecording);
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      
      {/* Status Text */}
      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wide"
          >
            {isProcessing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                正在录音...
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status */}
      <div className={`text-[10px] ${wsConnected ? 'text-green-500' : 'text-slate-400'}`}>
        {wsConnected ? '● 实时连接' : '○ 离线模式'}
      </div>

      {/* Button */}
      <button 
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full 
          transition-all duration-300 focus:outline-none cursor-pointer
          ${isRecording 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
            : isProcessing
              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500'
              : 'bg-white text-slate-900 dark:bg-zinc-800 dark:text-zinc-300 shadow-md hover:shadow-lg border border-slate-200 dark:border-zinc-700'}
        `}
      >
        {/* Pulse Ring (Recording State) */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/50"
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {isProcessing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={24} strokeWidth={1.5} />
        ) : (
          <Mic size={24} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
};

export default AudioVisualizer;
