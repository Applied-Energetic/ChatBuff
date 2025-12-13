import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const AudioVisualizer = ({ 
  isActive = false, 
  onClick, 
  onTranscript, 
  onSuggestions,
  onStreamingText,  // 新增：实时流式文本回调
  onRecordingChange // 新增：录音状态变化回调
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wsRef = useRef(null);
  const clientIdRef = useRef(`client-${Date.now()}`);
  const streamIntervalRef = useRef(null);

  // 通知录音状态变化
  useEffect(() => {
    if (onRecordingChange) {
      onRecordingChange(isRecording);
    }
  }, [isRecording, onRecordingChange]);

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
        
        // 处理流式文本更新
        if (data.type === 'streaming_text') {
          setStreamingText(data.text);
          if (onStreamingText) {
            onStreamingText(data.text);
          }
        }
        
        // 处理完整转录
        if (data.type === 'transcript' && onTranscript) {
          setStreamingText(''); // 清空流式文本
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
  }, [onTranscript, onSuggestions, onStreamingText]);

  // 组件挂载时尝试连接 WebSocket
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
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
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 检查支持的 MIME 类型
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';
      
      console.log('使用音频格式:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`收集音频块: ${event.data.size} bytes, 总计: ${audioChunksRef.current.length} 块`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log(`录音结束，共 ${audioChunksRef.current.length} 个音频块`);
        if (audioChunksRef.current.length > 0) {
          await processAudio();
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      // 每2秒收集一次数据，确保有足够的音频数据
      mediaRecorder.start(2000);
      setIsRecording(true);
      console.log('✅ 开始录音');
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置\n错误: ' + error.message);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 停止录音');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 处理音频
  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('没有音频数据');
      return;
    }
    
    setIsProcessing(true);
    console.log('🔄 处理音频...');
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log(`音频大小: ${audioBlob.size} bytes`);
      
      // 检查音频是否太小
      if (audioBlob.size < 1000) {
        console.log('音频太短，跳过处理');
        setIsProcessing(false);
        return;
      }
      
      // 转换为 Base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        console.log(`Base64 长度: ${base64Audio.length}`);
        
        // 优先使用 HTTP API（更稳定）
        await sendViaHttp(base64Audio);
        
        setIsProcessing(false);
      };
      
      reader.onerror = (error) => {
        console.error('FileReader 错误:', error);
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('音频处理失败:', error);
      setIsProcessing(false);
    }
  };

  // HTTP API 发送音频
  const sendViaHttp = async (base64Audio) => {
    console.log('📤 发送音频到服务器...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          sample_rate: 16000,
          format: 'webm'
        })
      });
      
      console.log('服务器响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 转录结果:', data);
        
        if (data.text && data.text.trim()) {
          if (onTranscript) {
            onTranscript(data);
          }
        } else {
          console.log('⚠️ 转录结果为空');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ 服务器错误:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ HTTP 请求失败:', error);
      // 尝试 WebSocket 作为备选
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('尝试 WebSocket 发送...');
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          audio_data: base64Audio,
          sample_rate: 16000
        }));
      }
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
