import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export type AdminScope = 'super_admin' | 'family_admin';
export type FamilyMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type DeviceState = 'online' | 'recent' | 'offline';
export type ConsentState = 'granted' | 'limited' | 'not_granted' | 'pending';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type PetMedicalRecordType = 'vaccination' | 'checkup' | 'diagnosis' | 'medication' | 'procedure' | 'lab_result';
export type PetMedicalReportStatus = 'ready' | 'processing' | 'needs_review';
export type PetMedicalRiskLevel = 'normal' | 'watch' | 'urgent';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  familyIds: string[];
  status: 'active' | 'invited' | 'disabled';
  lastSeenAt: string;
}

export interface Family {
  id: string;
  name: string;
  ownerUserId: string;
  plan: 'mvp' | 'family_plus' | 'clinical';
  region: string;
  createdAt: string;
  memberCount: number;
  petCount: number;
  deviceCount: number;
  openAlerts: number;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyMemberRole;
  joinedAt: string;
  invitationState: 'accepted' | 'pending';
  relationship: string;
}

export interface Pet {
  id: string;
  familyId: string;
  ownerMemberId: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  weightKg: number;
  healthScore: number | null;
  heartRate: number | null;
  activity: 'sleep' | 'rest' | 'walk' | 'run' | 'unknown';
  lastComputedAt: string;
  sharedWithFamily: boolean;
}

export interface Device {
  id: string;
  familyId: string;
  petId: string;
  serial: string;
  firmware: string;
  state: DeviceState;
  battery: number;
  connectedBy: string;
  lastConnectedAt: string;
  lastSyncedAt: string;
  uploadedPackets24h: number;
}

export interface PetMedicalRecord {
  id: string;
  familyId: string;
  petId: string;
  type: PetMedicalRecordType;
  title: string;
  clinic: string;
  veterinarian: string;
  occurredAt: string;
  nextDueAt?: string;
  summary: string;
  attachmentCount: number;
  visibility: 'family' | 'owner_only';
}

export interface PetMedicalReport {
  id: string;
  familyId: string;
  petId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  status: PetMedicalReportStatus;
  riskLevel: PetMedicalRiskLevel;
  source: 'backend_algorithm' | 'vet_upload';
  summary: string;
}

export interface ConsentRecord {
  id: string;
  familyId: string;
  subjectUserId: string;
  grantedToUserId: string;
  scope: 'human_health' | 'pet_health';
  state: ConsentState;
  language: 'zh-CN' | 'en-US';
  version: string;
  updatedAt: string;
}

export interface HumanHealthRecord {
  id: string;
  familyId: string;
  memberId: string;
  heartRate: number | null;
  restingHeartRate: number | null;
  sleepMinutes: number | null;
  temperatureCelsius: number | null;
  updatedAt: string;
  sharedWithFamily: boolean;
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  invitedByUserId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  acceptedByUserId?: string;
}

export interface PlatformAlert {
  id: string;
  familyId: string;
  petId?: string;
  deviceId?: string;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface AuditLog {
  id: string;
  actor: string;
  scope: AdminScope;
  action: string;
  target: string;
  createdAt: string;
}

export const platformUsers: PlatformUser[] = [];
export const families: Family[] = [];
export const familyMembers: FamilyMember[] = [];
export const pets: Pet[] = [];
export const devices: Device[] = [];
export const petMedicalRecords: PetMedicalRecord[] = [];
export const petMedicalReports: PetMedicalReport[] = [];
export const consentRecords: ConsentRecord[] = [];
export const humanHealthRecords: HumanHealthRecord[] = [];
export const familyInvitations: FamilyInvitation[] = [];
export const alerts: PlatformAlert[] = [];
export const auditLogs: AuditLog[] = [];

export function getFamilyIdsForRole(role: AdminScope, familyId?: string) {
  if (role === 'super_admin') {
    return families.map((family) => family.id);
  }
  return familyId ? [familyId] : [];
}

export function getScopedData(role: AdminScope, familyId?: string) {
  const familyIds = new Set(getFamilyIdsForRole(role, familyId));
  const scopedFamilies = families.filter((family) => familyIds.has(family.id));
  return {
    families: scopedFamilies,
    users: platformUsers.filter((user) => user.familyIds.some((id) => familyIds.has(id))),
    members: familyMembers.filter((member) => familyIds.has(member.familyId)),
    pets: pets.filter((pet) => familyIds.has(pet.familyId)),
    devices: devices.filter((device) => familyIds.has(device.familyId)),
    medicalRecords: petMedicalRecords.filter((record) => familyIds.has(record.familyId)),
    medicalReports: petMedicalReports.filter((report) => familyIds.has(report.familyId)),
    consents: consentRecords.filter((consent) => familyIds.has(consent.familyId)),
    humanHealth: humanHealthRecords.filter((record) => familyIds.has(record.familyId)),
    invitations: familyInvitations.filter((invitation) => familyIds.has(invitation.familyId)),
    alerts: alerts.filter((alert) => familyIds.has(alert.familyId)),
    audits: auditLogs.filter((log) => role === 'super_admin' || log.scope === 'family_admin'),
  };
}

export function formatRelative(value: string) {
  return dayjs(value).fromNow();
}

export function userName(userId: string) {
  return platformUsers.find((user) => user.id === userId)?.name ?? userId;
}

export function familyName(familyId: string) {
  return families.find((family) => family.id === familyId)?.name ?? familyId;
}

export function petName(petId?: string) {
  if (!petId) return '-';
  return pets.find((pet) => pet.id === petId)?.name ?? petId;
}
