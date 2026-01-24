/**
 * Context-aware suggestion engine
 */

/**
 * Generate suggestions based on current context
 */
export const generateContextSuggestions = (context) => {
  const suggestions = [];
  const { 
    location, 
    vault, 
    references = [], 
    messages = [], 
    livingSummary = '',
    hasActiveSession = false 
  } = context;

  // References panel context
  if (location === 'references') {
    if (references.length > 0) {
      suggestions.push({
        id: 'ref-context-pack',
        type: 'epi',
        title: 'Prepare Context Pack',
        description: `Use ${references.length} reference${references.length > 1 ? 's' : ''} to create a context pack for external AI`,
        action: 'Create Pack',
        handler: 'prepareContextPackWithReferences'
      });
    }
    
    if (references.length > 3) {
      suggestions.push({
        id: 'ref-summarize',
        type: 'epi',
        title: 'Summarize References',
        description: 'Get a condensed overview of all attached references',
        action: 'Summarize',
        handler: 'summarizeReferences'
      });
    }
  }

  // Living Summary context
  if (location === 'summary') {
    if (livingSummary && livingSummary.length > 2000) {
      suggestions.push({
        id: 'summary-condense',
        type: 'epi',
        title: 'Condense Summary',
        description: 'Your summary is getting long. Let Epi help condense it while keeping key info',
        action: 'Condense',
        handler: 'condenseSummary'
      });
    }

    if (livingSummary) {
      suggestions.push({
        id: 'summary-refine',
        type: 'api',
        title: 'Refine with AI',
        description: 'Use your API to improve clarity and structure of the Living Summary',
        action: 'Refine',
        handler: 'refineSummary'
      });
    }

    if (!livingSummary || livingSummary.length < 100) {
      suggestions.push({
        id: 'summary-start',
        type: 'epi',
        title: 'Start Your Summary',
        description: 'Epi can help you create an initial Living Summary structure',
        action: 'Get Started',
        handler: 'startSummary'
      });
    }
  }

  // Active session context
  if (location === 'session' && hasActiveSession) {
    if (messages.length > 15) {
      suggestions.push({
        id: 'session-synthesize',
        type: 'epi',
        title: 'Ready to Synthesize?',
        description: 'This session is getting long. Consider ending it to update your Living Summary',
        action: 'End & Synthesize',
        handler: 'endSession'
      });
    }

    if (messages.length > 5 && references.length === 0) {
      suggestions.push({
        id: 'session-add-refs',
        type: 'epi',
        title: 'Add Context',
        description: 'Attach references to give the AI more background information',
        action: 'Add References',
        handler: 'openReferences'
      });
    }

    if (messages.length > 0) {
      suggestions.push({
        id: 'session-export',
        type: 'epi',
        title: 'Export This Session',
        description: 'Copy this conversation to continue in another AI (Grok, ChatGPT, Claude)',
        action: 'Copy Thread',
        handler: 'copySessionThread'
      });
    }
  }

  // Import/Export context
  if (location === 'import') {
    suggestions.push({
      id: 'import-paste',
      type: 'epi',
      title: 'Paste & Condense',
      description: 'After importing, Epi can condense the chat into key insights',
      action: 'Learn How',
      handler: 'showImportGuide'
    });
  }

  // Guardian context
  if (location === 'guardian') {
    if (livingSummary && livingSummary.length > 1000) {
      suggestions.push({
        id: 'guardian-check',
        type: 'epi',
        title: 'Run Guardian Check',
        description: 'Scan your Living Summary for contradictions and stale actions',
        action: 'Check Now',
        handler: 'runGuardian'
      });
    }
  }

  // Empty vault context
  if (!hasActiveSession && messages.length === 0 && !livingSummary) {
    suggestions.push({
      id: 'vault-start',
      type: 'epi',
      title: 'Getting Started',
      description: 'Start a chat, import an existing conversation, or upload reference files',
      action: 'See Options',
      handler: 'showWelcomeGuide'
    });
  }

  return suggestions;
};

/**
 * Get priority suggestion (most relevant)
 */
export const getPrioritySuggestion = (suggestions) => {
  if (!suggestions || suggestions.length === 0) return null;
  
  // Priority order: session actions > summary actions > reference actions
  const priority = ['session-synthesize', 'summary-condense', 'ref-context-pack'];
  
  for (const id of priority) {
    const found = suggestions.find(s => s.id === id);
    if (found) return found;
  }
  
  return suggestions[0];
};