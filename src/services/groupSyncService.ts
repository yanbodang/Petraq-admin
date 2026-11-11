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

export interface GroupDevice {
  id: string;
  name: string;
  serial: string;
  subject_type: 'member' | 'pet';
  subject_id: string;
  removed_at: string | null;
}

interface DeviceHistoryQuery {
  from: string;
  to: string;
  before?: string;
  userId?: string;
  deviceId?: string;
  category?: 'operations' | 'errors';
}

export interface DeviceHistoryPage<T> {
  items: T[];
  nextBefore: string | null;
}

export interface DevicePacket {
  id: number | string;
  packet_key: string;
  recorded_at: string;
  received_at: string;
  payload_hex: string;
  parse_status: 'parsed' | 'unparsed' | 'legacy_unprocessed';
  packet_type: string | null;
  parsed_data: Record<string, unknown> | null;
  parse_error: string | null;
  projected_metrics?: Array<{
    metric_type: string;
    value: number;
    unit: string;
    recorded_at: string;
  }>;
}

export interface DeviceDiagnostic {
  id: number | string;
  user_id: string;
  user_name: string | null;
  device_id: string | null;
  device_name: string | null;
  occurred_at: string;
  received_at: string;
  event: string;
  status: string;
  code: string | null;
  count: number | null;
}

export interface WellbeingMetric {
  unit: string;
  value: number | null;
  points: Array<{ time: string; value: number | null; count: number }>;
}

export interface GroupWellbeing {
  updatedAt: string | null;
  metrics: Record<string, WellbeingMetric | undefined>;
}

function apiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_PETRAQ_ADMIN_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error('PetraQ Backend 尚未配置');
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

async function readGroupData<T>(
  groupId: string,
  path: string,
  token: string,
  signal?: AbortSignal,
  query?: URLSearchParams,
): Promise<T> {
  const suffix = query ? `?${query.toString()}` : '';
  const response = await fetch(apiUrl(`api/groups/${encodeURIComponent(groupId)}/${path}${suffix}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });
  const payload = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error || `HTTP ${response.status}`);
  return payload;
}

function historyQuery({ from, to, before, userId, deviceId, category }: DeviceHistoryQuery) {
  const query = new URLSearchParams({ from, to, limit: '50' });
  if (before) query.set('before', before);
  if (userId) query.set('userId', userId);
  if (deviceId) query.set('deviceId', deviceId);
  if (category) query.set('category', category);
  return query;
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

  async listGroups(token: string, signal?: AbortSignal) {
    const response = await fetch(apiUrl('api/groups'), { headers: { Authorization: `Bearer ${token}` }, signal });
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

  async getGroupSnapshot(groupId: string, token: string, signal?: AbortSignal): Promise<GroupSnapshot> {
    const response = await fetch(apiUrl(`api/mobile/snapshot?groupId=${encodeURIComponent(groupId)}`), { headers: { Authorization: `Bearer ${token}` }, signal });
    const payload = await response.json() as GroupSnapshot & { error?: string };
    if (!response.ok) throw new Error(payload.error || '读取 Group 详情失败');
    return { members: payload.members ?? [], pets: payload.pets ?? [] };
  },

  getGroupDevices(groupId: string, token: string, signal?: AbortSignal) {
    return readGroupData<{ devices: GroupDevice[]; canManage: boolean }>(
      groupId, 'devices', token, signal, new URLSearchParams({ includeRemoved: 'true' }),
    );
  },

  getWellbeing(groupId: string, token: string, query: URLSearchParams, signal?: AbortSignal) {
    return readGroupData<GroupWellbeing>(groupId, 'wellbeing', token, signal, query);
  },

  listDevicePackets(groupId: string, deviceId: string, token: string, query: DeviceHistoryQuery, signal?: AbortSignal) {
    return readGroupData<DeviceHistoryPage<DevicePacket>>(
      groupId, `devices/${encodeURIComponent(deviceId)}/packets`, token, signal, historyQuery(query),
    );
  },

  listDeviceDiagnostics(groupId: string, token: string, query: DeviceHistoryQuery, signal?: AbortSignal) {
    return readGroupData<DeviceHistoryPage<DeviceDiagnostic>>(
      groupId, 'device-diagnostics', token, signal, historyQuery(query),
    );
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
