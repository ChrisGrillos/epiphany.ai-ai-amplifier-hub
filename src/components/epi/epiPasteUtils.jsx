/**
 * Utility functions for detecting and parsing pasted web chats
 */

/**
 * Detect if text looks like a web chat transcript
 */
export const detectWebChatPaste = (text) => {
  if (!text || text.length < 100) return false;
  
  // Common patterns in web chat transcripts
  const patterns = [
    /^(User|You|Assistant|Grok|ChatGPT|Claude):/gm,
    /\n(User|You|Assistant|Grok|ChatGPT|Claude):/g,
  ];
  
  return patterns.some(pattern => {
    const matches = text.match(pattern);
    return matches && matches.length >= 2; // At least 2 turns
  });
};

/**
 * Parse web chat into structured messages
 */
export const parseWebChat = (text) => {
  const lines = text.split('\n');
  const messages = [];
  let currentRole = null;
  let currentContent = [];

  const roleMap = {
    'user': 'user',
    'you': 'user',
    'assistant': 'assistant',
    'grok': 'assistant',
    'chatgpt': 'assistant',
    'claude': 'assistant',
    'ai': 'assistant'
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line starts with a role indicator
    const roleMatch = trimmed.match(/^(User|You|Assistant|Grok|ChatGPT|Claude|AI):\s*(.*)$/i);
    
    if (roleMatch) {
      // Save previous message
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim()
        });
      }
      
      // Start new message
      const detectedRole = roleMatch[1].toLowerCase();
      currentRole = roleMap[detectedRole] || 'user';
      currentContent = roleMatch[2] ? [roleMatch[2]] : [];
    } else if (currentRole) {
      // Continue current message
      currentContent.push(trimmed);
    }
  }

  // Save last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join('\n').trim()
    });
  }

  return messages;
};

/**
 * Condense pasted chat into structured notes (no LLM)
 */
export const condenseWebChatLocal = (messages) => {
  let output = 'Condensed Notes (Local Parse by Epi)\n\n';
  
  // Extract key points from messages
  const facts = [];
  const questions = [];
  
  messages.forEach(msg => {
    // Look for questions
    if (msg.content.includes('?')) {
      const q = msg.content.split('?')[0].trim() + '?';
      questions.push(q);
    }
    
    // Look for factual statements (simple heuristic)
    if (msg.role === 'assistant' && msg.content.length < 200) {
      facts.push(msg.content);
    }
  });
  
  output += `Messages: ${messages.length}\n`;
  output += `User turns: ${messages.filter(m => m.role === 'user').length}\n`;
  output += `Assistant turns: ${messages.filter(m => m.role === 'assistant').length}\n\n`;
  
  if (questions.length > 0) {
    output += `Questions Asked:\n${questions.slice(0, 5).map(q => `- ${q}`).join('\n')}\n\n`;
  }
  
  output += 'Note: For AI-assisted condensing, use "condense with AI" command.';
  
  return output;
};

/**
 * Prepare context pack from current vault state
 */
export const prepareContextPackFromVault = (vault, references = [], recentMessages = []) => {
  let pack = 'Context Pack (Prepared by Epi)\n\n';
  
  const summary = vault?.living_summary || '';
  
  // Extract sections
  const objective = extractSection(summary, 'Objective');
  const keyFacts = extractListItems(summary, 'Key Facts');
  const decisions = extractListItems(summary, 'Decisions');
  const openQuestions = extractListItems(summary, 'Open Questions');
  const nextActions = extractListItems(summary, 'Next Actions');
  
  if (objective) {
    pack += `Objective:\n${objective}\n\n`;
  }
  
  if (keyFacts.length > 0) {
    pack += `Relevant Facts:\n${keyFacts.slice(0, 10).map(f => `- ${f}`).join('\n')}\n\n`;
  }
  
  if (decisions.length > 0) {
    pack += `Decisions Made:\n${decisions.map(d => `- ${d}`).join('\n')}\n\n`;
  }
  
  if (openQuestions.length > 0) {
    pack += `Open Questions:\n${openQuestions.map(q => `- ${q}`).join('\n')}\n\n`;
  }
  
  if (nextActions.length > 0) {
    pack += `Next Actions:\n${nextActions.map(a => `- ${a}`).join('\n')}\n\n`;
  }
  
  if (references.length > 0) {
    pack += `Attached References:\n${references.slice(0, 5).map(r => `- ${r.filename}${r.type ? ` (.${r.type})` : ''}`).join('\n')}\n\n`;
  }
  
  if (recentMessages.length > 0) {
    pack += `Recent Discussion (last ${Math.min(recentMessages.length, 3)} messages):\n`;
    pack += recentMessages.slice(-3).map(m => 
      `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}`
    ).join('\n\n');
    pack += '\n\n';
  }
  
  pack += 'Instructions for AI:\nContinue the conversation with context above. Maintain consistency with decisions made.';
  
  return pack;
};

/**
 * Generate vault snapshot summary
 */
export const generateVaultSnapshot = (vault, sessions = []) => {
  const summary = vault?.living_summary || '';
  
  let snapshot = `Vault Snapshot: ${vault?.name}\n\n`;
  
  const objective = extractSection(summary, 'Objective');
  const keyFacts = extractListItems(summary, 'Key Facts');
  const nextActions = extractListItems(summary, 'Next Actions');
  
  if (objective) {
    snapshot += `Objective:\n${objective}\n\n`;
  }
  
  if (keyFacts.length > 0) {
    snapshot += `Top Facts:\n${keyFacts.slice(0, 5).map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n`;
  }
  
  if (nextActions.length > 0) {
    snapshot += `Next Actions:\n${nextActions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`;
  }
  
  if (vault?.updated_date) {
    snapshot += `Last Updated: ${new Date(vault.updated_date).toLocaleString()}\n`;
  }
  
  if (sessions.length > 0) {
    const lastSession = sessions[0];
    snapshot += `Last Session: ${new Date(lastSession.created_date).toLocaleDateString()}\n`;
  }
  
  return snapshot;
};

// Helper functions
const extractSection = (markdown, sectionName) => {
  const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([^#]+)`, 'i');
  const match = markdown.match(regex);
  return match ? match[1].trim() : '';
};

const extractListItems = (markdown, sectionName) => {
  const section = extractSection(markdown, sectionName);
  if (!section) return [];
  
  const items = [];
  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      items.push(trimmed.replace(/^[-*]\s*/, ''));
    }
  }
  return items;
};