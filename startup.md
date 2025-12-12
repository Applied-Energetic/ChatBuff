## ChatBuff 项目启动指南

### 项目定位

**ChatBuff** 是一个实时对话智能辅助工具，核心价值是帮助用户在不同的社交场景中提升表达效果。

#### 核心应用场景
1. **社交对话 · 展现修养**
   - 场景：日常与朋友、同事、新人等多人互动
   - 需求：快速获取恰当的金句来回应，展现文化品味和思想深度
   - 效果：让平凡的对话变得更有趣，增强个人魅力

2. **社交媒体 · 增强表达**
   - 场景：Tinder、Soul、陌陌等随机匹配应用，或社交媒体评论区
   - 需求：在第一次接触陌生人时，用恰当的言语留下深刻印象
   - 效果：提高回复质量，增加互动成功率，更容易建立连接

3. **自我提升 · 锻炼表达**
   - 场景：长期使用过程中学习高质量的表达方式
   - 需求：通过观察、学习 ChatBuff 推荐的金句和表达逻辑，逐步内化
   - 效果：最终不依赖工具也能展现出色的表达能力

### 初始化

### 项目环境
使用UV进行环境管理

### 项目目录结构
为了保持专业性并方便未来维护（比如别人想给你的 RAG 贡献代码），建议采用前后端分离但**Monorepo（单仓库）**的结构。

ChatBuff/
├── README.md             # 项目说明书（门面）
├── requirements.txt      # 后端依赖包
├── .env.example          # 环境变量示例（放 API Key 的占位符）
├── .gitignore            # 忽略文件配置
│
├── app/                  # 后端核心代码 (Python/FastAPI)
│   ├── main.py           # 入口文件，API 路由
│   ├── core/             # 核心逻辑
│   │   ├── audio.py      # 语音处理 (STT)
│   │   ├── llm.py        # 大模型交互 (OpenAI/Claude)
│   │   └── rag.py        # 向量数据库检索逻辑
│   ├── db/               # 数据库相关
│   │   ├── vector_store.py # 向量数据库操作 (ChromaDB/FAISS)
│   │   └── seeds/        # 初始数据 (名言、台词的 JSON/CSV 文件)
│   └── models/           # Pydantic 数据模型定义
│
├── frontend/             # 前端代码 (React/Vue 或简单 HTML)
│   ├── public/
│   ├── src/
│   │   ├── components/   # UI 组件 (显示气泡、录音按钮)
│   │   └── api/          # 调用后端接口的代码
│   └── package.json
│
├── docs/                 # 项目文档
│   ├── architecture.png  # 架构图
│   └── api_docs.md       # 接口文档
│
└── scripts/              # 实用脚本
    └── init_db.py        # 初始化向量数据库的脚本（运行一次即可）


### 核心技术栈
为了快速上线 MVP，我们不追求最复杂的技术，而追求最快落地和实时性。
后端框架： FastAPI (Python)。
理由： 原生支持异步（Async），这对实时语音流处理至关重要；开发速度快，自动生成 API 文档。
大模型接口： OpenAI API (GPT-4o-mini)。
理由： GPT-4o-mini 便宜且够聪明。

语音转文字 (STT)： OpenAI Whisper (API版) 或 Faster-Whisper (本地版)。
理由： 想要低延迟，建议本地跑 Faster-Whisper（如果电脑有显卡），或者使用 Deepgram API（速度极快）。
初版：Faster-Whisper (本地版) 后续考虑API版本

RAG / 数据库： ChromaDB (本地向量库)。
理由： 轻量级，不需要额外部署服务器，直接存本地文件，适合 MVP。
前端： React + Tailwind CSS。
理由： 组件化方便开发“消息流”界面，Tailwind 写样式很快。

## 开发路线图

Step 1: 数据准备 (The "Knowledge" Base)
在 app/db/seeds/ 下创建一个 quotes.json。
收集 50-100 条金句（电影台词、名人名言）。
编写 scripts/init_db.py：读取 JSON -> 调用 Embedding API（如 OpenAI text-embedding-3-small） -> 存入 ChromaDB。
Step 2: 后端核心 - RAG + LLM
RAG 检索： 写 app/core/rag.py，接收一个 string (用户说的话)，在 ChromaDB 搜索最相似的 3 条名言。
LLM 生成： 写 app/core/llm.py。
Prompt 设计： "用户正在说：{text}。请参考这些名言：{context}。用简短幽默的方式，结合名言给出一句回复建议。"
Step 3: 后端核心 - 语音处理 (STT)
实现 app/core/audio.py。
如果不搞复杂的 WebSocket，MVP 可以做成：前端每 3 秒录一段音 -> POST 发送给后端 -> 后端 Whisper 转文字 -> 返回文本。
Step 4: API 整合
在 app/main.py 暴露接口：
POST /api/transcribe: 接收音频，返回文字。
POST /api/suggestion: 接收文字，返回 ChatBuff 的建议。
(进阶版可以用 WebSocket /ws/live 实现全双工通信)
Step 5: 前端界面
左侧： 实时滚动的“听写记录”（Subtitles）。
右侧： “外挂弹窗”（Dashboard），卡片式展示 AI 推荐的金句。
底部： 一个大的“开始监听/停止监听”按钮。

## 思路
你可以先去 GitHub 创建仓库，然后用 npx create-react-app frontend 和 pip install fastapi uvicorn 先把空架子搭起来。遇到具体代码问题（比如“怎么用 FastAPI 接收音频流”），随时回来问我！祝你的 ChatBuff 开发顺利！

## API管理

不要在代码的各个角落到处写 os.getenv。建议创建一个专门的 config.py 来统一管理配置。
本次我打算先使用DeepSeek的API，因为便宜而且方便，延迟低

安装依赖：
code
Bash
pip install python-dotenv pydantic-settings
新建 app/config.py：
利用 pydantic 可以自动读取 .env 并做类型检查，非常方便后续扩展。
code
Python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 定义需要的配置项
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str = "https://api.openai.com/v1" # 默认值
    LLM_MODEL_NAME: str = "gpt-4o-mini"
    
    # 其他配置...
    # DB_URL: str = "sqlite:///./chatbuff.db"

    class Config:
        env_file = ".env"  # 指定读取的文件
        env_file_encoding = "utf-8"

# 实例化，单例模式
settings = Settings()
使用方式：
在任何需要用 Key 的地方（比如 llm.py）：
code
Python
from app.config import settings
from openai import OpenAI

client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL  # 这里是灵活切换的关键
)

def get_response(text):
    response = client.chat.completions.create(
        model=settings.LLM_MODEL_NAME, # 模型名字也从配置读
        messages=[...]
    )
