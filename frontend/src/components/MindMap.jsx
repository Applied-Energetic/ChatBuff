import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, GitBranch, Cpu, User, Loader2 } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

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

// NodeCard Component with blur/solid state and source labels
const NodeCard = React.forwardRef(({ node, isRoot = false, onClick, isSelected, isCandidate }, ref) => {
  const Icon = node.icon || MessageSquare;
  
  return (
    <motion.div
      ref={ref}
      data-node-id={node.id}
      initial={{ opacity: 0, scale: 0.9, x: -20 }}
      animate={{ 
        opacity: isCandidate && !isSelected ? 0.55 : 1, 
        scale: isSelected ? 1.02 : 1, 
        x: 0,
        filter: isCandidate && !isSelected ? 'blur(1px)' : 'none'
      }}
      whileHover={{ 
        opacity: 1, 
        filter: 'none',
        scale: 1.03
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={() => onClick && onClick(node)}
      className={`
        relative p-4 rounded-xl transition-shadow duration-200 cursor-pointer group
        ${isRoot 
          ? 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-zinc-800 dark:to-zinc-900 min-w-[280px] max-w-[380px] shadow-lg border-2 border-slate-200 dark:border-zinc-700' 
          : 'min-w-[220px] max-w-[280px]'}
        ${isCandidate 
          ? 'border-2 border-dashed border-slate-300 dark:border-zinc-600 bg-slate-50/60 dark:bg-zinc-800/40 backdrop-blur-sm' 
          : !isRoot ? 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg border-solid' : ''}
      `}
    >
      {/* Source Label */}
      {!isRoot && (
        <div className="absolute -top-2.5 right-3 flex gap-1">
          <span className={`
            text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1
            ${node.source === 'auto' 
              ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700' 
              : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'}
          `}>
            {node.source === 'auto' ? <Cpu size={10} /> : <User size={10} />}
            {node.source === 'auto' ? 'AI' : 'Manual'}
          </span>
          {node.confidence != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-0.5
              ${node.confidence >= 0.8 ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/40 dark:text-green-300' :
                node.confidence >= 0.6 ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300' :
                'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-300'}
            `}>
              {Math.round(node.confidence * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Header */}
      {!isRoot && (
        <div className="flex items-center gap-2 mb-2 mt-1">
          <div className={`p-1.5 rounded-md ${isCandidate ? 'bg-slate-100/50 dark:bg-zinc-700/30' : 'bg-gray-100 dark:bg-zinc-700/50'} text-slate-500 dark:text-zinc-400`}>
            {Icon && <Icon size={14} />}
          </div>
          <span className={`text-xs font-medium ${isCandidate ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-500 dark:text-zinc-400'}`}>
            {node.title || 'Idea'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className={`
        leading-relaxed
        ${isRoot ? 'text-xl font-semibold tracking-tight text-slate-800 dark:text-zinc-100' : 'text-sm'}
        ${isCandidate ? 'italic text-slate-500 dark:text-zinc-400' : 'text-slate-700 dark:text-zinc-200'}
      `}>
        {isRoot ? <TypewriterText text={node.content} /> : node.content}
      </div>

      {/* Candidate hint */}
      {isCandidate && (
        <div className="mt-2 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
          <GitBranch size={10} />
          Click to select this branch
        </div>
      )}
    </motion.div>
  );
});

NodeCard.displayName = 'NodeCard';

const MindMap = ({ addHistory }) => {
  // Initial State: root node only
  const [levels, setLevels] = useState([
    [{ 
      id: 'root', 
      type: 'root', 
      content: "Hello, I'm ChatBuff. Click me to start brainstorming!", 
      source: 'auto',
      confidence: 1.0
    }]
  ]);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Refs for SVG drawing based on real DOM positions
  const containerRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const [svgLines, setSvgLines] = useState([]);

  // Helper: Find node position (col, idx)
  const findNodePos = useCallback((id) => {
    for (let c = 0; c < levels.length; c++) {
      const idx = levels[c].findIndex(n => n.id === id);
      if (idx !== -1) return { col: c, idx };
    }
    return null;
  }, [levels]);

  // API Call to generate candidates
  const fetchCandidates = async (parentNode) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Brainstorming",
          parent_content: parentNode.content
        })
      });
      
      if (!response.ok) throw new Error('API Error: ' + response.status);
      
      const data = await response.json();
      
      // Estimate tokens (rough: 1 token ~= 1.5 chars for Chinese/English mix)
      const totalChars = data.suggestions.join('').length;
      const estimatedTokens = Math.ceil(totalChars / 1.5);
      
      if (addHistory) {
        addHistory({
          type: 'generate',
          message: `Generated ${data.suggestions.length} candidates for "${parentNode.content.slice(0, 15)}..."`,
          tokens: estimatedTokens,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      return data.suggestions.map((text, i) => ({
        id: `${parentNode.id}-c-${Date.now()}-${i}`,
        type: 'candidate',
        title: `Branch ${i + 1}`,
        content: text,
        parentId: parentNode.id,
        source: 'auto',
        confidence: Math.round((0.90 - i * 0.08) * 100) / 100,
        icon: GitBranch
      }));

    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      if (addHistory) {
        addHistory({
          type: 'error',
          message: "Generation failed: " + error.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      // Return fallback mock data
      return [1, 2, 3].map((i) => ({
        id: `${parentNode.id}-c-${Date.now()}-${i}`,
        type: 'candidate',
        title: `Branch ${i}`,
        content: `(Offline) Extension ${i} based on "${parentNode.content.slice(0, 12)}..."`,
        parentId: parentNode.id,
        source: 'auto',
        confidence: 0.5,
        icon: GitBranch
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle Node Click: Core Logic
  const handleNodeClick = async (node) => {
    setSelectedNode(node);

    // 1. If clicking a candidate -> commit it (make it solid, but DON'T remove siblings)
    if (node.type === 'candidate') {
      setLevels(prev => prev.map(level => 
        level.map(n => n.id === node.id ? { ...n, type: 'committed' } : n)
      ));
      if (addHistory) {
        addHistory({
          type: 'commit',
          message: `Selected: "${node.content.slice(0, 20)}..."`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      return; 
    }

    // 2. If clicking a committed/root node -> generate candidates if none exist
    if (node.type === 'committed' || node.type === 'root') {
      const pos = findNodePos(node.id);
      if (!pos) return;
      
      const nextColIdx = pos.col + 1;
      // Check if children already exist for this specific node
      const existingChildren = levels[nextColIdx]?.filter(n => n.parentId === node.id);
      
      if (existingChildren && existingChildren.length > 0) {
        // Children exist - just visually focus, don't regenerate
        return;
      }

      // Generate new candidates via API
      const newCandidates = await fetchCandidates(node);
      if (newCandidates.length > 0) {
        setLevels(prev => {
          const newLevels = [...prev.map(l => [...l])];
          // Ensure next column exists
          if (!newLevels[nextColIdx]) newLevels[nextColIdx] = [];
          // Add new candidates (don't replace existing nodes - preserve branching!)
          newLevels[nextColIdx] = [...newLevels[nextColIdx], ...newCandidates];
          return newLevels;
        });
      }
    }
  };

  // Calculate SVG Lines based on real DOM positions
  const calculateLines = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const lines = [];

    levels.forEach((level) => {
      level.forEach(node => {
        if (!node.parentId) return;
        
        const sourceEl = nodeRefs.current.get(node.parentId);
        const targetEl = nodeRefs.current.get(node.id);
        
        if (sourceEl && targetEl) {
          const sourceRect = sourceEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          const x1 = sourceRect.right - containerRect.left;
          const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;
          const x2 = targetRect.left - containerRect.left;
          const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;

          const controlOffset = Math.abs(x2 - x1) * 0.4;

          lines.push({
            id: `${node.parentId}-${node.id}`,
            path: `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`,
            isCandidate: node.type === 'candidate'
          });
        }
      });
    });
    setSvgLines(lines);
  }, [levels]);

  // Recalculate lines on levels change
  useLayoutEffect(() => {
    const timer = setTimeout(calculateLines, 100);
    return () => clearTimeout(timer);
  }, [levels, calculateLines]);

  // Resize observer
  useEffect(() => {
    const handleResize = () => calculateLines();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLines]);

  // Delayed recalc for animation settle
  useEffect(() => {
    const timer = setTimeout(calculateLines, 400);
    return () => clearTimeout(timer);
  }, [levels, calculateLines]);

  const totalNodes = levels.flat().length;
  const candidateCount = levels.flat().filter(n => n.type === 'candidate').length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap">
        <div className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-gray-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-2">
          <GitBranch size={14} />
          <span>{totalNodes} nodes</span>
          {candidateCount > 0 && <span className="text-slate-400">({candidateCount} candidates)</span>}
        </div>
        {loading && (
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            AI thinking...
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 flex gap-3 text-[10px] text-slate-500 dark:text-zinc-500">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed border-slate-300" /> Candidate</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border border-gray-200" /> Committed</span>
      </div>

      {/* Mind Map Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-12 flex items-center"
      >
        <div className="flex gap-16 min-w-max relative py-8">
          {/* SVG Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {svgLines.map(line => (
              <motion.path
                key={line.id}
                d={line.path}
                fill="none"
                strokeWidth={line.isCandidate ? 1.5 : 2}
                strokeDasharray={line.isCandidate ? "6 4" : "none"}
                className={line.isCandidate 
                  ? 'stroke-slate-300 dark:stroke-zinc-600' 
                  : 'stroke-slate-400 dark:stroke-zinc-500'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </svg>

          {/* Columns */}
          {levels.map((level, colIndex) => (
            <div key={colIndex} className="flex flex-col justify-center gap-5 z-10">
              <AnimatePresence mode="popLayout">
                {level.map(node => (
                  <NodeCard
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(node.id, el);
                      else nodeRefs.current.delete(node.id);
                    }}
                    node={node}
                    isRoot={node.type === 'root'}
                    isCandidate={node.type === 'candidate'}
                    isSelected={selectedNode?.id === node.id}
                    onClick={handleNodeClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MindMap;
