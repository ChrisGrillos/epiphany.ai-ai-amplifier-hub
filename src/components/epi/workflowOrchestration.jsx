/**
 * Multi-agent workflow orchestration
 */

/**
 * Analyze user request and identify if it can be delegated
 */
export const analyzeWorkflowDelegation = (userMessage, vault, references) => {
  const content = userMessage.content.toLowerCase();
  const delegations = [];
  
  // Check for research tasks (suitable for API with web search)
  const researchPatterns = [
    /research|find information|look up|search for/i,
    /what is|what are|who is|tell me about/i,
    /latest|current|recent news|updates on/i
  ];
  
  if (researchPatterns.some(pattern => pattern.test(content))) {
    delegations.push({
      agent: 'api',
      task_type: 'research',
      reason: 'This appears to be a research task requiring external information',
      context_needed: ['living_summary'],
      suggested_prompt: `Research this topic and provide a comprehensive summary: ${userMessage.content}`,
      use_web_search: true
    });
  }
  
  // Check for document analysis (suitable for API with references)
  const analysisPatterns = [
    /analyze|review|summarize|explain/i,
    /compare|contrast|difference between/i,
    /extract|find in|locate in/i
  ];
  
  if (analysisPatterns.some(pattern => pattern.test(content)) && references.length > 0) {
    delegations.push({
      agent: 'api',
      task_type: 'document_analysis',
      reason: 'This requires analyzing reference documents',
      context_needed: ['living_summary', 'references'],
      suggested_prompt: userMessage.content,
      attach_references: true
    });
  }
  
  // Check for synthesis tasks (Epi should handle)
  const synthesisPatterns = [
    /condense|consolidate|merge/i,
    /context pack|prepare for/i,
    /summarize session|vault snapshot/i
  ];
  
  if (synthesisPatterns.some(pattern => pattern.test(content))) {
    delegations.push({
      agent: 'epi',
      task_type: 'synthesis',
      reason: 'This is a context coordination task best handled by Epi',
      context_needed: ['vault', 'sessions', 'references'],
      handle_directly: true
    });
  }
  
  // Check for creative tasks (suitable for API)
  const creativePatterns = [
    /write|draft|compose|create/i,
    /generate|brainstorm|ideate/i,
    /design|plan|outline/i
  ];
  
  if (creativePatterns.some(pattern => pattern.test(content))) {
    delegations.push({
      agent: 'api',
      task_type: 'creative',
      reason: 'This is a creative task suited for your configured AI',
      context_needed: ['living_summary'],
      suggested_prompt: userMessage.content
    });
  }
  
  return delegations;
};

/**
 * Prepare context pack for agent delegation
 */
export const prepareAgentContext = (delegation, vault, references, messages) => {
  let contextPack = '';
  
  if (delegation.context_needed.includes('living_summary')) {
    contextPack += `# Living Summary\n${vault.living_summary || 'No summary yet'}\n\n`;
  }
  
  if (delegation.context_needed.includes('references') && delegation.attach_references) {
    contextPack += `# Available References\n`;
    references.forEach(ref => {
      contextPack += `- ${ref.filename} (${ref.file_type})\n`;
    });
    contextPack += '\n';
  }
  
  if (delegation.context_needed.includes('sessions') && messages.length > 0) {
    contextPack += `# Recent Session Context\n`;
    const recentMsgs = messages.slice(-5);
    recentMsgs.forEach(msg => {
      contextPack += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content.substring(0, 150)}...\n`;
    });
    contextPack += '\n';
  }
  
  return contextPack;
};

/**
 * Generate orchestration recommendation message
 */
export const generateOrchestrationMessage = (delegations) => {
  if (delegations.length === 0) {
    return null;
  }
  
  const primaryDelegation = delegations[0];
  
  let message = `🎯 **Workflow Suggestion**\n\n`;
  message += `I've analyzed your request: "${primaryDelegation.task_type}"\n\n`;
  message += `**Recommended Agent:** ${primaryDelegation.agent === 'api' ? 'Your configured AI (API)' : 'Epi (internal)'}\n`;
  message += `**Reason:** ${primaryDelegation.reason}\n\n`;
  
  if (primaryDelegation.agent === 'api') {
    message += `I'll route this to your API agent with the following context:\n`;
    primaryDelegation.context_needed.forEach(ctx => {
      message += `- ${ctx.replace('_', ' ')}\n`;
    });
    message += `\n`;
    
    if (primaryDelegation.use_web_search) {
      message += `💡 *Tip: This will use web search for up-to-date information*\n`;
    }
  } else {
    message += `I'll handle this directly using my orchestration capabilities.\n`;
  }
  
  return message;
};

/**
 * Check if workflow should be automatically executed
 */
export const shouldAutoExecuteWorkflow = (delegation, epiLevel) => {
  // Auto-execute only at Epi Level 4 for synthesis tasks
  if (epiLevel === 4 && delegation.handle_directly) {
    return true;
  }
  
  // Otherwise, suggest but don't auto-execute
  return false;
};