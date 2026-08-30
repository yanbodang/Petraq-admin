export interface TestDataSyncResult {
  runId: string;
  recordsRead: number;
  recordsWritten: number;
  recordsUnmapped: number;
  syncedAt: string;
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
};
