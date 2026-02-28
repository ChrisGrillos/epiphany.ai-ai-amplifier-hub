import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * EpiAvatar — animated states: idle | thinking | speaking | alert
 * Driven by `state` prop from parent. Falls back to 'idle'.
 */

const STATE_CONFIG = {
  idle: {
    ringColor: 'rgba(139,92,246,0.35)',
    ringScale: [1, 1.08, 1],
    ringDuration: 3.5,
    glowColor: 'rgba(139,92,246,0.18)',
    dotColor: '#34d399', // emerald
    dotPulse: true,
    label: null,
  },
  thinking: {
    ringColor: 'rgba(234,179,8,0.55)',
    ringScale: [1, 1.14, 1, 1.07, 1],
    ringDuration: 1.2,
    glowColor: 'rgba(234,179,8,0.22)',
    dotColor: '#eab308', // yellow
    dotPulse: true,
    label: 'Thinking…',
  },
  speaking: {
    ringColor: 'rgba(99,209,162,0.6)',
    ringScale: [1, 1.12, 0.96, 1.1, 1],
    ringDuration: 0.8,
    glowColor: 'rgba(99,209,162,0.25)',
    dotColor: '#6ee7b7', // teal
    dotPulse: false,
    label: 'Responding',
  },
  alert: {
    ringColor: 'rgba(239,68,68,0.65)',
    ringScale: [1, 1.16, 1],
    ringDuration: 0.6,
    glowColor: 'rgba(239,68,68,0.25)',
    dotColor: '#f87171', // red
    dotPulse: true,
    label: 'Alert',
  },
};

export default function EpiAvatar({ onClick, className, state = 'idle' }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative h-16 w-16 rounded-full focus:outline-none',
        className
      )}
      aria-label="Epi — click to open settings"
    >
      {/* Outer animated ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 pointer-events-none"
        style={{ borderColor: cfg.ringColor }}
        animate={{ scale: cfg.ringScale, opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: cfg.ringDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glow halo */}
      <motion.div
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: cfg.ringDuration, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Avatar image */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6972678b2088508d2d95b4e6/312428a4e_ChatGPTImageJan22202604_55_53PM.png"
        alt="Epi"
        className="absolute inset-0 w-full h-full object-cover rounded-full"
      />

      {/* Thinking dots overlay */}
      <AnimatePresence>
        {state === 'thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full flex items-end justify-center pb-1 bg-zinc-900/50"
          >
            <div className="flex gap-0.5 mb-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-yellow-400 block"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Speaking waveform overlay */}
        {state === 'speaking' && (
          <motion.div
            key="speaking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full flex items-end justify-center pb-1 bg-zinc-900/40"
          >
            <div className="flex gap-0.5 items-end mb-1">
              {[3, 5, 7, 5, 3].map((h, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-emerald-400 block"
                  style={{ height: h }}
                  animate={{ height: [h, h * 2.2, h] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Alert flash overlay */}
        {state === 'alert' && (
          <motion.div
            key="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Status dot */}
      <motion.div
        className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 shadow-lg"
        style={{ background: cfg.dotColor }}
        animate={cfg.dotPulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* State label tooltip */}
      <AnimatePresence>
        {cfg.label && (
          <motion.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 pointer-events-none"
          >
            {cfg.label}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}