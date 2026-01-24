/**
 * Token estimation and management utilities
 */

/**
 * Estimate tokens for text (approximation)
 * Rule of thumb: ~1.3 tokens per word, plus character-based estimate
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.ceil(words * 1.3 + chars / 4);
};

/**
 * Check if text is within token limit
 */
export const isWithinTokenLimit = (text, limit = 1600) => {
  return estimateTokens(text) <= limit;
};

/**
 * Truncate text to fit within token limit
 */
export const truncateToTokenLimit = (text, limit = 1600) => {
  const currentTokens = estimateTokens(text);
  if (currentTokens <= limit) return text;
  
  // Approximate ratio to reduce text
  const ratio = limit / currentTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 90% safety margin
  
  return text.substring(0, targetLength) + '\n\n[Truncated by Epi for length]';
};

/**
 * Get token usage summary
 */
export const getTokenSummary = (text) => {
  const tokens = estimateTokens(text);
  const words = text.split(/\s+/).length;
  const chars = text.length;
  
  return {
    tokens,
    words,
    chars,
    withinLimit: tokens <= 1600,
    percentOfLimit: Math.round((tokens / 1600) * 100)
  };
};

/**
 * Check if LLM assist is needed based on complexity
 */
export const needsLLMAssist = (text, threshold = 5000) => {
  // Use LLM if text is very long or complex
  if (text.length > threshold) return true;
  
  // Check for complex formatting
  const hasCodeBlocks = text.includes('```');
  const hasMultipleSections = (text.match(/#{1,3}\s/g) || []).length > 5;
  const hasManyBullets = (text.match(/^[\s]*[-*]\s/gm) || []).length > 20;
  
  return hasCodeBlocks || hasMultipleSections || hasManyBullets;
};