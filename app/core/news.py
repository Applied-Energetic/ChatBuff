"""
新闻数据服务 - 提供实时新闻和热点话题作为对话辅助
"""
import asyncio
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
import hashlib


@dataclass
class NewsItem:
    """新闻条目"""
    title: str
    summary: str
    source: str
    url: str
    category: str
    published_at: str
    keywords: List[str] = field(default_factory=list)
    
    def to_context_string(self) -> str:
        """转换为可用于 LLM 上下文的字符串"""
        return f"[{self.source}] {self.title}: {self.summary[:100]}..."


class NewsService:
    """
    新闻服务
    
    支持多个新闻源：
    1. NewsAPI (需要 API Key)
    2. 本地缓存/Mock 数据
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.cache: Dict[str, List[NewsItem]] = {}
        self.cache_ttl = timedelta(minutes=30)
        self.last_fetch: Dict[str, datetime] = {}
        
        # 内置的热门话题 (作为备用)
        self.fallback_topics = [
            {
                "title": "AI 技术持续突破",
                "summary": "大语言模型在多个领域展现出惊人的应用潜力，正在改变人们的工作和生活方式。",
                "source": "科技热点",
                "category": "technology",
                "keywords": ["AI", "人工智能", "科技"]
            },
            {
                "title": "经济复苏信号明显",
                "summary": "多项经济指标显示积极变化，市场信心逐步恢复。",
                "source": "财经快讯",
                "category": "business",
                "keywords": ["经济", "市场", "投资"]
            },
            {
                "title": "健康生活方式受关注",
                "summary": "越来越多的人开始注重工作与生活的平衡，追求身心健康。",
                "source": "生活周刊",
                "category": "health",
                "keywords": ["健康", "生活", "养生"]
            },
            {
                "title": "社交媒体影响力持续增长",
                "summary": "短视频和社交平台正在重塑人们的信息获取和社交方式。",
                "source": "互联网观察",
                "category": "social",
                "keywords": ["社交", "媒体", "互联网"]
            },
            {
                "title": "可持续发展成为共识",
                "summary": "环保理念深入人心，绿色消费和可持续发展成为社会热点。",
                "source": "环球视野",
                "category": "environment",
                "keywords": ["环保", "可持续", "绿色"]
            }
        ]
    
    async def fetch_news(
        self, 
        category: Optional[str] = None,
        keywords: Optional[List[str]] = None,
        limit: int = 5
    ) -> List[NewsItem]:
        """
        获取新闻
        
        Args:
            category: 新闻类别 (technology, business, health, etc.)
            keywords: 关键词过滤
            limit: 返回数量限制
            
        Returns:
            新闻列表
        """
        cache_key = self._get_cache_key(category, keywords)
        
        # 检查缓存
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key][:limit]
        
        # 尝试从 API 获取
        if self.api_key:
            news = await self._fetch_from_api(category, keywords)
            if news:
                self.cache[cache_key] = news
                self.last_fetch[cache_key] = datetime.now()
                return news[:limit]
        
        # 使用备用数据
        return self._get_fallback_news(category, keywords, limit)
    
    async def get_relevant_news(
        self, 
        conversation_text: str,
        limit: int = 3
    ) -> List[NewsItem]:
        """
        根据对话内容获取相关新闻
        
        Args:
            conversation_text: 对话文本
            limit: 返回数量
            
        Returns:
            相关新闻列表
        """
        # 提取关键词 (简单实现)
        keywords = self._extract_keywords(conversation_text)
        
        if not keywords:
            # 返回通用热点
            return await self.fetch_news(limit=limit)
        
        return await self.fetch_news(keywords=keywords, limit=limit)
    
    def _extract_keywords(self, text: str) -> List[str]:
        """从文本提取关键词"""
        # 简单的关键词提取
        # 实际生产中应使用 jieba 或其他 NLP 工具
        important_terms = [
            "AI", "人工智能", "科技", "经济", "市场", "投资",
            "健康", "教育", "文化", "体育", "娱乐", "政治",
            "环保", "创业", "职场", "社交", "互联网", "数字化"
        ]
        
        found = []
        for term in important_terms:
            if term.lower() in text.lower():
                found.append(term)
        
        return found[:3]  # 最多返回3个关键词
    
    async def _fetch_from_api(
        self, 
        category: Optional[str],
        keywords: Optional[List[str]]
    ) -> List[NewsItem]:
        """从 NewsAPI 获取新闻"""
        try:
            base_url = "https://newsapi.org/v2/top-headlines"
            params = {
                "apiKey": self.api_key,
                "language": "zh",
                "pageSize": 10
            }
            
            if category:
                params["category"] = category
            if keywords:
                params["q"] = " ".join(keywords)
            
            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_newsapi_response(data)
                    else:
                        print(f"NewsAPI 请求失败: {response.status}")
                        return []
                        
        except asyncio.TimeoutError:
            print("NewsAPI 请求超时")
            return []
        except Exception as e:
            print(f"NewsAPI 请求错误: {e}")
            return []
    
    def _parse_newsapi_response(self, data: Dict) -> List[NewsItem]:
        """解析 NewsAPI 响应"""
        news_items = []
        
        for article in data.get("articles", []):
            if not article.get("title"):
                continue
                
            news_items.append(NewsItem(
                title=article.get("title", ""),
                summary=article.get("description", "") or "",
                source=article.get("source", {}).get("name", "Unknown"),
                url=article.get("url", ""),
                category="general",
                published_at=article.get("publishedAt", ""),
                keywords=[]
            ))
        
        return news_items
    
    def _get_fallback_news(
        self, 
        category: Optional[str],
        keywords: Optional[List[str]],
        limit: int
    ) -> List[NewsItem]:
        """获取备用新闻数据"""
        items = []
        
        for topic in self.fallback_topics:
            # 过滤类别
            if category and topic["category"] != category:
                continue
            
            # 过滤关键词
            if keywords:
                has_keyword = any(
                    kw.lower() in topic["title"].lower() or 
                    kw.lower() in topic["summary"].lower() or
                    kw in topic["keywords"]
                    for kw in keywords
                )
                if not has_keyword:
                    continue
            
            items.append(NewsItem(
                title=topic["title"],
                summary=topic["summary"],
                source=topic["source"],
                url="",
                category=topic["category"],
                published_at=datetime.now().isoformat(),
                keywords=topic["keywords"]
            ))
        
        # 如果过滤后没有结果，返回全部
        if not items:
            items = [
                NewsItem(
                    title=t["title"],
                    summary=t["summary"],
                    source=t["source"],
                    url="",
                    category=t["category"],
                    published_at=datetime.now().isoformat(),
                    keywords=t["keywords"]
                )
                for t in self.fallback_topics
            ]
        
        return items[:limit]
    
    def _get_cache_key(
        self, 
        category: Optional[str],
        keywords: Optional[List[str]]
    ) -> str:
        """生成缓存键"""
        key_data = f"{category}:{sorted(keywords) if keywords else []}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """检查缓存是否有效"""
        if cache_key not in self.cache:
            return False
        if cache_key not in self.last_fetch:
            return False
        return datetime.now() - self.last_fetch[cache_key] < self.cache_ttl


# 单例 (可通过环境变量配置 API Key)
import os
news_service = NewsService(api_key=os.getenv("NEWS_API_KEY"))
