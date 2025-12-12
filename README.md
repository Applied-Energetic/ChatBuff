# ChatBuff (言值外挂) 🚀

> **Your real-time social copilot. Never run out of wit.**
> **你的实时社交副驾驶，让每一句回复都掷地有声。**

## 📖 项目简介

ChatBuff 是一个基于 LLM 和 RAG 技术的开源实时对话辅助工具。它通过实时监听对话内容，智能检索相关的电影台词、名人名言和幽默梗，为用户提供高质量的回复建议，帮助你在各种社交场景中展现更精妙的表达和思想。

## 🎯 应用场景

- **社交对话加强**: 和朋友聊天时，快速获取恰当的名言和金句，轻松展现文化修养
- **社交媒体互动**: 在随机匹配社交应用中，借助精准建议增强表达能力，给对方留开深刻印象
- **表达能力锻炼**: 通过观看和学习高质量的回复建议，逐步提升自身的表达能力和文化内涵

👉 **[详见应用场景详细指南](USAGE_SCENARIOS.md)** - 了解每个场景的优化策略和知识库建议

## 📸 预览 (Preview)
*(这里记得放一张 MVP 的截图)*

## ✨ 核心功能 (Features)

- **👂 实时聆听**: 基于 OpenAI Whisper 的高精度语音转文字，支持多种语言
- **🧠 意图识别**: 瞬间理解对方的潜台词和情绪，精准捕捉对话上下文
- **📚 旁征博引**: 内置 RAG 系统，毫秒级检索电影台词与名著金句、名人名言和经典梗
- **⚡ 实时建议**: 这是一个"外挂"，它不替你说话，只给你递小抄 —— 最终的表达权掌握在你手中
- **🎨 优雅界面**: 简洁直观的 UI 设计，实时展示听写记录和智能建议

## 🛠️ 技术栈 (Tech Stack)

| 模块 | 技术选型 | 说明 |
|------|--------|------|
| **前端** | React, Tailwind CSS | 快速迭代，组件化开发 |
| **后端** | Python FastAPI | 原生异步支持，高性能 |
| **AI 引擎** | OpenAI GPT-4o / Groq | 智能理解与生成 |
| **语音转文字** | OpenAI Whisper / Faster-Whisper | 高精度 STT |
| **向量数据库** | ChromaDB | 轻量级本地向量存储 |
| **环境管理** | UV (Python) | 快速可靠的依赖管理 |

## 🚀 快速开始 (Quick Start)

### 前置条件
- Python 3.10+
- Node.js 16+
- 有效的 OpenAI API Key（或其他 LLM 服务的 API Key）

### 1. 克隆项目
\`\`\`bash
git clone https://github.com/Applied-Energetic/ChatBuff.git
cd ChatBuff
\`\`\`

### 2. 配置环境变量
复制 \`.env.example\` 为 \`.env\` 并填入你的 API KEY：
\`\`\`env
# OpenAI API
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4o-mini

# 或使用 Groq (可选)
GROQ_API_KEY=gsk-xxxx

# 前端配置
REACT_APP_API_URL=http://localhost:8000
\`\`\`

### 3. 后端初始化

\`\`\`bash
# 安装后端依赖
pip install -r requirements.txt

# 初始化知识库（第一次运行）
python scripts/init_db.py

# 启动后端服务
uvicorn app.main:app --reload
\`\`\`

后端服务将运行在 \`http://localhost:8000\`，API 文档可在 \`http://localhost:8000/docs\` 查看。

### 4. 前端启动

\`\`\`bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
\`\`\`

前端将运行在 \`http://localhost:3000\`。

## 📚 项目架构

\`\`\`
ChatBuff/
├── README.md              # 项目说明书
├── requirements.txt       # 后端依赖
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略配置
│
├── app/                   # 后端核心代码 (Python/FastAPI)
│   ├── main.py            # 应用入口，API 路由定义
│   ├── core/              # 核心业务逻辑
│   │   ├── audio.py       # 语音处理 (STT - Speech to Text)
│   │   ├── llm.py         # LLM 交互 (OpenAI/Groq)
│   │   └── rag.py         # RAG 检索逻辑
│   ├── db/                # 数据库管理
│   │   ├── vector_store.py# 向量数据库操作 (ChromaDB)
│   │   └── seeds/         # 初始化数据
│   │       └── quotes.json# 名言、台词、梗的数据集
│   └── models/            # 数据模型 (Pydantic)
│
├── frontend/              # 前端代码 (React)
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── api/           # 后端接口调用
│   │   ├── styles/        # 样式文件
│   │   └── App.jsx        # 主应用组件
│   └── package.json       # 前端依赖
│
├── docs/                  # 项目文档
│   ├── ARCHITECTURE.md    # 架构设计文档
│   ├── API.md             # API 接口文档
│   └── CONTRIBUTING.md    # 贡献指南
│
└── scripts/               # 实用工具脚本
    ├── init_db.py         # 初始化向量数据库
    └── update_quotes.py   # 更新知识库数据
\`\`\`

## 🔧 核心 API

| 端点 | 方法 | 说明 |
|------|------|------|
| \`/api/transcribe\` | POST | 语音识别：接收音频文件，返回识别的文本 |
| \`/api/suggestion\` | POST | 获取建议：接收用户输入文本，返回回复建议 |
| \`/api/quotes\` | GET | 获取所有名言库（可选） |
| \`/health\` | GET | 健康检查 |

详见 [API 文档](docs/API.md)。

## 🤝 贡献指南 (Contributing)

我们热烈欢迎来自社区的贡献！无论是代码、数据还是想法，都可以帮助让 ChatBuff 更好。

### 主要需求
- 🎬 **更多名言数据**: 欢迎补充电影台词、名人名言、网络梗等
- 🧠 **优化 Prompt**: 改进建议的质量和创意度
- 🎨 **UI/UX 改进**: 更好的用户体验设计
- 🐛 **Bug 修复**: 提交 Issue 或 PR
- 📖 **文档完善**: 完善项目文档

### 提交流程
1. Fork 本仓库
2. 创建特性分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 创建 Pull Request

## 📄 开源许可

本项目采用 [MIT License](LICENSE) 开源协议，详见 LICENSE 文件。

## 💡 致谢

感谢以下开源项目的支持：
- [OpenAI Whisper](https://github.com/openai/whisper)
- [FastAPI](https://fastapi.tiangolo.com/)
- [ChromaDB](https://www.trychroma.com/)
- [React](https://react.dev/)

## 📧 联系方式

- 提交 [GitHub Issues](https://github.com/Applied-Energetic/ChatBuff/issues) 报告 Bug 或提出功能建议
- 欢迎在讨论区分享你的使用心得！

---

**让我们一起构建一个更聪慧的对话时代！** 🚀