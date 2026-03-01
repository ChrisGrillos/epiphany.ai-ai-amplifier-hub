/**
 * Agent Message Bus — simulates a gRPC-style typed message bus in the browser.
 * Each agent registers, publishes, and subscribes to typed messages.
 * Future agents (Social Media, etc.) just register here.
 */

const AGENT_REGISTRY = new Map(); // agentId -> { meta, handler }
const SUBSCRIBERS = new Map();    // messageType -> [handlers]
const MESSAGE_LOG = [];

export function registerAgent(agentId, meta, handler) {
  AGENT_REGISTRY.set(agentId, { meta, handler });
}

export function unregisterAgent(agentId) {
  AGENT_REGISTRY.delete(agentId);
}

export function getRegisteredAgents() {
  return Array.from(AGENT_REGISTRY.entries()).map(([id, { meta }]) => ({ id, ...meta }));
}

/**
 * Publish a typed message to the bus.
 * All subscribers of that messageType will receive it.
 */
export function publish(message) {
  const envelope = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...message,
  };
  MESSAGE_LOG.push(envelope);

  const handlers = SUBSCRIBERS.get(message.type) || [];
  handlers.forEach(h => h(envelope));

  // Also deliver to target agent if specified
  if (message.to) {
    const agent = AGENT_REGISTRY.get(message.to);
    if (agent?.handler) agent.handler(envelope);
  }

  return envelope;
}

export function subscribe(messageType, handler) {
  if (!SUBSCRIBERS.has(messageType)) SUBSCRIBERS.set(messageType, []);
  SUBSCRIBERS.get(messageType).push(handler);
  return () => {
    const handlers = SUBSCRIBERS.get(messageType) || [];
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

export function getMessageLog(limit = 50) {
  return MESSAGE_LOG.slice(-limit);
}

// Message types enum
export const MSG_TYPES = {
  USER_INPUT: 'user_input',
  AGENT_REPLY: 'agent_reply',
  LOOP_DETECTED: 'loop_detected',
  CIRCUIT_BREAK: 'circuit_break',
  AGENT_JOIN: 'agent_join',
  AGENT_LEAVE: 'agent_leave',
  SYNTHESIS_REQUEST: 'synthesis_request',
};