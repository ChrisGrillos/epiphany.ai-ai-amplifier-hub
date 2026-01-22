import { base44 } from '@/api/base44Client';

/**
 * Get effective Epi level for a vault (considering override)
 */
export const getEffectiveEpiLevel = (vault, globalSettings) => {
  if (vault?.epi_level_override !== undefined && vault.epi_level_override !== null) {
    return vault.epi_level_override;
  }
  return globalSettings?.epi_level ?? 1;
};

/**
 * Log Epi action
 */
export const logEpiAction = async (vaultId, actionType, epiLevel, details = {}, output = '') => {
  try {
    await base44.entities.EpiLog.create({
      vault_id: vaultId,
      action_type: actionType,
      epi_level_at_time: epiLevel,
      details,
      epi_output: output
    });
  } catch (error) {
    console.error('Failed to log Epi action:', error);
  }
};

/**
 * Prepare context pack for external AI
 */
export const prepareContextPack = (vault, references = [], recentMessages = [], instructions = '') => {
  const summary = vault?.living_summary || '';
  
  // Parse Living Summary sections
  const objective = extractSection(summary, 'Objective');
  const keyFacts = extractListItems(summary, 'Key Facts');
  const decisions = extractListItems(summary, 'Decisions');
  const openQuestions = extractListItems(summary, 'Open Questions');
  const nextActions = extractListItems(summary, 'Next Actions');

  let pack = `Context Pack (Prepared by Epi)\n\n`;
  
  if (objective) {
    pack += `Objective:\n${objective}\n\n`;
  }
  
  if (keyFacts.length > 0) {
    pack += `Relevant Facts:\n${keyFacts.map(f => `- ${f}`).join('\n')}\n\n`;
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
    pack += `Attached References:\n${references.map(r => `- ${r.filename} (.${r.file_type})`).join('\n')}\n\n`;
  }
  
  if (recentMessages.length > 0) {
    pack += `Recent Discussion (last ${Math.min(recentMessages.length, 5)} messages):\n`;
    pack += recentMessages.slice(-5).map(m => 
      `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`
    ).join('\n\n');
    pack += '\n\n';
  }
  
  if (instructions) {
    pack += `Instructions for AI:\n${instructions}\n`;
  }

  return pack;
};

/**
 * Check if Epi should speak (based on level and context)
 */
export const shouldEpiSpeak = (epiLevel, actionType) => {
  if (epiLevel === 0) return false;
  if (epiLevel === 1) return false; // Silent
  if (epiLevel === 2) {
    // Only on destructive actions or user-triggered checks
    return ['guardian_check', 'synthesis_complete'].includes(actionType);
  }
  if (epiLevel >= 3) return true; // Always available
  return false;
};

/**
 * Generate Level 4 proactive nudge (if appropriate)
 */
export const generateProactiveNudge = (vault, messages, references) => {
  const nudges = [];
  
  // Check for bloated context
  const totalChars = (vault?.living_summary?.length || 0) + 
                    messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > 50000) {
    nudges.push({
      type: 'context_bloat',
      message: 'Context is getting large. Consider synthesizing to condense.',
      severity: 'low'
    });
  }
  
  // Check for many unattached references
  if (references.length > 5) {
    nudges.push({
      type: 'unused_references',
      message: `${references.length} references available. Attach them to provide context.`,
      severity: 'low'
    });
  }
  
  // Check for long sessions without synthesis
  if (messages.length > 20) {
    nudges.push({
      type: 'long_session',
      message: 'Session has grown long. May be time to synthesize and capture insights.',
      severity: 'medium'
    });
  }
  
  return nudges[0] || null; // Return only the first/most important
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