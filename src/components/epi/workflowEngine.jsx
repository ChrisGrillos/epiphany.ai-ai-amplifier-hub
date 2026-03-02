import { base44 } from '@/api/base44Client';

// ─── Provider registry ──────────────────────────────────────────────────────

export const PROVIDERS = {
  base44:    { name: 'Base44 (built-in)', color: 'text-violet-400' },
  grok:      { name: 'Grok (xAI)',        color: 'text-emerald-400' },
  openai:    { name: 'OpenAI',            color: 'text-green-400' },
  anthropic: { name: 'Anthropic',         color: 'text-amber-400' },
  custom:    { name: 'Custom OpenAI-compatible', color: 'text-blue-400' },
};

// ─── Server-side key management (no localStorage) ───────────────────────────

// Cache of key status so we don't hammer the backend on every check
let _keyStatusCache = null;
let _keyStatusFetched = false;

export async function fetchKeyStatus() {
  const resp = await base44.functions.invoke('llmProxy', { action: 'check_keys' });
  _keyStatusCache = resp.data;
  _keyStatusFetched = true;
  return resp.data;
}

export async function saveProviderKey(provider, key, extra = {}) {
  await base44.functions.invoke('llmProxy', {
    action: 'save_key',
    provider,
    key,
    extra: Object.keys(extra).length ? extra : undefined,
  });
  // Invalidate cache
  _keyStatusCache = null;
  _keyStatusFetched = false;
}

export async function getActiveProvider() {
  if (!_keyStatusFetched) await fetchKeyStatus();
  return _keyStatusCache?.activeProvider || 'base44';
}

export async function setActiveProvider(provider) {
  await base44.functions.invoke('llmProxy', { action: 'set_active_provider', provider });
  if (_keyStatusCache) _keyStatusCache.activeProvider = provider;
}

export async function hasKeyForProvider(provider) {
  if (provider === 'base44') return true;
  if (!_keyStatusFetched) await fetchKeyStatus();
  return !!_keyStatusCache?.hasKey?.[provider];
}

// ─── Kept for backward compat — returns empty (keys no longer in browser) ────
export const getApiKeys = () => ({
  grok: '', openai: '', anthropic: '', custom_url: '', custom_key: '', custom_model: '',
});

// ─── LLM call via backend proxy ──────────────────────────────────────────────

export async function callLLMProvider(provider, prompt) {
  const resp = await base44.functions.invoke('llmProxy', { action: 'invoke', provider, prompt });
  if (resp.data?.error) throw new Error(resp.data.error);
  return resp.data?.output || '';
}

// ─── Template resolution ────────────────────────────────────────────────────

export const resolvePrompt = (template, ctx) =>
  (template || '')
    .replace(/\{\{vault_summary\}\}/g, ctx.vaultSummary || '')
    .replace(/\{\{previous_output\}\}/g, ctx.previousOutput || '')
    .replace(/\{\{context\}\}/g, ctx.contextPack || '')
    .replace(/\{\{user_input\}\}/g, ctx.userInput || '')
    .replace(/\{\{vault_name\}\}/g, ctx.vaultName || '');

// ─── Condition evaluation ───────────────────────────────────────────────────

export const evaluateCondition = (condition, ctx) => {
  if (!condition || !condition.trim()) return true;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('previousOutput', 'vaultSummary', 'userInput', `return (${condition})`);
    return !!fn(ctx.previousOutput || '', ctx.vaultSummary || '', ctx.userInput || '');
  } catch {
    return true;
  }
};

// ─── Single step execution ───────────────────────────────────────────────────

export async function executeStep(step, ctx, moltbookAgents = []) {
  const prompt = resolvePrompt(step.prompt, ctx);
  const maxRetries = step.on_error === 'retry' ? 2 : 0;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (step.agent_type === 'epi') {
        return await callLLMProvider('base44',
          `You are Epi, the context concierge for Epiphany.AI.\n\nVault: ${ctx.vaultName}\nSummary:\n${ctx.vaultSummary}\n\n${prompt}`
        );
      }
      if (step.agent_type === 'moltbook') {
        const agent = moltbookAgents.find((a) => a.id === step.agent_id || a.agent_name === step.agent_id);
        const agentPrompt = agent ? `You are ${agent.agent_name}. ${agent.description || ''}\n\n${prompt}` : prompt;
        return await callLLMProvider('base44', agentPrompt);
      }
      return await callLLMProvider(step.provider || 'base44', prompt);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

// ─── Full workflow runner ────────────────────────────────────────────────────

export async function runWorkflow(workflow, ctx, moltbookAgents = [], onStepUpdate) {
  const results = workflow.steps.map((s) => ({
    step_id: s.step_id,
    name: s.name,
    status: 'pending',
    output: '',
    error: null,
  }));

  onStepUpdate?.([...results]);

  let previousOutput = ctx.userInput || '';

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    results[i].status = 'running';
    onStepUpdate?.([...results]);

    const shouldRun = evaluateCondition(step.condition, { ...ctx, previousOutput });
    if (!shouldRun) {
      results[i].status = 'skipped';
      onStepUpdate?.([...results]);
      continue;
    }

    try {
      const output = await executeStep(step, { ...ctx, previousOutput }, moltbookAgents);
      results[i].status = 'success';
      results[i].output = output;
      previousOutput = output;
    } catch (err) {
      results[i].error = err.message;
      if (step.on_error === 'stop') {
        results[i].status = 'failed';
        onStepUpdate?.([...results]);
        return { status: 'failed', results, finalOutput: previousOutput };
      }
      results[i].status = step.on_error === 'skip' ? 'skipped' : 'failed';
    }

    onStepUpdate?.([...results]);
  }

  const failed = results.some((r) => r.status === 'failed');
  const allOk  = results.every((r) => r.status === 'success' || r.status === 'skipped');
  return {
    status: allOk ? 'success' : failed ? 'partial' : 'success',
    results,
    finalOutput: previousOutput,
  };
}