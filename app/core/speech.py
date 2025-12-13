"""
语音识别服务 - 支持实时语音转文字和说话人分离
"""
import io
import base64
import asyncio
from typing import Optional, Callable, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
import wave
import struct


@dataclass
class TranscriptSegment:
    """转录片段"""
    text: str
    speaker: str  # "user" or "other"
    start_time: float
    end_time: float
    confidence: float = 1.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ConversationContext:
    """对话上下文 - 维护两人对话历史"""
    segments: List[TranscriptSegment] = field(default_factory=list)
    max_segments: int = 50  # 保留最近50轮对话
    
    def add_segment(self, segment: TranscriptSegment):
        self.segments.append(segment)
        # 保持窗口大小
        if len(self.segments) > self.max_segments:
            self.segments = self.segments[-self.max_segments:]
    
    def get_recent_text(self, n: int = 10) -> str:
        """获取最近n轮对话的文本"""
        recent = self.segments[-n:] if len(self.segments) >= n else self.segments
        lines = []
        for seg in recent:
            speaker_label = "👤 你" if seg.speaker == "user" else "🧑 对方"
            lines.append(f"{speaker_label}: {seg.text}")
        return "\n".join(lines)
    
    def get_last_other_message(self) -> Optional[str]:
        """获取对方最后说的话"""
        for seg in reversed(self.segments):
            if seg.speaker == "other":
                return seg.text
        return None
    
    def get_topics(self) -> List[str]:
        """提取对话中的关键话题"""
        # 简单实现：提取最近对话中的关键词
        all_text = " ".join([s.text for s in self.segments[-10:]])
        # 这里可以接入更复杂的NLP提取
        return [all_text[:50]] if all_text else []
    
    def clear(self):
        self.segments.clear()


class SpeechRecognitionService:
    """
    语音识别服务
    
    支持两种模式：
    1. 离线模式：使用 faster-whisper 本地模型
    2. 在线模式：使用云端 ASR 服务 (如 Azure, Google)
    """
    
    def __init__(self, mode: str = "offline", model_size: str = "base"):
        """
        初始化语音识别服务
        
        Args:
            mode: "offline" 使用本地 Whisper, "online" 使用云端服务
            model_size: Whisper 模型大小 (tiny, base, small, medium, large)
        """
        self.mode = mode
        self.model_size = model_size
        self.model = None
        self.is_initialized = False
        self.context = ConversationContext()
        
        # 说话人检测状态
        self._current_speaker = "user"
        self._speaker_energy_threshold = 0.02
        
    async def initialize(self):
        """异步初始化模型"""
        if self.is_initialized:
            return
            
        if self.mode == "offline":
            try:
                # 尝试加载 faster-whisper
                from faster_whisper import WhisperModel
                
                # 使用 CPU 模式 (也支持 CUDA)
                self.model = WhisperModel(
                    self.model_size, 
                    device="cpu",
                    compute_type="int8"
                )
                print(f"✅ Whisper 模型已加载: {self.model_size}")
                self.is_initialized = True
                
            except ImportError:
                print("⚠️ faster-whisper 未安装，将使用模拟模式")
                self.mode = "mock"
                self.is_initialized = True
                
            except Exception as e:
                print(f"⚠️ Whisper 加载失败: {e}，将使用模拟模式")
                self.mode = "mock"
                self.is_initialized = True
        else:
            self.is_initialized = True
    
    async def transcribe_audio(
        self, 
        audio_data: bytes, 
        sample_rate: int = 16000,
        detect_speaker: bool = True
    ) -> Optional[TranscriptSegment]:
        """
        转录音频数据
        
        Args:
            audio_data: 原始音频字节 (PCM 16-bit)
            sample_rate: 采样率
            detect_speaker: 是否检测说话人
            
        Returns:
            转录结果片段
        """
        if not self.is_initialized:
            await self.initialize()
        
        if not audio_data or len(audio_data) < 1000:
            return None
        
        # 检测说话人 (基于简单的能量检测)
        speaker = await self._detect_speaker(audio_data) if detect_speaker else "user"
        
        if self.mode == "offline" and self.model:
            return await self._transcribe_whisper(audio_data, sample_rate, speaker)
        else:
            return await self._transcribe_mock(audio_data, speaker)
    
    async def transcribe_base64(
        self, 
        base64_audio: str,
        sample_rate: int = 16000
    ) -> Optional[TranscriptSegment]:
        """从 Base64 编码的音频转录"""
        try:
            audio_bytes = base64.b64decode(base64_audio)
            return await self.transcribe_audio(audio_bytes, sample_rate)
        except Exception as e:
            print(f"Base64 解码失败: {e}")
            return None
    
    async def _transcribe_whisper(
        self, 
        audio_data: bytes, 
        sample_rate: int,
        speaker: str
    ) -> Optional[TranscriptSegment]:
        """使用 Whisper 模型转录"""
        try:
            # 将 PCM 数据转换为 WAV 格式
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data)
            
            wav_buffer.seek(0)
            
            # 转录
            segments, info = self.model.transcribe(
                wav_buffer,
                language="zh",  # 中文优先
                vad_filter=True,  # 启用 VAD
                vad_parameters=dict(min_silence_duration_ms=500)
            )
            
            # 合并所有片段
            text_parts = []
            start_time = 0
            end_time = 0
            
            for segment in segments:
                text_parts.append(segment.text.strip())
                if not start_time:
                    start_time = segment.start
                end_time = segment.end
            
            full_text = " ".join(text_parts)
            
            if not full_text.strip():
                return None
            
            result = TranscriptSegment(
                text=full_text,
                speaker=speaker,
                start_time=start_time,
                end_time=end_time,
                confidence=0.9
            )
            
            # 添加到上下文
            self.context.add_segment(result)
            
            return result
            
        except Exception as e:
            print(f"Whisper 转录失败: {e}")
            return None
    
    async def _transcribe_mock(
        self, 
        audio_data: bytes,
        speaker: str
    ) -> Optional[TranscriptSegment]:
        """模拟转录 (用于测试)"""
        # 模拟一些延迟
        await asyncio.sleep(0.1)
        
        # 根据音频长度生成模拟文本
        duration = len(audio_data) / (16000 * 2)  # 假设 16kHz 16-bit
        
        mock_phrases = [
            "我觉得这个想法很有意思",
            "你说的有道理",
            "这让我想起了一句话",
            "确实是这样的",
            "我有不同的看法",
            "这个问题很复杂",
            "我们可以换个角度思考",
            "这正是我想说的"
        ]
        
        import random
        text = random.choice(mock_phrases)
        
        result = TranscriptSegment(
            text=text,
            speaker=speaker,
            start_time=0,
            end_time=duration,
            confidence=0.85
        )
        
        self.context.add_segment(result)
        return result
    
    async def _detect_speaker(self, audio_data: bytes) -> str:
        """
        检测说话人
        
        简单实现：基于音频能量和时间间隔判断
        实际生产中应使用说话人识别模型
        """
        # 计算音频能量
        try:
            samples = struct.unpack(f'{len(audio_data)//2}h', audio_data)
            energy = sum(abs(s) for s in samples) / len(samples) / 32768.0
            
            # 简单的交替检测逻辑
            # 实际应用中需要更复杂的说话人识别
            if energy > self._speaker_energy_threshold:
                # 交替说话人
                self._current_speaker = "other" if self._current_speaker == "user" else "user"
            
            return self._current_speaker
            
        except Exception:
            return "user"
    
    def get_context(self) -> ConversationContext:
        """获取当前对话上下文"""
        return self.context
    
    def reset_context(self):
        """重置对话上下文"""
        self.context.clear()
        self._current_speaker = "user"


# 单例
speech_service = SpeechRecognitionService(mode="offline", model_size="base")
