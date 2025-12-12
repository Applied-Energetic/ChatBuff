import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import json
from pathlib import Path
from typing import List, Dict

class RAGService:
    """RAG 服务类 - 负责向量检索"""
    
    def __init__(self, db_path: str = "./chroma_db"):
        """初始化 ChromaDB 客户端"""
        self.client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = "quotes"
        
        # 使用默认的 embedding 函数（sentence-transformers）
        # 这是一个本地模型，不需要 API
        default_ef = embedding_functions.DefaultEmbeddingFunction()
        
        # 获取或创建集合
        try:
            self.collection = self.client.get_collection(
                name=self.collection_name,
                embedding_function=default_ef
            )
            print(f"✅ 加载现有集合: {self.collection_name}")
        except:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                embedding_function=default_ef,
                metadata={"description": "ChatBuff 金句库"}
            )
            print(f"✨ 创建新集合: {self.collection_name}")
    
    def add_quotes(self, quotes: List[Dict]):
        """批量添加金句到向量库"""
        documents = []
        metadatas = []
        ids = []
        
        for i, quote in enumerate(quotes):
            # 将所有信息组合成文档
            doc = f"{quote['quote']} {quote['context']} {quote['category']}"
            documents.append(doc)
            metadatas.append(quote)
            ids.append(f"quote_{i}")
        
        # ChromaDB 会自动生成 embedding（使用默认的 embedding function）
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f"✅ 成功添加 {len(quotes)} 条金句到向量库")
    
    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        检索与查询最相似的金句
        
        Args:
            query: 用户的输入文本
            top_k: 返回最相似的前 k 条
        
        Returns:
            相关金句列表
        """
        try:
            # ChromaDB 会自动将查询文本转为向量
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            # 提取 metadata
            if results['metadatas']:
                return results['metadatas'][0]
            return []
            
        except Exception as e:
            print(f"❌ 检索失败: {e}")
            return []
    
    def get_count(self) -> int:
        """获取向量库中的金句数量"""
        return self.collection.count()

# 单例模式
rag_service = RAGService()
