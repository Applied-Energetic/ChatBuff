import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

const AudioVisualizer = ({ isActive = false, onClick }) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      
      {/* Status Text - Only visible when active */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
        className="text-xs font-medium text-slate-400 dark:text-zinc-500 tracking-widest uppercase"
      >
        正在聆听...
      </motion.div>

      {/* Button Container */}
      <button 
        onClick={onClick}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full 
          transition-all duration-500 focus:outline-none cursor-pointer
          ${isActive 
            ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg' 
            : 'bg-white text-slate-900 dark:bg-zinc-800 dark:text-zinc-400 shadow-md hover:shadow-lg border border-slate-100 dark:border-zinc-700'}
        `}
      >
        {/* Pulse Ring (Active State) */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border border-slate-900/30 dark:border-white/30"
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        <Mic size={24} strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default AudioVisualizer;
