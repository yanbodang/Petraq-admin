import { HumanHealthRecord } from './petraqAdminData';

type TemporaryMemberHealthResponse = {
  members?: Array<{
    heartRate?: number | null;
    restingHeartRate?: number | null;
    sleepMinutes?: number | null;
    bodyTemperatureCelsius?: number | null;
    updatedAt?: string;
  }>;
};

export async function loadWillHealth(signal?: AbortSignal): Promise<HumanHealthRecord | null> {
  const baseUrl = import.meta.env.VITE_PETRAQ_HEALTH_API_BASE_URL?.trim();
  if (!baseUrl) return null;

  const endpoint = new URL('/api/mobile/member-health', baseUrl);
  endpoint.searchParams.set('familyId', 'family-wang');
  endpoint.searchParams.set('memberId', 'member-will');
  endpoint.searchParams.set('name', 'Will');
  const apiKey = import.meta.env.VITE_PETRAQ_MEMBER_HEALTH_API_KEY?.trim();
  const response = await fetch(endpoint, {
    signal,
    headers: apiKey ? { 'X-Mobile-Api-Key': apiKey } : undefined,
  });
  if (!response.ok) throw new Error('Health information could not be refreshed.');

  const payload = await response.json() as TemporaryMemberHealthResponse;
  const record = payload.members?.[0];
  if (!record) return null;
  return {
    id: 'health-will',
    familyId: 'family-wang',
    memberId: 'member-will',
    heartRate: record.heartRate ?? null,
    restingHeartRate: record.restingHeartRate ?? null,
    sleepMinutes: record.sleepMinutes ?? null,
    temperatureCelsius: record.bodyTemperatureCelsius ?? null,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
    sharedWithFamily: true,
  };
}
