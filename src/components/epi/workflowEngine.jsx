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

// ─── Safe condition evaluator (no new Function / eval) ──────────────────────
//
// Supports a constrained expression grammar:
//   Comparisons: contains, notContains, startsWith, endsWith, equals, notEquals
//   Checks:      isEmpty, isNotEmpty
//   Logical:     AND, OR, NOT
//   Variables:   previousOutput, vaultSummary, userInput (strings)
//
// Examples:
//   "previousOutput contains 'error'"
//   "NOT (userInput isEmpty) AND previousOutput contains 'success'"

function resolveVar(name, ctx) {
  if (name === 'previousOutput') return String(ctx.previousOutput || '');
  if (name === 'vaultSummary')   return String(ctx.vaultSummary || '');
  if (name === 'userInput')      return String(ctx.userInput || '');
  return '';
}

function evalAtom(expr, ctx) {
  expr = expr.trim();

  // Quoted string literal value (not a variable) → treat as truthy if non-empty
  // Variable isEmpty / isNotEmpty
  const isEmptyMatch = expr.match(/^(\w+)\s+isEmpty$/i);
  if (isEmptyMatch) return resolveVar(isEmptyMatch[1], ctx).trim() === '';

  const isNotEmptyMatch = expr.match(/^(\w+)\s+isNotEmpty$/i);
  if (isNotEmptyMatch) return resolveVar(isNotEmptyMatch[1], ctx).trim() !== '';

  // variable OP 'value'
  const opMatch = expr.match(/^(\w+)\s+(contains|notContains|startsWith|endsWith|equals|notEquals)\s+'([^']*)'$/i);
  if (opMatch) {
    const [, varName, op, value] = opMatch;
    const v = resolveVar(varName, ctx).toLowerCase();
    const val = value.toLowerCase();
    switch (op.toLowerCase()) {
      case 'contains':    return v.includes(val);
      case 'notcontains': return !v.includes(val);
      case 'startswith':  return v.startsWith(val);
      case 'endswith':    return v.endsWith(val);
      case 'equals':      return v === val;
      case 'notequals':   return v !== val;
    }
  }

  // boolean literals
  if (expr.toLowerCase() === 'true')  return true;
  if (expr.toLowerCase() === 'false') return false;

  // Unknown / unsupported → default to true (safe fallback: run the step)
  return true;
}

function evalExpr(expr, ctx) {
  expr = expr.trim();

  // Strip outer parens
  if (expr.startsWith('(') && expr.endsWith(')')) {
    return evalExpr(expr.slice(1, -1), ctx);
  }

  // NOT
  if (/^NOT\s+/i.test(expr)) {
    return !evalExpr(expr.replace(/^NOT\s+/i, ''), ctx);
  }

  // Split on top-level AND / OR (left to right, lowest precedence)
  let depth = 0;
  for (let i = expr.length - 1; i >= 0; i--) {
    if (expr[i] === ')') depth++;
    if (expr[i] === '(') depth--;
    if (depth === 0) {
      if (expr.slice(i).match(/^AND\b/i) && i > 0) {
        return evalExpr(expr.slice(0, i).trim(), ctx) && evalExpr(expr.slice(i + 3).trim(), ctx);
      }
      if (expr.slice(i).match(/^OR\b/i) && i > 0) {
        return evalExpr(expr.slice(0, i).trim(), ctx) || evalExpr(expr.slice(i + 2).trim(), ctx);
      }
    }
  }

  return evalAtom(expr, ctx);
}

export const evaluateCondition = (condition, ctx) => {
  if (!condition || !condition.trim()) return true;
  try {
    return evalExpr(condition, ctx);
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