"""
测试语音转录 API
生成一个简单的测试音频并发送到转录服务
"""

import requests
import base64
import io
import wave
import struct
import math

API_URL = "http://127.0.0.1:8000/api/transcribe"

def generate_test_tone(frequency=440, duration=2.0, sample_rate=16000):
    """生成一个简单的测试音调（正弦波）"""
    num_samples = int(sample_rate * duration)
    samples = []
    
    for i in range(num_samples):
        t = i / sample_rate
        sample = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * t))
        samples.append(sample)
    
    # 创建 WAV 文件
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for sample in samples:
            wav_file.writeframes(struct.pack('<h', sample))
    
    return buffer.getvalue()


def test_transcribe_api():
    """测试转录 API"""
    print("🔧 生成测试音频...")
    audio_data = generate_test_tone()
    
    # 转换为 Base64
    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
    
    print(f"📤 发送音频到服务器 ({len(audio_data)} bytes)...")
    
    try:
        response = requests.post(
            API_URL,
            json={
                "audio_data": audio_base64,
                "sample_rate": 16000,
                "format": "wav"
            },
            timeout=30
        )
        
        print(f"📥 响应状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 转录成功!")
            print(f"   文本: {result.get('text', '(空)')}")
            print(f"   说话人: {result.get('speaker', 'unknown')}")
            print(f"   置信度: {result.get('confidence', 0):.2%}")
        else:
            print(f"❌ 错误: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保后端正在运行")
    except Exception as e:
        print(f"❌ 请求失败: {e}")


def test_suggestion_api():
    """测试建议 API"""
    print("\n🔧 测试建议 API...")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/suggestion",
            json={"text": "我今天压力很大，工作太累了"},
            timeout=30
        )
        
        print(f"📥 响应状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 获取建议成功!")
            print(f"   原文: {result.get('original_text', '')}")
            print(f"   建议数: {len(result.get('suggestions', []))}")
            for i, sug in enumerate(result.get('suggestions', [])[:3], 1):
                print(f"   {i}. {sug[:50]}...")
        else:
            print(f"❌ 错误: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")


if __name__ == "__main__":
    print("=" * 50)
    print("  ChatBuff API 测试")
    print("=" * 50)
    
    # 先测试健康检查
    try:
        health = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if health.status_code == 200:
            print("✅ 服务器运行正常\n")
        else:
            print("⚠️ 服务器响应异常\n")
    except:
        print("❌ 无法连接到服务器\n")
        exit(1)
    
    test_transcribe_api()
    test_suggestion_api()
    
    print("\n" + "=" * 50)
    print("  测试完成")
    print("=" * 50)
