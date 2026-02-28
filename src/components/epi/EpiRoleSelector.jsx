import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EPI_ROLES, ROLE_COLORS } from './epiRoles';

export default function EpiRoleSelector({ activeRole, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {Object.values(EPI_ROLES).map((role) => {
        const colors = ROLE_COLORS[role.color];
        const isActive = activeRole === role.id;
        return (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.id)}
            className={cn(
              'text-left p-3 rounded-xl border transition-all duration-150',
              isActive
                ? `${colors.bg} ${colors.border} ring-1 ring-inset ${colors.border}`
                : 'bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-600'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{role.icon}</span>
              <span className={cn('text-xs font-semibold', isActive ? colors.text : 'text-white')}>
                {role.label}
              </span>
              {isActive && (
                <span className={cn('ml-auto text-[10px] px-1.5 py-0.5 rounded-full border', colors.badge)}>
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">{role.tagline}</p>
          </motion.button>
        );
      })}
    </div>
  );
}