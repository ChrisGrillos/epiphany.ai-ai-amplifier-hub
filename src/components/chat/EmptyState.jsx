import React from 'react';
import { Sparkles, Brain, Zap, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ vaultName, onStartPrompt }) {
  const suggestions = [
    "Let's brainstorm ideas for...",
    "Help me organize my thoughts on...",
    "What are the key considerations for...",
    "Review my current approach to..."
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg text-center"
      >
        {/* Icon */}
        <div className="relative mb-8">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-violet-400" />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 h-20 w-20 mx-auto rounded-2xl bg-violet-500/10 blur-xl"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-3">
          Ready to amplify your thinking
        </h2>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Your Living Summary for <span className="text-violet-400 font-medium">{vaultName}</span> is loaded. 
          Start a conversation and I'll remember what matters.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
            <Brain className="h-5 w-5 text-emerald-400 mb-2" />
            <p className="text-xs text-zinc-400">Persistent Memory</p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
            <Zap className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-xs text-zinc-400">Smart Synthesis</p>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
            <BookOpen className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-xs text-zinc-400">Evolving Context</p>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              onClick={() => onStartPrompt(suggestion)}
              className="px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all group flex items-center gap-2"
            >
              {suggestion}
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}