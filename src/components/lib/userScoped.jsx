/**
 * userScoped — thin wrappers around base44 entity methods that
 * automatically inject `created_by: user.email` into every filter,
 * ensuring no query ever fetches another user's data from the frontend.
 *
 * Usage:
 *   import { userScopedEntities } from '@/components/lib/userScoped';
 *   const db = userScopedEntities(user);
 *   const vaults = await db.Vault.list();
 *   const sessions = await db.Session.filter({ vault_id: id });
 */
import { base44 } from '@/api/base44Client';

function scopedEntity(entityName, userEmail) {
  const entity = base44.entities[entityName];

  return {
    // list with mandatory user filter
    list: (sort, limit) =>
      entity.filter({ created_by: userEmail }, sort, limit),

    // additional filters merged with user filter
    filter: (extra = {}, sort, limit) =>
      entity.filter({ ...extra, created_by: userEmail }, sort, limit),

    // single record — server-side guard enforces ownership
    get: (id) => entity.get(id),

    // create — created_by is auto-set by platform to current user
    create: (data) => entity.create(data),

    update: (id, data) => entity.update(id, data),

    delete: (id) => entity.delete(id),

    schema: () => entity.schema(),
  };
}

export function userScopedEntities(user) {
  if (!user?.email) throw new Error('userScopedEntities requires an authenticated user');

  const names = [
    'Vault', 'Session', 'Reference', 'EpiLog', 'BridgeConversation',
    'Workflow', 'MoltbookAgent', 'TutorialProgress', 'ScheduledPost',
    'AppSettings', 'VaultMember', 'VaultComment',
  ];

  const db = {};
  for (const name of names) {
    db[name] = scopedEntity(name, user.email);
  }
  return db;
}