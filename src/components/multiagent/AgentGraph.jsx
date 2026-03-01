import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PERSONALITY_AGENTS } from './personalityAgents';

const NODE_RADIUS = 30;
const CENTER_X = 180;
const CENTER_Y = 130;

function getNodePositions(agentIds) {
  const count = agentIds.length;
  if (count === 0) return {};
  if (count === 1) return { [agentIds[0]]: { x: CENTER_X, y: CENTER_Y } };

  const angleStep = (2 * Math.PI) / count;
  const radius = Math.min(90, 40 + count * 14);
  const positions = {};
  agentIds.forEach((id, i) => {
    const angle = i * angleStep - Math.PI / 2;
    positions[id] = {
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    };
  });
  return positions;
}

// Build edges: each agent -> next agent (circular), plus synthesizer connects to all
function getEdges(agentIds, messages) {
  const edges = [];
  if (agentIds.length < 2) return edges;

  // Flow edges (circular order)
  for (let i = 0; i < agentIds.length; i++) {
    edges.push({ from: agentIds[i], to: agentIds[(i + 1) % agentIds.length], type: 'flow' });
  }

  // Active edges based on messages
  const activeFrom = new Set(messages.slice(-agentIds.length).map(m => m.agentId));
  return edges.map(e => ({ ...e, active: activeFrom.has(e.from) }));
}

export default function AgentGraph({ activeAgents, messages, currentAgentId }) {
  const positions = useMemo(() => getNodePositions(activeAgents), [activeAgents.join(',')]);
  const edges = useMemo(() => getEdges(activeAgents, messages), [activeAgents.join(','), messages.length]);

  const agentData = activeAgents.map(id => ({
    ...PERSONALITY_AGENTS.find(a => a.id === id),
    id,
  })).filter(Boolean);

  // Count messages per agent for activity glow
  const msgCount = {};
  messages.forEach(m => { msgCount[m.agentId] = (msgCount[m.agentId] || 0) + 1; });

  if (activeAgents.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <p className="text-[10px] text-zinc-600 px-3 pt-2 font-medium tracking-wide uppercase">Agent Flow</p>
      <svg width="100%" viewBox="0 0 360 260" className="block">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgb(109 40 217 / 0.6)" />
          </marker>
          <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgb(167 139 250)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;

          // Shorten line so it doesn't overlap nodes
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          const x1 = from.x + nx * (NODE_RADIUS + 2);
          const y1 = from.y + ny * (NODE_RADIUS + 2);
          const x2 = to.x - nx * (NODE_RADIUS + 8);
          const y2 = to.y - ny * (NODE_RADIUS + 8);

          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={edge.active ? 'rgb(167 139 250)' : 'rgb(63 63 70)'}
              strokeWidth={edge.active ? 1.5 : 1}
              strokeDasharray={edge.active ? undefined : '4 3'}
              markerEnd={edge.active ? 'url(#arrow-active)' : 'url(#arrow)'}
              opacity={edge.active ? 1 : 0.5}
            />
          );
        })}

        {/* Breaker messages — draw as dashed lines from center */}
        {messages.filter(m => m.isBreaker).length > 0 && (
          <circle
            cx={CENTER_X} cy={CENTER_Y}
            r={8}
            fill="rgb(245 158 11 / 0.2)"
            stroke="rgb(245 158 11 / 0.6)"
            strokeWidth={1.5}
          />
        )}

        {/* Nodes */}
        {agentData.map(agent => {
          const pos = positions[agent.id];
          if (!pos) return null;
          const isCurrent = agent.id === currentAgentId;
          const count = msgCount[agent.id] || 0;

          return (
            <g key={agent.id}>
              {/* Glow ring for active */}
              {isCurrent && (
                <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 6}
                  fill="none" stroke="rgb(139 92 246 / 0.4)" strokeWidth={2}
                  className="animate-ping" style={{ animationDuration: '1.5s' }}
                />
              )}
              {/* Activity glow */}
              {count > 0 && (
                <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 4}
                  fill="none" stroke="rgb(139 92 246 / 0.2)" strokeWidth={count * 1.5}
                />
              )}
              {/* Node circle */}
              <circle
                cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                fill={isCurrent ? 'rgb(109 40 217 / 0.3)' : 'rgb(39 39 42)'}
                stroke={isCurrent ? 'rgb(139 92 246)' : 'rgb(63 63 70)'}
                strokeWidth={isCurrent ? 2 : 1}
              />
              {/* Emoji */}
              <text x={pos.x} y={pos.y - 4} textAnchor="middle" dominantBaseline="middle" fontSize={16}>
                {agent.icon}
              </text>
              {/* Name */}
              <text x={pos.x} y={pos.y + 14} textAnchor="middle" fontSize={9} fill="rgb(161 161 170)">
                {agent.name}
              </text>
              {/* Message count badge */}
              {count > 0 && (
                <g>
                  <circle cx={pos.x + NODE_RADIUS - 4} cy={pos.y - NODE_RADIUS + 4} r={8}
                    fill="rgb(109 40 217)" />
                  <text x={pos.x + NODE_RADIUS - 4} y={pos.y - NODE_RADIUS + 4}
                    textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="white" fontWeight="bold">
                    {count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}