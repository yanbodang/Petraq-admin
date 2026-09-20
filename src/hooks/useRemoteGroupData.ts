import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Family } from '../services/petraqAdminData';
import {
  GroupHealthData,
  GroupSnapshot,
  groupSyncService,
} from '../services/groupSyncService';

export function useRemoteGroupData({ includeHealth = false } = {}) {
  const { currentUser, session } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [snapshot, setSnapshot] = useState<GroupSnapshot | null>(null);
  const [health, setHealth] = useState<GroupHealthData>({ pets: [], people: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!session?.token) {
      setLoading(false);
      setError('登录会话已失效，请重新登录。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextFamilies = await groupSyncService.listGroups(session.token);
      const groupId = currentUser?.familyId ?? nextFamilies[0]?.id;
      setFamilies(nextFamilies);
      if (!groupId) {
        setSnapshot(null);
        setHealth({ pets: [], people: [] });
        return;
      }
      const [nextSnapshot, nextHealth] = await Promise.all([
        groupSyncService.getGroupSnapshot(groupId, session.token),
        includeHealth
          ? groupSyncService.getGroupHealth(groupId, session.token, 500)
          : Promise.resolve({ pets: [], people: [] }),
      ]);
      setSnapshot(nextSnapshot);
      setHealth(nextHealth);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '读取家庭数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.familyId, includeHealth, session?.token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { families, snapshot, health, loading, error, reload };
}
