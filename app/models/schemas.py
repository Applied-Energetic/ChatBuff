from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class SuggestionTypeEnum(str, Enum):
    """建议类型枚举"""
    quote = "quote"
    news = "news"
    insight = "insight"
    humor = "humor"
    question = "question"
    empathy = "empathy"


class Quote(BaseModel):
    """金句数据模型"""
    quote: str
    source: str
    type: str
    category: str
    context: str
    author: str


class SuggestionRequest(BaseModel):
    """建议请求模型"""
    text: str
    context: Optional[str] = None
    parent_content: Optional[str] = None  # 上级节点内容，用于思维延展


class SuggestionResponse(BaseModel):
    """建议响应模型"""
    original_text: str
    suggestions: List[str]
    related_quotes: List[Quote]
    

class TranscribeRequest(BaseModel):
    """语音转文字请求"""
    audio_data: str  # base64 编码的音频数据
    sample_rate: int = 16000
    format: Optional[str] = "webm"  # 音频格式：webm, wav, ogg


class TranscribeResponse(BaseModel):
    """语音转文字响应"""
    text: str
    speaker: str
    confidence: float
    timestamp: str


class ConversationSuggestionModel(BaseModel):
    """对话建议模型"""
    type: SuggestionTypeEnum
    content: str
    source: Optional[str] = None
    confidence: float = 0.8
    timestamp: str


class AssistantResponseModel(BaseModel):
    """助手响应模型"""
    transcript: Optional[TranscribeResponse] = None
    suggestions: List[ConversationSuggestionModel] = []
    context_summary: str = ""
    topics: List[str] = []
    related_news: List[dict] = []


class TextInputRequest(BaseModel):
    """文本输入请求 (用于测试)"""
    text: str
    speaker: str = "other"


class NewsRequest(BaseModel):
    """新闻请求"""
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    limit: int = 5


class NewsItemModel(BaseModel):
    """新闻条目模型"""
    title: str
    summary: str
    source: str
    category: str
    keywords: List[str] = []
