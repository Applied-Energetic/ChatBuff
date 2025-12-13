import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Zap, MessageSquare, ArrowRight } from 'lucide-react';

// Mock Data
const MOCK_TREE = {
  id: 'root',
  type: 'root',
  content: "我正在分析您的请求。看起来您对极简主义设计美学很感兴趣。",
  children: [
    {
      id: 'c1',
      type: 'quote',
      title: '设计引用',
      content: '“少即是多。” —— 密斯·凡德罗',
      icon: Quote,
    },
    {
      id: 'c2',
      type: 'rebuttal',
      title: '哲学思考',
      content: '极简主义是关于去除多余，还是关于聚焦本质？',
      icon: Zap,
    },
    {
      id: 'c3',
      type: 'joke',
      title: '幽默',
      content: '为什么设计师总是穿黑色？因为他们在为死去的像素哀悼。',
      icon: MessageSquare,
    }
  ]
};

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const NodeCard = ({ node, isRoot = false, onClick, isSelected }) => {
  const Icon = node.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => onClick && onClick(node)}
      className={`
        relative p-5 rounded-2xl transition-all duration-200 cursor-pointer group
        ${isRoot 
          ? 'bg-transparent min-w-[300px] max-w-[450px]' 
          : 'bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-zinc-700/50 min-w-[260px] max-w-[320px]'}
        ${isSelected ? 'ring-2 ring-slate-900 dark:ring-white' : ''}
      `}
    >
      {/* Header */}
      {!isRoot && (
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-gray-50 dark:bg-zinc-700/50 text-slate-600 dark:text-zinc-400">
            {Icon && <Icon size={14} />}
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {node.title}
          </span>
        </div>
      )}

      {/* Content */}
      <div className={`
        leading-relaxed text-slate-800 dark:text-zinc-100
        ${isRoot ? 'text-2xl font-semibold tracking-tight' : 'text-sm font-normal'}
      `}>
        {isRoot ? <TypewriterText text={node.content} /> : node.content}
      </div>
    </motion.div>
  );
};

const MindMap = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-50/50 dark:bg-zinc-900 p-12 flex items-center">
      
      {/* Dot Grid Background (Subtle) */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50" />

      <div className="relative z-10 flex items-center gap-24">
        {/* Root Node */}
        <div className="relative z-20">
          <NodeCard node={MOCK_TREE} isRoot={true} />
        </div>

        {/* Connecting Lines (SVG) */}
        <svg className="absolute inset-0 w-[1000px] h-[800px] pointer-events-none overflow-visible" style={{ left: 0, top: -300 }}>
          {/* Hardcoded paths for demo */}
          <motion.path 
            d="M 420 300 C 520 300, 520 200, 620 200" 
            fill="none" 
            className="stroke-gray-300 dark:stroke-zinc-700"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.path 
            d="M 420 300 C 520 300, 520 300, 620 300" 
            fill="none" 
            className="stroke-gray-300 dark:stroke-zinc-700"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path 
            d="M 420 300 C 520 300, 520 400, 620 400" 
            fill="none" 
            className="stroke-gray-300 dark:stroke-zinc-700"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </svg>

        {/* Children Column */}
        <div className="flex flex-col gap-8 z-20 pt-4">
          {MOCK_TREE.children.map((child, idx) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <NodeCard 
                node={child} 
                isSelected={selectedNode?.id === child.id}
                onClick={setSelectedNode}
              />
            </motion.div>
          ))}
        </div>

        {/* Expanded Details (Third Column) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 10, width: 0 }}
              className="relative z-20 pl-12"
            >
               {/* Connection Line */}
               <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-2 pointer-events-none overflow-visible">
                  <motion.path 
                    d="M 0 1 L 12 1" 
                    fill="none" 
                    className="stroke-gray-300 dark:stroke-zinc-700"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                  />
               </svg>

              <div className="bg-white dark:bg-zinc-800 shadow-lg border border-gray-100 dark:border-zinc-700/50 p-6 rounded-2xl w-[320px]">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  扩展详情
                </h3>
                <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
                  这是关于“{selectedNode.title}”的更多上下文信息。极简主义设计强调去除干扰，让内容成为主角。
                </p>
                <div className="mt-6 flex gap-3">
                  <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
                    深入探索
                  </button>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default MindMap;
