# 🚀 ChatBuff Dashboard - 快速启动指南

## 5分钟快速开始

### 前置条件

- ✅ Node.js 16+ 已安装
- ✅ 后端服务运行在 http://127.0.0.1:8000（已验证）

### 启动步骤

#### 步骤 1：安装依赖（仅首次）

```powershell
cd d:\File\Dev\VScode\新建文件夹\ChatBuff\frontend
npm install
```

**预期输出**：
```
added 300+ packages in 45s
```

#### 步骤 2：启动开发服务器

```powershell
npm run dev
```

**预期输出**：
```
  VITE v4.4.5  ready in 245 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

#### 步骤 3：打开浏览器

访问：**http://localhost:3000**

你应该看到 ChatBuff Dashboard 的科幻HUD界面。

---

## 🎮 界面操作指南

### 三区域概览

```
┌─────────────────────────────────────────┐
│  Header: SYSTEM ONLINE + 版本号        │
├──────────────────┬──────────────────────┤
│  Transcript Log  │  Knowledge Fragments │
│  (系统日志)      │  (建议 + 引用)       │
│  ← 自动滚动      │  ← 动画卡片          │
├──────────────────┴──────────────────────┤
│ [🎤] [输入框........................] [▶] │
└──────────────────────────────────────────┘
```

### 使用流程

1. **输入想说的话**
   - 点击底部输入框
   - 输入文本（支持多行，Shift+Enter 换行）

2. **获取建议**
   - 按 `Enter` 键 或 点击 `▶` 按钮
   - 等待建议生成（通常 1-3 秒）

3. **查看结果**
   - **左侧**：实时日志显示处理步骤
   - **右侧上**：3 条不同风格的建议
   - **右侧下**：相关的引用和灵感

4. **复制建议**
   - 悬停建议卡片，右上出现复制图标
   - 点击图标，复制到剪贴板
   - 显示 ✓ 确认，2 秒后恢复

### 麦克风功能（未来）

- 🎤 按钮：当前仅是 UI 占位符
- 活跃时：发红光
- 后续版本会集成 Web Speech API

---

## 🎨 视觉特性

### 色彩方案

| 用途 | 颜色 | Hex |
|------|------|-----|
| 系统状态 | Cyan | #06b6d4 |
| 知识深度 | Violet | #a855f7 |
| 文本 | Slate-200 | #e2e8f0 |
| 背景 | Slate-950 | #030712 |

### 动画效果

✨ **持续动画**
- Header 脉冲点：持续闪烁（表示系统活跃）
- 背景圆圈：缓慢浮动（营造氛围）

✨ **交互动画**
- 建议进入：依次淡入+下滑（0.4s）
- 按钮点击：缩放反馈（95% → 105%）
- 加载转轮：旋转 Zap 图标（2s 循环）

✨ **反馈动画**
- 复制成功：切换为绿色 ✓ （2s）
- 麦克风活跃：红色发光阴影

---

## 🔧 常用命令

### 开发

```powershell
# 启动开发服务器（热重载）
npm run dev

# 预览生产版本
npm run preview

# 构建生产版本
npm run build
```

### 调试

```powershell
# 打开浏览器开发者工具（F12）
# 查看 Console 标签：任何错误都会显示
# 查看 Network 标签：监控 API 调用
#   - /api/suggestion 应该返回 200 OK
```

### 清理缓存

```powershell
# 删除 node_modules 和 dist（如果有问题）
rm -r node_modules dist
npm install
npm run dev
```

---

## 📊 性能指标

### 初次加载
- Vite 冷启动：~1-2 秒
- 页面首绘：~500ms
- 完全交互：~2 秒

### 运行时
- 建议生成延迟：1-3 秒（取决于后端）
- UI 响应时间：< 50ms
- 动画帧率：60 FPS（大多数操作）

---

## 🐛 常见问题

### Q1: "Cannot POST /api/suggestion"
**A:** 后端未运行或代理配置错误
```bash
# 检查后端
curl http://127.0.0.1:8000/health

# 应该返回 {"status": "ok"}
```

### Q2: 样式看起来很奇怪
**A:** Tailwind CSS 未编译
```bash
npm run dev  # 重新启动，让 Vite 重新编译
```

### Q3: 输入框有红波浪线
**A:** 这是 VS Code 的拼写检查，不影响功能。可以忽略或在设置中禁用。

### Q4: 建议不够准确
**A:** 后端知识库仅有 4 条初始引用。需要扩展：
```bash
# 在后端目录执行
python scripts/init_db.py  # 重新初始化（添加更多引用）
```

---

## 📝 组件文件说明

### `Dashboard.jsx` (500+ 行)

**核心仪表板组件**，包含：
- Header：系统状态显示
- Transcript Panel：日志面板（左）
- Knowledge Panel：建议面板（右）
- Input Area：输入和发送控制

**关键函数**：
- `handleGetSuggestion()`：API 调用
- `copyToClipboard()`：复制反馈
- `toggleListening()`：麦克风开关

### `App.jsx` (4 行)

**简单包装器**，仅导入并渲染 Dashboard

### `index.css` (170+ 行)

**全局样式** + HUD 特殊效果：
- `.glass`：玻璃拟态基础类
- `.hud-card`：知识卡片样式
- `.log-panel`：日志面板终端风格
- 自定义动画：`scan-line`, `flicker`, `neon-glow`

### `tailwind.config.js`

**Tailwind 定制**：
- 自定义字体：JetBrains Mono（等宽）
- 自定义颜色：Cyan, Violet
- 自定义阴影：`glow-*` 系列
- 自定义动画：`pulse-glow`, `float`

---

## 🎯 下一步

### 立即可做

- ✅ 启动开发服务器
- ✅ 测试建议生成流程
- ✅ 体验交互动画

### 近期计划

- 📈 扩展知识库（添加 50+ 引用）
- 🎤 实现实际语音输入（Web Speech API）
- 📱 优化移动端布局

### 长期目标

- 🌙 深/浅主题切换
- ⌨️ 键盘快捷键
- 💾 本地历史记录

---

## 📚 资源链接

| 资源 | 链接 |
|------|------|
| 项目文档 | 见 `DASHBOARD_DESIGN.md` |
| 后端 API 文档 | http://127.0.0.1:8000/docs |
| Tailwind CSS | https://tailwindcss.com |
| Framer Motion | https://www.framer.com/motion |
| Lucide Icons | https://lucide.dev |

---

**祝你使用愉快！🚀**

有任何问题，查看浏览器控制台（F12）获取详细错误信息。
