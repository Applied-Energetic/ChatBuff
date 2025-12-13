"""
对话辅助助手 - 整合语音识别、LLM、RAG和新闻服务，提供实时对话建议
"""
import asyncio
from typing import List, Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from app.core.speech import speech_service, TranscriptSegment, ConversationContext
from app.core.llm import llm_service
from app.core.rag import rag_service
from app.core.news import news_service, NewsItem


class SuggestionType(str, Enum):
    """建议类型"""
    QUOTE = "quote"          # 名言警句
    NEWS = "news"            # 新闻热点
    INSIGHT = "insight"      # 深度洞察
    HUMOR = "humor"          # 幽默回应
    QUESTION = "question"    # 反问/追问
    EMPATHY = "empathy"      # 共情回应


@dataclass
class ConversationSuggestion:
    """对话建议"""
    type: SuggestionType
    content: str
    source: Optional[str] = None  # 来源 (如金句出处、新闻来源)
    confidence: float = 0.8
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict:
        return {
            "type": self.type.value,
            "content": self.content,
            "source": self.source,
            "confidence": self.confidence,
            "timestamp": self.timestamp
        }


@dataclass
class AssistantResponse:
    """助手响应"""
    transcript: Optional[TranscriptSegment]
    suggestions: List[ConversationSuggestion]
    context_summary: str
    topics: List[str]
    related_news: List[Dict]
    
    def to_dict(self) -> Dict:
        return {
            "transcript": {
                "text": self.transcript.text,
                "speaker": self.transcript.speaker,
                "confidence": self.transcript.confidence
            } if self.transcript else None,
            "suggestions": [s.to_dict() for s in self.suggestions],
            "context_summary": self.context_summary,
            "topics": self.topics,
            "related_news": self.related_news
        }


class ConversationAssistant:
    """
    对话辅助助手
    
    核心功能：
    1. 实时语音转文字
    2. 对话上下文管理
    3. 智能建议生成 (名言、新闻、洞察)
    4. 多模态辅助信息整合
    """
    
    def __init__(self):
        self.speech = speech_service
        self.llm = llm_service
        self.rag = rag_service
        self.news = news_service
        
        # 建议生成配置
        self.suggestion_interval = 3.0  # 每3秒生成一次建议
        self.min_text_length = 10  # 最少文字长度才触发建议
        
        # 回调函数
        self._on_transcript: Optional[Callable] = None
        self._on_suggestion: Optional[Callable] = None
        
    async def initialize(self):
        """初始化所有服务"""
        await self.speech.initialize()
        print("✅ 对话助手已初始化")
    
    def set_callbacks(
        self,
        on_transcript: Optional[Callable[[TranscriptSegment], Any]] = None,
        on_suggestion: Optional[Callable[[List[ConversationSuggestion]], Any]] = None
    ):
        """设置回调函数"""
        self._on_transcript = on_transcript
        self._on_suggestion = on_suggestion
    
    async def process_audio(
        self, 
        audio_data: bytes,
        sample_rate: int = 16000,
        generate_suggestions: bool = True
    ) -> AssistantResponse:
        """
        处理音频数据，返回转录和建议
        
        Args:
            audio_data: 原始音频数据
            sample_rate: 采样率
            generate_suggestions: 是否生成建议
            
        Returns:
            AssistantResponse 包含转录和建议
        """
        # 1. 语音转文字
        transcript = await self.speech.transcribe_audio(audio_data, sample_rate)
        
        if transcript and self._on_transcript:
            await self._safe_callback(self._on_transcript, transcript)
        
        # 2. 获取对话上下文
        context = self.speech.get_context()
        context_text = context.get_recent_text(n=5)
        topics = context.get_topics()
        
        # 3. 生成建议 (如果有足够的上下文)
        suggestions = []
        related_news = []
        
        if generate_suggestions and transcript and len(transcript.text) >= self.min_text_length:
            suggestions = await self._generate_suggestions(transcript, context)
            related_news = await self._get_related_news(context_text)
            
            if self._on_suggestion and suggestions:
                await self._safe_callback(self._on_suggestion, suggestions)
        
        return AssistantResponse(
            transcript=transcript,
            suggestions=suggestions,
            context_summary=context_text,
            topics=topics,
            related_news=[{"title": n.title, "summary": n.summary, "source": n.source} for n in related_news]
        )
    
    async def process_text(
        self,
        text: str,
        speaker: str = "other"
    ) -> AssistantResponse:
        """
        直接处理文本输入 (用于测试或文本输入模式)
        """
        # 创建模拟的转录片段
        transcript = TranscriptSegment(
            text=text,
            speaker=speaker,
            start_time=0,
            end_time=len(text) * 0.1,
            confidence=1.0
        )
        
        # 添加到上下文
        self.speech.context.add_segment(transcript)
        
        # 生成建议
        context = self.speech.get_context()
        context_text = context.get_recent_text(n=5)
        topics = context.get_topics()
        
        suggestions = await self._generate_suggestions(transcript, context)
        related_news = await self._get_related_news(context_text)
        
        return AssistantResponse(
            transcript=transcript,
            suggestions=suggestions,
            context_summary=context_text,
            topics=topics,
            related_news=[{"title": n.title, "summary": n.summary, "source": n.source} for n in related_news]
        )
    
    async def _generate_suggestions(
        self,
        transcript: TranscriptSegment,
        context: ConversationContext
    ) -> List[ConversationSuggestion]:
        """生成多类型建议"""
        suggestions = []
        
        # 并行获取各类建议
        tasks = [
            self._get_quote_suggestion(transcript.text),
            self._get_llm_suggestions(transcript, context),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理名言建议
        if isinstance(results[0], ConversationSuggestion):
            suggestions.append(results[0])
        
        # 处理 LLM 建议
        if isinstance(results[1], list):
            suggestions.extend(results[1])
        
        return suggestions
    
    async def _get_quote_suggestion(self, text: str) -> Optional[ConversationSuggestion]:
        """从 RAG 获取相关名言"""
        try:
            quotes = self.rag.search(text, top_k=1)
            if quotes:
                quote = quotes[0]
                return ConversationSuggestion(
                    type=SuggestionType.QUOTE,
                    content=quote['quote'],
                    source=f"《{quote['source']}》- {quote['author']}",
                    confidence=0.85
                )
        except Exception as e:
            print(f"获取名言失败: {e}")
        return None
    
    async def _get_llm_suggestions(
        self,
        transcript: TranscriptSegment,
        context: ConversationContext
    ) -> List[ConversationSuggestion]:
        """使用 LLM 生成多类型建议"""
        suggestions = []
        
        try:
            # 构建增强的提示
            context_text = context.get_recent_text(n=5)
            last_other = context.get_last_other_message()
            
            prompt = f"""你是一个实时对话辅助助手。用户正在与他人对话，你需要帮助用户提供有深度的回应。

当前对话上下文：
{context_text}

对方最新说的话："{last_other or transcript.text}"

请生成 3 个不同类型的回应建议：
1. [深度] 一个展现思考深度的回应，可引用名人名言或哲理
2. [幽默] 一个风趣幽默但不失礼貌的回应
3. [追问] 一个有启发性的追问，推动对话深入

要求：
- 每个建议不超过 30 字
- 自然流畅，符合口语表达
- 与当前话题紧密相关

格式：每行一个建议，以[类型]开头"""

            # 调用 LLM
            response = self.llm.client.chat.completions.create(
                model=self.llm.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的对话辅助助手，帮助用户在社交场合展现智慧。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            
            type_mapping = {
                "[深度]": SuggestionType.INSIGHT,
                "[幽默]": SuggestionType.HUMOR,
                "[追问]": SuggestionType.QUESTION,
            }
            
            for line in lines[:3]:
                for prefix, stype in type_mapping.items():
                    if line.startswith(prefix):
                        suggestions.append(ConversationSuggestion(
                            type=stype,
                            content=line.replace(prefix, "").strip(),
                            source="AI 建议",
                            confidence=0.8
                        ))
                        break
                        
        except Exception as e:
            print(f"LLM 建议生成失败: {e}")
            # 返回默认建议
            suggestions.append(ConversationSuggestion(
                type=SuggestionType.EMPATHY,
                content="我理解你的想法，能说得更具体吗？",
                source="默认回复",
                confidence=0.5
            ))
        
        return suggestions
    
    async def _get_related_news(self, context_text: str) -> List[NewsItem]:
        """获取相关新闻"""
        try:
            return await self.news.get_relevant_news(context_text, limit=2)
        except Exception as e:
            print(f"获取新闻失败: {e}")
            return []
    
    async def _safe_callback(self, callback: Callable, *args):
        """安全执行回调"""
        try:
            result = callback(*args)
            if asyncio.iscoroutine(result):
                await result
        except Exception as e:
            print(f"回调执行失败: {e}")
    
    def reset(self):
        """重置会话"""
        self.speech.reset_context()
        print("✅ 对话会话已重置")
    
    def get_conversation_history(self) -> List[Dict]:
        """获取对话历史"""
        return [
            {
                "text": seg.text,
                "speaker": seg.speaker,
                "timestamp": seg.timestamp,
                "confidence": seg.confidence
            }
            for seg in self.speech.context.segments
        ]


# 单例
conversation_assistant = ConversationAssistant()
