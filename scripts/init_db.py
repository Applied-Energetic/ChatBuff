"""
初始化向量数据库脚本
运行一次即可将 quotes.json 的数据导入 ChromaDB
"""

import json
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.rag import rag_service

def main():
    print("🚀 开始初始化 ChatBuff 知识库...")
    
    # 读取金句数据
    quotes_file = project_root / "app" / "db" / "seeds" / "quotes.json"
    
    if not quotes_file.exists():
        print(f"❌ 文件不存在: {quotes_file}")
        return
    
    with open(quotes_file, 'r', encoding='utf-8') as f:
        quotes = json.load(f)
    
    print(f"📖 读取到 {len(quotes)} 条金句")
    
    # 检查是否已经有数据
    current_count = rag_service.get_count()
    if current_count > 0:
        print(f"⚠️  向量库中已有 {current_count} 条数据")
        choice = input("是否清空并重新导入？(y/n): ")
        if choice.lower() == 'y':
            # 重新创建集合（清空数据）
            rag_service.client.delete_collection(rag_service.collection_name)
            rag_service.collection = rag_service.client.create_collection(
                name=rag_service.collection_name,
                metadata={"description": "ChatBuff 金句库"}
            )
            print("✅ 已清空旧数据")
        else:
            print("❌ 取消导入")
            return
    
    # 添加数据到向量库
    rag_service.add_quotes(quotes)
    
    print(f"✅ 初始化完成！当前向量库共有 {rag_service.get_count()} 条金句")
    
    # 测试检索
    print("\n🧪 测试检索功能...")
    test_query = "生活太难了"
    results = rag_service.search(test_query, top_k=2)
    print(f"查询: '{test_query}'")
    print(f"结果:")
    for i, quote in enumerate(results, 1):
        print(f"  {i}. {quote['quote']} —— {quote['author']}")

if __name__ == "__main__":
    main()
