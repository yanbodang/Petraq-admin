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
  group?: { id: string; name: string };
  members: Array<{ id: string; user_id: string; name: string; role: string; relationship: string; share_human_health: boolean; share_pet_health: boolean; joined_at: string }>;
  pets: Array<{ id: string; owner_user_id: string; name: string; species: string; shared_with_group: boolean }>;
  petHealth?: Array<{ pet_id: string; metric_type: string; value: number; unit: string; recorded_at: string }>;
  peopleHealth?: Array<{ user_id: string; metric_type: string; value: number; unit: string; recorded_at: string }>;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by_user_id: string;
  invited_by_name: string;
  token: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

export interface SyncRun {
  id: string;
  source_type: string;
  status: string;
  records_read: number;
  records_written: number;
  records_unmapped: number;
  error_message?: string | null;
  started_at: string;
  finished_at?: string | null;
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

  async getGroupHealth(groupId: string, token: string, limit = 5000): Promise<GroupHealthData> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/health?limit=${limit}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as GroupHealthData & { error?: string };
    if (!response.ok) throw new Error(payload.error || '读取健康数据失败');
    return { pets: payload.pets ?? [], people: payload.people ?? [] };
  },

  async listSyncRuns(groupId: string, token: string): Promise<SyncRun[]> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/sync-runs`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as { items?: SyncRun[]; error?: string };
    if (!response.ok) throw new Error(payload.error || '读取同步记录失败');
    return payload.items ?? [];
  },

  async getGroupSnapshot(groupId: string, token: string): Promise<GroupSnapshot> {
    const response = await fetch(apiUrl(`api/mobile/snapshot?groupId=${encodeURIComponent(groupId)}`), { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json() as GroupSnapshot & { error?: string };
    if (!response.ok) throw new Error(payload.error || '读取 Group 详情失败');
    return { members: payload.members ?? [], pets: payload.pets ?? [] };
  },

  async listInvitations(groupId: string, token: string): Promise<GroupInvitation[]> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/invitations`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as { items?: GroupInvitation[]; error?: string };
    if (!response.ok) throw new Error(payload.error || '读取邀请失败');
    return payload.items ?? [];
  },

  async createInvitation(groupId: string, token: string): Promise<GroupInvitation> {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/invitations`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as GroupInvitation & { error?: string };
    if (!response.ok) throw new Error(payload.error || '创建邀请失败');
    return payload;
  },

  async revokeInvitation(groupId: string, invitationId: string, token: string) {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/invitations/${encodeURIComponent(invitationId)}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error || '撤销邀请失败');
  },

  async removeMember(groupId: string, memberId: string, token: string) {
    const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error || '移除成员失败');
  },
};
