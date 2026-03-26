import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Simple AES-GCM encryption helpers using Web Crypto (available in Deno)
const SALT = new TextEncoder().encode('epiphany-ai-v1-salt');

async function deriveKey(secret) {
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  const combined = new Uint8Array(iv.byteLength + enc.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(enc), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64, secret) {
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const key = await deriveKey(secret);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(dec);
}

// ─── LLM call helpers ────────────────────────────────────────────────────────

async function callGrok(prompt, key) {
  const resp = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'grok-2-latest', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
  });
  if (!resp.ok) throw new Error(`Grok error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callOpenAI(prompt, key) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt, key) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!resp.ok) throw new Error(`Anthropic error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.content?.[0]?.text || '';
}

async function callCustom(prompt, key, url, model) {
  const resp = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
  });
  if (!resp.ok) throw new Error(`Custom API error ${resp.status}: ${await resp.text()}`);
  const d = await resp.json();
  return d.choices?.[0]?.message?.content || '';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, provider, prompt } = body;

    // Encryption secret = user ID (unique per user, server-side only)
    const secret = user.id;

    // ── SAVE KEY action ───────────────────────────────────────────────────────
    if (action === 'save_key') {
      const { key, extra } = body; // extra = { url, model } for custom
      if (!key) return Response.json({ error: 'No key provided' }, { status: 400 });

      const encryptedKey = await encrypt(key, secret);
      const encryptedExtra = extra ? await encrypt(JSON.stringify(extra), secret) : null;

      // Load or create AppSettings for this user
      const existing = await base44.entities.AppSettings.filter({ created_by: user.email });
      const settings = existing[0];

      const keyField = `encrypted_key_${provider}`;
      const extraField = `encrypted_extra_${provider}`;
      const patch = { [keyField]: encryptedKey };
      if (encryptedExtra) patch[extraField] = encryptedExtra;

      if (settings) {
        await base44.entities.AppSettings.update(settings.id, patch);
      } else {
        await base44.entities.AppSettings.create(patch);
      }

      return Response.json({ ok: true });
    }

    // ── CHECK KEYS action ─────────────────────────────────────────────────────
    if (action === 'check_keys') {
      const existing = await base44.entities.AppSettings.filter({ created_by: user.email });
      const settings = existing[0] || {};
      const providers = ['grok', 'openai', 'anthropic', 'custom'];
      const hasKey = {};
      for (const p of providers) {
        hasKey[p] = !!settings[`encrypted_key_${p}`];
      }
      return Response.json({ hasKey, activeProvider: settings.active_provider || 'base44' });
    }

    // ── SET ACTIVE PROVIDER action ────────────────────────────────────────────
    if (action === 'set_active_provider') {
      const existing = await base44.entities.AppSettings.filter({ created_by: user.email });
      const settings = existing[0];
      if (settings) {
        await base44.entities.AppSettings.update(settings.id, { active_provider: provider });
      } else {
        await base44.entities.AppSettings.create({ active_provider: provider });
      }
      return Response.json({ ok: true });
    }

    // ── INVOKE action ─────────────────────────────────────────────────────────
    if (action === 'invoke') {
      if (!prompt) return Response.json({ error: 'No prompt' }, { status: 400 });
      if (!provider || provider === 'base44') {
        // Use built-in Base44 LLM
        const result = await base44.integrations.Core.InvokeLLM({ prompt });
        const text = typeof result === 'string' ? result : (result.text || result.output || String(result));
        return Response.json({ output: text });
      }

      // Retrieve encrypted key for this user
      const existing = await base44.entities.AppSettings.filter({ created_by: user.email });
      const settings = existing[0];
      if (!settings) return Response.json({ error: 'No API key configured for this provider' }, { status: 400 });

      const encKey = settings[`encrypted_key_${provider}`];
      if (!encKey) return Response.json({ error: `No key configured for provider: ${provider}` }, { status: 400 });

      const key = await decrypt(encKey, secret);
      let output = '';

      if (provider === 'grok')      output = await callGrok(prompt, key);
      else if (provider === 'openai')    output = await callOpenAI(prompt, key);
      else if (provider === 'anthropic') output = await callAnthropic(prompt, key);
      else if (provider === 'custom') {
        const encExtra = settings[`encrypted_extra_custom`];
        const extra = encExtra ? JSON.parse(await decrypt(encExtra, secret)) : {};
        output = await callCustom(prompt, key, extra.url, extra.model);
      }

      return Response.json({ output });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});