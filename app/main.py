from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid

from app.config import settings
from app.models.schemas import (
    SuggestionRequest, SuggestionResponse, Quote,
    TranscribeRequest, TranscribeResponse,
    TextInputRequest, AssistantResponseModel,
    NewsRequest, NewsItemModel
)
from app.core.rag import rag_service
from app.core.llm import llm_service
from app.core.speech import speech_service
from app.core.news import news_service
from app.core.assistant import conversation_assistant
from app.core.websocket import connection_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    print("🚀 ChatBuff 服务启动中...")
    await conversation_assistant.initialize()
    print("✅ 所有服务已就绪")
    yield
    # 关闭时清理
    print("👋 ChatBuff 服务关闭")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ChatBuff API - 你的实时社交副驾驶，支持语音识别、对话辅助、新闻和名言警句",
    lifespan=lifespan
)

# 添加 CORS 中间件（允许前端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to ChatBuff API",
        "provider": settings.LLM_PROVIDER,
        "model": settings.LLM_MODEL_NAME,
        "status": "running",
        "quotes_count": rag_service.get_count()
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/suggestion", response_model=SuggestionResponse)
async def get_suggestion(request: SuggestionRequest):
    """
    获取回复建议
    
    根据用户输入的文本，检索相关金句并生成回复建议
    """
    try:
        # Step 1: RAG 检索相关金句
        related_quotes = rag_service.search(request.text, top_k=3)
        
        if not related_quotes:
            raise HTTPException(
                status_code=500, 
                detail="向量库为空，请先运行 scripts/init_db.py 初始化数据"
            )
        
        # Step 2: LLM 生成建议
        suggestions = llm_service.generate_suggestion(
            user_text=request.text, 
            related_quotes=related_quotes,
            parent_content=request.parent_content
        )
        
        # Step 3: 返回结果
        return SuggestionResponse(
            original_text=request.text,
            suggestions=suggestions,
            related_quotes=[Quote(**q) for q in related_quotes]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quotes")
async def get_all_quotes():
    """获取向量库统计信息"""
    count = rag_service.get_count()
    return {
        "total_quotes": count,
        "collection_name": rag_service.collection_name
    }


# ============ 语音识别 API ============

@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    语音转文字
    
    将 Base64 编码的音频数据转换为文字
    """
    try:
        result = await speech_service.transcribe_base64(
            request.audio_data,
            request.sample_rate
        )
        
        if not result:
            # 返回空结果而不是错误，让前端处理
            from datetime import datetime
            return TranscribeResponse(
                text="",
                speaker="user",
                confidence=0.0,
                timestamp=datetime.now().isoformat()
            )
        
        return TranscribeResponse(
            text=result.text,
            speaker=result.speaker,
            confidence=result.confidence,
            timestamp=result.timestamp
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ============ 对话辅助 API ============

@app.post("/api/assistant/process", response_model=AssistantResponseModel)
async def process_conversation(request: TextInputRequest):
    """
    处理对话文本，生成建议
    
    用于测试或文本输入模式
    """
    try:
        result = await conversation_assistant.process_text(
            text=request.text,
            speaker=request.speaker
        )
        
        return AssistantResponseModel(
            transcript=TranscribeResponse(
                text=result.transcript.text,
                speaker=result.transcript.speaker,
                confidence=result.transcript.confidence,
                timestamp=result.transcript.timestamp
            ) if result.transcript else None,
            suggestions=[
                {
                    "type": s.type.value,
                    "content": s.content,
                    "source": s.source,
                    "confidence": s.confidence,
                    "timestamp": s.timestamp
                }
                for s in result.suggestions
            ],
            context_summary=result.context_summary,
            topics=result.topics,
            related_news=result.related_news
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/assistant/history")
async def get_conversation_history():
    """获取对话历史"""
    return {
        "history": conversation_assistant.get_conversation_history(),
        "count": len(conversation_assistant.speech.context.segments)
    }


@app.post("/api/assistant/reset")
async def reset_conversation():
    """重置对话会话"""
    conversation_assistant.reset()
    return {"status": "ok", "message": "会话已重置"}


# ============ 新闻服务 API ============

@app.post("/api/news")
async def get_news(request: NewsRequest):
    """
    获取新闻
    
    支持按类别和关键词筛选
    """
    try:
        news_items = await news_service.fetch_news(
            category=request.category,
            keywords=request.keywords,
            limit=request.limit
        )
        
        return {
            "news": [
                {
                    "title": item.title,
                    "summary": item.summary,
                    "source": item.source,
                    "category": item.category,
                    "keywords": item.keywords
                }
                for item in news_items
            ],
            "count": len(news_items)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/relevant")
async def get_relevant_news(query: str, limit: int = 3):
    """根据查询获取相关新闻"""
    try:
        news_items = await news_service.get_relevant_news(query, limit)
        return {
            "news": [
                {
                    "title": item.title,
                    "summary": item.summary,
                    "source": item.source,
                    "category": item.category
                }
                for item in news_items
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ WebSocket 实时通信 ============

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str = None):
    """
    WebSocket 实时通信端点
    
    支持实时语音流处理和建议推送
    """
    import asyncio
    
    if not client_id:
        client_id = str(uuid.uuid4())[:8]
    
    session = await connection_manager.connect(websocket, client_id)
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_json()
            
            msg_type = data.get("type", "")
            
            if msg_type == "audio":
                # 处理音频数据
                audio_base64 = data.get("audio_data", "")
                sample_rate = data.get("sample_rate", 16000)
                
                if audio_base64:
                    # 模拟流式识别：先发送"正在识别..."状态
                    await connection_manager.send_to_client(client_id, {
                        "type": "streaming_text",
                        "text": "正在识别语音..."
                    })
                    
                    result = await speech_service.transcribe_base64(audio_base64, sample_rate)
                    
                    if result:
                        # 模拟逐字显示效果
                        text = result.text
                        for i in range(1, len(text) + 1):
                            await connection_manager.send_to_client(client_id, {
                                "type": "streaming_text",
                                "text": text[:i]
                            })
                            await asyncio.sleep(0.03)  # 30ms 延迟模拟打字效果
                        
                        # 发送最终转录结果
                        await connection_manager.send_to_client(client_id, {
                            "type": "transcript",
                            "data": {
                                "text": result.text,
                                "speaker": result.speaker,
                                "confidence": result.confidence,
                                "timestamp": result.timestamp
                            }
                        })
                        
                        # 生成并发送建议
                        assistant_response = await conversation_assistant.process_text(
                            text=result.text,
                            speaker=result.speaker
                        )
                        
                        await connection_manager.send_to_client(client_id, {
                            "type": "suggestions",
                            "data": {
                                "suggestions": [s.to_dict() for s in assistant_response.suggestions],
                                "related_news": assistant_response.related_news,
                                "topics": assistant_response.topics
                            }
                        })
            
            elif msg_type == "text":
                # 处理文本输入 - 支持流式分析
                text = data.get("text", "")
                speaker = data.get("speaker", "other")
                stream = data.get("stream", False)
                
                if text:
                    if stream:
                        # 流式模式：文本输入时就开始分析
                        await connection_manager.send_to_client(client_id, {
                            "type": "streaming_text",
                            "text": text
                        })
                    else:
                        # 完整处理模式
                        result = await conversation_assistant.process_text(text, speaker)
                        
                        await connection_manager.send_to_client(client_id, {
                            "type": "suggestions",
                            "data": {
                                "suggestions": [s.to_dict() for s in result.suggestions],
                                "related_news": result.related_news,
                                "context_summary": result.context_summary,
                                "topics": result.topics
                            }
                        })
            
            elif msg_type == "stream_complete":
                # 流式输入完成，开始生成建议
                text = data.get("text", "")
                speaker = data.get("speaker", "other")
                
                if text:
                    result = await conversation_assistant.process_text(text, speaker)
                    
                    # 发送转录结果
                    await connection_manager.send_to_client(client_id, {
                        "type": "transcript",
                        "data": {
                            "text": text,
                            "speaker": speaker,
                            "confidence": 1.0,
                            "timestamp": None
                        }
                    })
                    
                    # 发送建议
                    await connection_manager.send_to_client(client_id, {
                        "type": "suggestions",
                        "data": {
                            "suggestions": [s.to_dict() for s in result.suggestions],
                            "related_news": result.related_news,
                            "topics": result.topics
                        }
                    })
            
            elif msg_type == "reset":
                # 重置会话
                conversation_assistant.reset()
                await connection_manager.send_to_client(client_id, {
                    "type": "reset",
                    "message": "会话已重置"
                })
            
            elif msg_type == "ping":
                # 心跳
                await connection_manager.send_to_client(client_id, {
                    "type": "pong",
                    "timestamp": data.get("timestamp")
                })
                
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket 错误: {e}")
        connection_manager.disconnect(client_id)


@app.get("/api/ws/status")
async def get_websocket_status():
    """获取 WebSocket 连接状态"""
    return {
        "active_connections": connection_manager.get_active_count(),
        "client_ids": connection_manager.get_client_ids()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
