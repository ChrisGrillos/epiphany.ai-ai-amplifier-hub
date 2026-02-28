import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FolderPlus, ArrowRight, Brain, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen({ onCreateVault, onSetupApiKey, hasApiKey, onOpenSummary, onEndSession, onOpenApiSetup }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative mb-10"
        >
          <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 h-24 w-24 mx-auto rounded-3xl bg-violet-500/20 blur-2xl"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Epiphany.AI
          </h1>
          <p className="text-violet-400 text-sm uppercase tracking-widest mb-6">
            AI Amplifier Hub
          </p>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto">
            A calm workspace for human thinking. Memory that improves, never rots.
          </p>
        </motion.div>

        {/* Features — interactive */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 my-12"
        >
          {/* Living Memory → opens Living Summary view */}
          <button
            onClick={onOpenSummary}
            className="group text-center p-4 rounded-xl border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer"
          >
            <div className="h-12 w-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15 transition-all">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1 group-hover:text-emerald-300 transition-colors">Living Memory</h3>
            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">View your Living Summary →</p>
          </button>

          {/* Smart Synthesis → triggers End Session / Synthesize */}
          <button
            onClick={onEndSession}
            className="group text-center p-4 rounded-xl border border-transparent hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 cursor-pointer"
          >
            <div className="h-12 w-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:border-amber-400/50 group-hover:bg-amber-500/15 transition-all">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1 group-hover:text-amber-300 transition-colors">Smart Synthesis</h3>
            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Synthesize session now →</p>
          </button>

          {/* Local First → opens API Key / privacy settings */}
          <button
            onClick={onSetupApiKey}
            className="group text-center p-4 rounded-xl border border-transparent hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-200 cursor-pointer"
          >
            <div className="h-12 w-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:border-blue-400/50 group-hover:bg-blue-500/15 transition-all">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1 group-hover:text-blue-300 transition-colors">Local First</h3>
            <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Manage your API keys →</p>
          </button>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          {!hasApiKey && (
            <Button
              onClick={onSetupApiKey}
              variant="outline"
              className="w-full max-w-xs border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12"
            >
              <Shield className="h-4 w-4 mr-2" />
              Configure Grok API Key
            </Button>
          )}
          <Button
            onClick={onCreateVault}
            className="w-full max-w-xs bg-violet-600 hover:bg-violet-500 text-white h-12 group"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Your First Vault
            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-zinc-600 mt-12"
        >
          Powered by Grok (xAI) • Your patient, amplifying co-pilot
        </motion.p>
      </motion.div>
    </div>
  );
}