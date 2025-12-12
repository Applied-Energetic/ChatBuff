"""
测试 ChatBuff API 的脚本
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}\n")

def test_root():
    """测试根路径"""
    print("🔍 测试根路径...")
    response = requests.get(f"{BASE_URL}/")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}\n")

def test_suggestion(text):
    """测试建议 API"""
    print(f"🔍 测试建议 API (输入: '{text}')...")
    
    payload = {"text": text}
    response = requests.post(
        f"{BASE_URL}/api/suggestion",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n原始输入: {result['original_text']}")
        print(f"\n💡 建议回复:")
        for i, suggestion in enumerate(result['suggestions'], 1):
            print(f"  {i}. {suggestion}")
        
        print(f"\n📚 相关金句:")
        for i, quote in enumerate(result['related_quotes'], 1):
            print(f"  {i}. 「{quote['quote']}」")
            print(f"     —— {quote['author']}，出自《{quote['source']}》")
            print(f"     适用场景: {quote['context']}")
    else:
        print(f"错误: {response.text}")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    print("="*60)
    print("ChatBuff API 测试")
    print("="*60 + "\n")
    
    # 测试基础接口
    test_health()
    test_root()
    
    # 测试建议 API
    test_cases = [
        "今天心情不好",
        "生活太难了",
        "明天要面试，好紧张",
        "第一次和陌生人聊天"
    ]
    
    for text in test_cases:
        test_suggestion(text)
