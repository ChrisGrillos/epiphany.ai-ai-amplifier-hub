/**
 * entityGuard — server-side ownership enforcement for sensitive entities.
 *
 * The Base44 SDK's built-in security rules already scope reads by created_by
 * for regular users. This function adds an explicit hard check for any
 * cross-user read attempt and is used as an audit / enforcement layer
 * for entities that carry credentials or private context.
 *
 * Actions: read, list
 * Protected entities: AppSettings, Vault, Session, BridgeConversation,
 *                     Reference, EpiLog, VaultMember, VaultComment, Workflow
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PROTECTED_ENTITIES = new Set([
  'AppSettings', 'Vault', 'Session', 'BridgeConversation',
  'Reference', 'EpiLog', 'VaultMember', 'VaultComment', 'Workflow',
  'ScheduledPost', 'MoltbookAgent', 'TutorialProgress',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, entity, id, filter: filterArg } = body;

    if (!PROTECTED_ENTITIES.has(entity)) {
      return Response.json({ error: 'Entity not in guard scope' }, { status: 400 });
    }

    // ── LIST with mandatory user filter ──────────────────────────────────────
    if (action === 'list') {
      const userFilter = { created_by: user.email, ...(filterArg || {}) };
      const records = await base44.asServiceRole.entities[entity].filter(userFilter);
      return Response.json({ records });
    }

    // ── READ single record with ownership check ───────────────────────────────
    if (action === 'read') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });

      const records = await base44.asServiceRole.entities[entity].filter({ id });
      const record = records[0];
      if (!record) return Response.json({ error: 'Not found' }, { status: 404 });

      // Hard ownership check — VaultMember uses user_email instead of created_by
      const ownerField = entity === 'VaultMember' ? 'user_email' : 'created_by';
      if (record[ownerField] !== user.email) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      return Response.json({ record });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});