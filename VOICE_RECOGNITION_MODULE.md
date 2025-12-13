# 🎙️ ChatBuff 语音识别模块文档

## 概述

ChatBuff 后端语音识别模块实现了完整的实时对话捕捉和智能辅助功能，包括：

- **实时语音转文字** - 使用本地 Whisper 模型，支持 WebM/Opus 格式
- **LLM 智能建议** - 根据对话内容生成多种类型建议
- **新闻数据集成** - 获取相关话题新闻作为对话素材
- **名言警句增强** - 141条高质量名言用于提升对话深度

---

## 最新更新 (2025)

### ✅ 本地 Whisper 服务已部署
- 使用 `faster-whisper` 库实现本地语音转文字
- 模型: `base` (中文优化)
- 支持格式: WebM/Opus (浏览器录音)、WAV、OGG
- 依赖: FFmpeg 已安装用于音频格式转换

### ✅ 名言库已扩展
从 91 条扩展到 **141 条**，新增类别：
- 心理学 (阿德勒、弗洛伊德、荣格、欧文·亚隆、塞利格曼等)
- 成功学 (丘吉尔、乔布斯、曼德拉、亚里士多德等)
- 创业学 (德鲁克、韦尔奇、贝佐斯、马斯克、巴菲特等)
- 政治经济学 (马克思、亚当·斯密、凯恩斯、弗里德曼等)
- 历史学 (桑塔亚纳、吉本、黑格尔、克劳塞维茨等)

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐│
│  │ConversationHist│  │   MindMap   │  │  Suggestions + News Panel  ││
│  └──────────────┘  └──────────────┘  └─────────────────────────────┘│
│                    ┌──────────────────────────────────────┐          │
│                    │       AudioVisualizer Component      │          │
│                    │  ┌────────────────────────────────┐  │          │
│                    │  │ WebSocket / HTTP API 通信      │  │          │
│                    │  └────────────────────────────────┘  │          │
│                    └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend (FastAPI)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     WebSocket Manager                          │  │
│  │  • 实时双向通信  • 多客户端支持  • 心跳保活                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Speech    │  │     LLM     │  │     RAG     │  │    News     │ │
│  │  Service    │  │   Service   │  │   Service   │  │   Service   │ │
│  │  (Whisper)  │  │  (DeepSeek) │  │  (ChromaDB) │  │  (NewsAPI)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │                │                │                │         │
│         └────────────────┴────────────────┴────────────────┘         │
│                                 │                                    │
│                    ┌────────────────────────┐                        │
│                    │  ConversationAssistant │                        │
│                    │  • 服务协调器          │                        │
│                    │  • 上下文管理          │                        │
│                    │  • 建议生成            │                        │
│                    └────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 核心模块

### 1. 语音识别服务 (`app/core/speech.py`)

| 类 | 功能 |
|---|---|
| `TranscriptSegment` | 转录片段模型（文本、说话人、置信度、时间戳） |
| `ConversationContext` | 对话上下文管理（50段历史窗口） |
| `SpeechRecognitionService` | 语音识别服务（Whisper 或模拟模式） |

**特性：**
- 支持 `faster-whisper` 本地模型（如已安装）
- 模拟模式作为后备（无需 GPU）
- 基于音量的说话人检测（user vs other）
- 16kHz 采样率优化

### 2. 新闻服务 (`app/core/news.py`)

| 类 | 功能 |
|---|---|
| `NewsItem` | 新闻条目模型 |
| `NewsService` | 新闻获取与缓存服务 |

**特性：**
- 可选 NewsAPI.org 集成
- 30分钟智能缓存
- 关键词提取匹配
- 多分类支持（technology, business, sports, etc.）

### 3. 对话助手 (`app/core/assistant.py`)

| 类 | 功能 |
|---|---|
| `ConversationSuggestion` | 建议模型 |
| `AssistantResponse` | 完整响应模型 |
| `ConversationAssistant` | 核心协调服务 |

**建议类型：**
| 类型 | 描述 |
|------|------|
| `quote` | 相关名言警句（来自 RAG） |
| `insight` | 深度洞察（LLM 生成） |
| `humor` | 幽默建议 |
| `question` | 追问问题 |
| `empathy` | 共情回应 |

### 4. WebSocket 管理 (`app/core/websocket.py`)

| 类 | 功能 |
|---|---|
| `ClientSession` | 客户端会话管理 |
| `ConnectionManager` | WebSocket 连接管理器 |

**特性：**
- 多客户端并发支持
- 分组广播功能
- 心跳检测机制
- 自动重连处理

---

## API 端点

### REST API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/` | GET | API 状态信息 |
| `/health` | GET | 健康检查 |
| `/api/suggestion` | POST | 获取回复建议 |
| `/api/quotes` | GET | 获取名言统计 |
| `/api/transcribe` | POST | 音频转文字 |
| `/api/assistant/process` | POST | 处理文本输入 |
| `/api/assistant/history` | GET | 获取对话历史 |
| `/api/assistant/reset` | POST | 重置会话 |
| `/api/news` | POST | 获取分类新闻 |
| `/api/news/relevant` | GET | 获取相关新闻 |
| `/api/ws/status` | GET | WebSocket 状态 |

### WebSocket

| 端点 | 功能 |
|------|------|
| `/ws/{client_id}` | 实时双向通信 |

**消息格式：**
```json
// 发送音频
{
  "type": "audio",
  "audio_data": "<base64>",
  "sample_rate": 16000
}

// 接收转录
{
  "type": "transcript",
  "data": {
    "text": "对话内容",
    "speaker": "user",
    "confidence": 0.95
  }
}

// 接收建议
{
  "type": "suggestions",
  "data": {
    "suggestions": [...],
    "related_news": [...]
  }
}
```

---

## 名言警句库

已扩展至 **30 条高质量名言**，涵盖：

| 类别 | 示例作者 |
|------|---------|
| 励志 | 乔布斯、丘吉尔、尼采 |
| 哲学 | 苏格拉底、笛卡尔、康德 |
| 国学 | 孔子、老子、孟子、庄子 |
| 智慧 | 达芬奇、爱因斯坦、培根 |
| 幽默 | 马克·吐温、萧伯纳 |

---

## 使用示例

### 1. 处理文本输入

```bash
curl -X POST http://localhost:8000/api/assistant/process \
  -H "Content-Type: application/json" \
  -d '{"text": "今天工作压力好大，真的很累"}'
```

**响应：**
```json
{
  "transcript": {
    "text": "今天工作压力好大，真的很累",
    "speaker": "other",
    "confidence": 1.0
  },
  "suggestions": [
    {
      "type": "quote",
      "content": "你好厉害，很特别的人。",
      "source": "《冈仁》- 丹·倭尔夫",
      "confidence": 0.85
    },
    {
      "type": "insight",
      "content": "苏格拉底说过：人生苦短...",
      "source": "AI 建议",
      "confidence": 0.8
    }
  ],
  "related_news": [...]
}
```

### 2. WebSocket 实时通信

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/my-client-id');

ws.onopen = () => console.log('已连接');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'transcript') {
    console.log('转录:', data.data.text);
  }
  if (data.type === 'suggestions') {
    console.log('建议:', data.data.suggestions);
  }
};

// 发送音频
ws.send(JSON.stringify({
  type: 'audio',
  audio_data: base64AudioData,
  sample_rate: 16000
}));
```

---

## 启动指南

### 后端

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 初始化名言库
python scripts/init_db.py

# 3. 启动服务
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

---

## 环境变量

在 `.env` 文件中配置：

```env
DEEPSEEK_API_KEY=your_api_key
NEWS_API_KEY=your_newsapi_key  # 可选
```

---

## 状态

✅ **已完成功能：**
- 语音识别服务（模拟模式）
- LLM 集成（DeepSeek）
- RAG 名言检索（ChromaDB）
- 新闻服务（模拟数据）
- WebSocket 实时通信
- 三栏布局前端
- 实时建议展示

⚠️ **需要额外配置：**
- `faster-whisper` GPU 加速（可选）
- NewsAPI.org API Key（可选，有模拟数据后备）

---

*最后更新：2025-12-13*
