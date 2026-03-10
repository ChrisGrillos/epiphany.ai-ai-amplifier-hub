import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { userScopedEntities } from '@/components/lib/userScoped';

export default function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setCurrentUser(u)).catch(() => {});
  }, []);

  const db = currentUser ? userScopedEntities(currentUser) : null;

  return { currentUser, db };
}
