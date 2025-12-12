from pydantic import BaseModel
from typing import List, Optional

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

class SuggestionResponse(BaseModel):
    """建议响应模型"""
    original_text: str
    suggestions: List[str]
    related_quotes: List[Quote]
    
class TranscribeRequest(BaseModel):
    """语音转文字请求"""
    audio_data: str  # base64 编码的音频数据
