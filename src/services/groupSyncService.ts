export interface TestDataSyncResult {
  runId: string;
  recordsRead: number;
  recordsWritten: number;
  recordsUnmapped: number;
  syncedAt: string;
}

export interface GroupHealthRecord {
  id: string;
  name: string;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  pet_id?: string;
  user_id?: string;
}

export interface GroupHealthData {
  pets: GroupHealthRecord[];
  people: GroupHealthRecord[];
}

export interface GroupSnapshot {
  members: Array<{ id: string; user_id: string; name: string; role: string; relationship: string; share_human_health: boolean; share_pet_health: boolean }>;
  pets: Array<{ id: string; owner_user_id: string; name: string; species: string; shared_with_group: boolean }>;
}

function apiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_PETRAQ_ADMIN_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error('PetraQ Backend 尚未配置');
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export const groupSyncService = {
  isEnabled: import.meta.env.MODE === 'development' || import.meta.env.VITE_ENABLE_QA_TEST_SYNC === 'true',

  async syncTestData(groupId: string, token: string): Promise<TestDataSyncResult> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/test-data-sync`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({})) as TestDataSyncResult & { error?: string };
    if (!response.ok) throw new Error(payload.error || '同步测试数据失败');
    return payload;
  },

  async listGroups(token: string) {
    const response = await fetch(apiUrl('api/groups'), { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json() as { items?: import('./petraqAdminData').Family[]; error?: string };
    if (!response.ok) throw new Error(payload.error || '读取 Group 失败');
    return payload.items ?? [];
  },

  async getGroupHealth(groupId: string, token: string): Promise<GroupHealthData> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/health`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as GroupHealthData & { error?: string };
    if (!response.ok) throw new Error(payload.error || '读取健康数据失败');
    return { pets: payload.pets ?? [], people: payload.people ?? [] };
  },

  async getGroupSnapshot(groupId: string, token: string): Promise<GroupSnapshot> {
    const response = await fetch(apiUrl(`api/mobile/snapshot?groupId=${encodeURIComponent(groupId)}`), { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json() as GroupSnapshot & { error?: string };
    if (!response.ok) throw new Error(payload.error || '读取 Group 详情失败');
    return { members: payload.members ?? [], pets: payload.pets ?? [] };
  },

  async removeMember(groupId: string, memberId: string, token: string) {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error || '移除成员失败');
  },
};
