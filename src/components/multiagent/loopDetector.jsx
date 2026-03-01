/**
 * Loop Detector
 * Watches the message history for signs of circular reasoning:
 * - Semantic repetition (same keywords dominating)
 * - Back-and-forth stalemates (agents repeating the same position)
 * - No new information added in N turns
 */

const LOOP_WINDOW = 6; // messages to scan
const SIMILARITY_THRESHOLD = 0.65;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 3);
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detect if a message sequence is looping.
 * Returns { detected: bool, reason: string, severity: 'low'|'medium'|'high' }
 */
export function detectLoop(messages) {
  if (messages.length < LOOP_WINDOW) return { detected: false };

  const recent = messages.slice(-LOOP_WINDOW);
  const tokens = recent.map(m => tokenize(m.content || ''));

  // Check pairwise similarity for consecutive messages from same role
  let highSimCount = 0;
  for (let i = 1; i < tokens.length; i++) {
    const sim = jaccardSimilarity(tokens[i - 1], tokens[i]);
    if (sim > SIMILARITY_THRESHOLD) highSimCount++;
  }

  if (highSimCount >= 3) {
    return {
      detected: true,
      reason: 'Messages are highly repetitive — agents may be restating the same content without progress.',
      severity: 'high',
    };
  }

  // Check if any single token cluster dominates (narrow topic fixation)
  const allTokens = tokens.flat();
  const freq = {};
  allTokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const topToken = sorted[0];
  if (topToken && topToken[1] / allTokens.length > 0.15) {
    return {
      detected: true,
      reason: `Conversation may be stuck on "${topToken[0]}" — consider broadening the frame or injecting a new angle.`,
      severity: 'medium',
    };
  }

  return { detected: false };
}

/**
 * Generate a circuit-breaker prompt that Epi can inject to break the loop.
 */
export function generateCircuitBreaker(loopReason, context = '') {
  return `[CIRCUIT BREAKER] — Epi has detected a reasoning loop.

Detected pattern: ${loopReason}

Instructions: Step back from the current thread. Consider:
1. What assumption has been taken for granted that might be wrong?
2. What would someone approaching this fresh say in one sentence?
3. Is there a completely different angle worth exploring?

${context ? `Vault context for grounding:\n${context}` : ''}

Reframe and continue from a new perspective.`;
}