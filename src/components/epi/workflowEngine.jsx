import { base44 } from '@/api/base44Client';

// ─── Provider registry ──────────────────────────────────────────────────────

export const PROVIDERS = {
  base44:    { name: 'Base44 (built-in)', color: 'text-violet-400' },
  grok:      { name: 'Grok (xAI)',        color: 'text-emerald-400' },
  openai:    { name: 'OpenAI',            color: 'text-green-400' },
  anthropic: { name: 'Anthropic',         color: 'text-amber-400' },
  custom:    { name: 'Custom OpenAI-compatible', color: 'text-blue-400' },
};

// ─── API key storage ────────────────────────────────────────────────────────

export const getApiKeys = () => ({
  grok:        localStorage.getItem('grok_api_key') || '',
  openai:      localStorage.getItem('openai_api_key') || '',
  anthropic:   localStorage.getItem('anthropic_api_key') || '',
  custom_url:  localStorage.getItem('custom_api_url') || '',
  custom_key:  localStorage.getItem('custom_api_key') || '',
  custom_model:localStorage.getItem('custom_api_model') || 'gpt-4o',
});

export const saveProviderKey = (provider, key, extra = {}) => {
  if (provider === 'grok')      localStorage.setItem('grok_api_key', key);
  if (provider === 'openai')    localStorage.setItem('openai_api_key', key);
  if (provider === 'anthropic') localStorage.setItem('anthropic_api_key', key);
  if (provider === 'custom') {
    localStorage.setItem('custom_api_key', key);
    if (extra.url)   localStorage.setItem('custom_api_url', extra.url);
    if (extra.model) localStorage.setItem('custom_api_model', extra.model);
  }
};

export const getActiveProvider = () =>
  localStorage.getItem('active_provider') || 'grok';

export const setActiveProvider = (p) =>
  localStorage.setItem('active_provider', p);

export const hasKeyForProvider = (provider) => {
  if (provider === 'base44') return true;
  const keys = getApiKeys();
  if (provider === 'grok')      return !!keys.grok;
  if (provider === 'openai')    return !!keys.openai;
  if (provider === 'anthropic') return !!keys.anthropic;
  if (provider === 'custom')    return !!keys.custom_key && !!keys.custom_url;
  return false;
};

// ─── LLM call helpers ───────────────────────────────────────────────────────

async function callGrok(prompt, key) {
  const resp = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!resp.ok) throw new Error(`Grok error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callOpenAI(prompt, key) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt, key) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.content?.[0]?.text || '';
}

async function callCustom(prompt, keys) {
  const resp = await fetch(`${keys.custom_url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${keys.custom_key}` },
    body: JSON.stringify({
      model: keys.custom_model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!resp.ok) throw new Error(`Custom API error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callBase44(prompt) {
  const result = await base44.integrations.Core.InvokeLLM({ prompt });
  return typeof result === 'string' ? result : result.text || result.output || String(result);
}

export async function callLLMProvider(provider, prompt) {
  const keys = getApiKeys();
  switch (provider) {
    case 'grok':
      if (!keys.grok) throw new Error('No Grok API key configured');
      return callGrok(prompt, keys.grok);
    case 'openai':
      if (!keys.openai) throw new Error('No OpenAI API key configured');
      return callOpenAI(prompt, keys.openai);
    case 'anthropic':
      if (!keys.anthropic) throw new Error('No Anthropic API key configured');
      return callAnthropic(prompt, keys.anthropic);
    case 'custom':
      if (!keys.custom_key || !keys.custom_url) throw new Error('Custom API not configured');
      return callCustom(prompt, keys);
    default:
      return callBase44(prompt);
  }
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
    return true; // on parse error, run the step
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
        return await callBase44(
          `You are Epi, the context concierge for Epiphany.AI.\n\nVault: ${ctx.vaultName}\nSummary:\n${ctx.vaultSummary}\n\n${prompt}`
        );
      }
      if (step.agent_type === 'moltbook') {
        const agent = moltbookAgents.find(
          (a) => a.id === step.agent_id || a.agent_name === step.agent_id
        );
        const agentPrompt = agent
          ? `You are ${agent.agent_name}. ${agent.description || ''}\n\n${prompt}`
          : prompt;
        return await callBase44(agentPrompt);
      }
      // llm
      return await callLLMProvider(step.provider || 'base44', prompt);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

// ─── Full workflow runner ────────────────────────────────────────────────────

/**
 * Run a workflow. onStepUpdate(results[]) called after every step change.
 * Returns { status, results, finalOutput }
 */
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