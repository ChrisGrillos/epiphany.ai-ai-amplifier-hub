/**
 * Session management utilities with auto-save and auto-close
 */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const AUTO_SAVE_INTERVAL_MS = 2 * 60 * 1000; // Auto-save every 2 minutes

/**
 * Check if session is inactive and should be auto-closed
 */
export const shouldAutoCloseSession = (session, messages) => {
  if (!session || !messages || messages.length === 0) return false;
  
  // Get last message timestamp
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage?.timestamp) return false;
  
  const lastActivityTime = new Date(lastMessage.timestamp);
  const now = new Date();
  const inactiveTime = now - lastActivityTime;
  
  return inactiveTime > SESSION_TIMEOUT_MS;
};

/**
 * Generate session summary for auto-closed sessions
 */
export const generateSessionSummary = (messages, references = []) => {
  if (!messages || messages.length === 0) {
    return 'Empty session - no messages recorded.';
  }
  
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  let summary = `Session Summary (${messages.length} messages)\n\n`;
  
  // Extract topics discussed
  const topics = new Set();
  userMessages.forEach(msg => {
    const words = msg.content.toLowerCase().split(/\s+/);
    // Simple keyword extraction (can be enhanced)
    words.forEach(word => {
      if (word.length > 5 && !['please', 'thanks', 'could', 'would', 'should'].includes(word)) {
        topics.add(word);
      }
    });
  });
  
  if (topics.size > 0) {
    summary += `Topics: ${Array.from(topics).slice(0, 5).join(', ')}\n\n`;
  }
  
  // Extract questions asked
  const questions = [];
  userMessages.forEach(msg => {
    const questionMatches = msg.content.match(/[^.!?]*\?/g);
    if (questionMatches) {
      questions.push(...questionMatches.slice(0, 2));
    }
  });
  
  if (questions.length > 0) {
    summary += `Questions:\n${questions.slice(0, 3).map(q => `- ${q.trim()}`).join('\n')}\n\n`;
  }
  
  // Key points from assistant
  const keyPoints = [];
  assistantMessages.forEach(msg => {
    if (msg.content.length > 50 && msg.content.length < 300) {
      keyPoints.push(msg.content);
    }
  });
  
  if (keyPoints.length > 0) {
    summary += `Key Points:\n${keyPoints.slice(0, 3).map(p => `- ${p.substring(0, 150)}...`).join('\n')}\n\n`;
  }
  
  if (references.length > 0) {
    summary += `References Used: ${references.map(r => r.filename).join(', ')}\n\n`;
  }
  
  summary += `Duration: ${userMessages.length} user turns, ${assistantMessages.length} assistant turns\n`;
  summary += `Status: Auto-closed due to inactivity`;
  
  return summary;
};

/**
 * Suggest next actions based on session content
 */
export const suggestNextActions = (sessionSummary, vault) => {
  const suggestions = [];
  
  // Check for unresolved questions
  if (sessionSummary.includes('Questions:')) {
    suggestions.push({
      type: 'continue',
      title: 'Answer Remaining Questions',
      description: 'This session had open questions. Continue the conversation to address them.',
      action: 'Start New Session'
    });
  }
  
  // Check for action items
  if (sessionSummary.toLowerCase().includes('need to') || 
      sessionSummary.toLowerCase().includes('should') ||
      sessionSummary.toLowerCase().includes('todo')) {
    suggestions.push({
      type: 'action',
      title: 'Track Action Items',
      description: 'Action items were mentioned. Add them to your Living Summary.',
      action: 'Update Summary'
    });
  }
  
  // Check if synthesis might be needed
  if (vault?.living_summary && vault.living_summary.length > 3000) {
    suggestions.push({
      type: 'synthesize',
      title: 'Synthesize Insights',
      description: 'Your Living Summary is growing. Consider synthesizing to consolidate.',
      action: 'Review Summary'
    });
  }
  
  // General continuation
  suggestions.push({
    type: 'new_session',
    title: 'Start Fresh Session',
    description: 'Continue exploring this topic with a new session.',
    action: 'New Session'
  });
  
  return suggestions;
};

/**
 * Create session manager for auto-save and auto-close
 */
export class SessionManager {
  constructor(vault, onAutoSave, onAutoClose) {
    this.vault = vault;
    this.onAutoSave = onAutoSave;
    this.onAutoClose = onAutoClose;
    this.autoSaveTimer = null;
    this.inactivityCheckTimer = null;
  }
  
  start() {
    // Set up auto-save interval
    this.autoSaveTimer = setInterval(() => {
      if (this.onAutoSave) {
        this.onAutoSave();
      }
    }, AUTO_SAVE_INTERVAL_MS);
    
    // Set up inactivity check
    this.inactivityCheckTimer = setInterval(() => {
      if (this.onAutoClose) {
        this.onAutoClose();
      }
    }, 60 * 1000); // Check every minute
  }
  
  stop() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.inactivityCheckTimer) {
      clearInterval(this.inactivityCheckTimer);
      this.inactivityCheckTimer = null;
    }
  }
  
  reset() {
    this.stop();
    this.start();
  }
}

/**
 * Format session title from content
 */
export const generateSessionTitle = (messages) => {
  if (!messages || messages.length === 0) return 'Untitled Session';
  
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Untitled Session';
  
  // Use first 50 chars of first message
  const title = firstUserMessage.content.substring(0, 50);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
};