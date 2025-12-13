from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.schemas import SuggestionRequest, SuggestionResponse, Quote
from app.core.rag import rag_service
from app.core.llm import llm_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ChatBuff API - 你的实时社交副驾驶"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
