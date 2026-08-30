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

const now = dayjs();

export const platformUsers: PlatformUser[] = [
  {
    id: 'user-yanbo',
    name: 'Yanbo Wang',
    email: 'yanbo@petraq.mock',
    phone: '+61 400 000 001',
    familyIds: ['family-wang'],
    status: 'active',
    lastSeenAt: now.subtract(4, 'minute').toISOString(),
  },
  {
    id: 'user-anna',
    name: 'Anna Wang',
    email: 'anna@petraq.mock',
    phone: '+61 400 000 002',
    familyIds: ['family-wang'],
    status: 'active',
    lastSeenAt: now.subtract(18, 'minute').toISOString(),
  },
  {
    id: 'user-dad',
    name: 'Dad Wang',
    email: 'dad@petraq.mock',
    phone: '+61 400 000 003',
    familyIds: ['family-wang'],
    status: 'invited',
    lastSeenAt: now.subtract(3, 'day').toISOString(),
  },
  {
    id: 'user-will',
    name: 'Will',
    email: 'will@petraq.mock',
    phone: '+61 400 000 004',
    familyIds: ['family-wang'],
    status: 'active',
    lastSeenAt: now.subtract(3, 'minute').toISOString(),
  },
  { id: 'user-mum', name: 'May Wang', email: 'may@petraq.mock', phone: '+61 400 000 005', familyIds: ['family-wang'], status: 'active', lastSeenAt: now.subtract(8, 'minute').toISOString() },
  { id: 'user-grandpa', name: 'Grandpa Wang', email: 'grandpa@petraq.mock', phone: '+61 400 000 006', familyIds: ['family-wang'], status: 'active', lastSeenAt: now.subtract(1, 'hour').toISOString() },
  { id: 'user-grandma', name: 'Grandma Wang', email: 'grandma@petraq.mock', phone: '+61 400 000 007', familyIds: ['family-wang'], status: 'active', lastSeenAt: now.subtract(2, 'hour').toISOString() },
  {
    id: 'user-chen',
    name: 'Mia Chen',
    email: 'mia.chen@petraq.mock',
    phone: '+1 415 000 0190',
    familyIds: ['family-chen'],
    status: 'active',
    lastSeenAt: now.subtract(26, 'minute').toISOString(),
  },
  {
    id: 'user-li',
    name: 'Eric Li',
    email: 'eric.li@petraq.mock',
    phone: '+1 415 000 0191',
    familyIds: ['family-li'],
    status: 'active',
    lastSeenAt: now.subtract(2, 'hour').toISOString(),
  },
];

export const families: Family[] = [
  {
    id: 'family-wang',
    name: 'Wang Family',
    ownerUserId: 'user-yanbo',
    plan: 'family_plus',
    region: 'Australia',
    createdAt: now.subtract(42, 'day').toISOString(),
    memberCount: 7,
    petCount: 3,
    deviceCount: 3,
    openAlerts: 1,
  },
  {
    id: 'family-chen',
    name: 'Chen Family',
    ownerUserId: 'user-chen',
    plan: 'mvp',
    region: 'United States',
    createdAt: now.subtract(18, 'day').toISOString(),
    memberCount: 2,
    petCount: 2,
    deviceCount: 2,
    openAlerts: 0,
  },
  {
    id: 'family-li',
    name: 'Li Family',
    ownerUserId: 'user-li',
    plan: 'mvp',
    region: 'United States',
    createdAt: now.subtract(7, 'day').toISOString(),
    memberCount: 1,
    petCount: 1,
    deviceCount: 1,
    openAlerts: 2,
  },
];

export const familyMembers: FamilyMember[] = [
  { id: 'member-yanbo', familyId: 'family-wang', userId: 'user-yanbo', role: 'owner', relationship: 'Self', joinedAt: now.subtract(42, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-anna', familyId: 'family-wang', userId: 'user-anna', role: 'admin', relationship: 'Partner', joinedAt: now.subtract(39, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-dad', familyId: 'family-wang', userId: 'user-dad', role: 'member', relationship: 'Father', joinedAt: now.subtract(2, 'day').toISOString(), invitationState: 'pending' },
  { id: 'member-will', familyId: 'family-wang', userId: 'user-will', role: 'member', relationship: 'Friend', joinedAt: now.subtract(5, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-mum', familyId: 'family-wang', userId: 'user-mum', role: 'member', relationship: 'Mother', joinedAt: now.subtract(36, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-grandpa', familyId: 'family-wang', userId: 'user-grandpa', role: 'viewer', relationship: 'Grandfather', joinedAt: now.subtract(20, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-grandma', familyId: 'family-wang', userId: 'user-grandma', role: 'viewer', relationship: 'Grandmother', joinedAt: now.subtract(20, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-chen', familyId: 'family-chen', userId: 'user-chen', role: 'owner', relationship: 'Self', joinedAt: now.subtract(18, 'day').toISOString(), invitationState: 'accepted' },
  { id: 'member-li', familyId: 'family-li', userId: 'user-li', role: 'owner', relationship: 'Self', joinedAt: now.subtract(7, 'day').toISOString(), invitationState: 'accepted' },
];

export const pets: Pet[] = [
  { id: 'pet-milo', familyId: 'family-wang', ownerMemberId: 'member-yanbo', name: 'Milo', species: 'dog', breed: 'Golden mix', weightKg: 22.4, healthScore: 86, heartRate: 104, activity: 'rest', lastComputedAt: now.subtract(1, 'minute').toISOString(), sharedWithFamily: true },
  { id: 'pet-luna', familyId: 'family-wang', ownerMemberId: 'member-anna', name: 'Luna', species: 'dog', breed: 'Shiba mix', weightKg: 10.8, healthScore: 74, heartRate: 132, activity: 'walk', lastComputedAt: now.subtract(15, 'minute').toISOString(), sharedWithFamily: true },
  { id: 'pet-coco', familyId: 'family-wang', ownerMemberId: 'member-dad', name: 'Coco', species: 'cat', breed: 'Domestic shorthair', weightKg: 5.7, healthScore: null, heartRate: null, activity: 'unknown', lastComputedAt: now.subtract(12, 'hour').toISOString(), sharedWithFamily: true },
  { id: 'pet-nori', familyId: 'family-chen', ownerMemberId: 'member-chen', name: 'Nori', species: 'cat', breed: 'Ragdoll', weightKg: 4.9, healthScore: 91, heartRate: 118, activity: 'sleep', lastComputedAt: now.subtract(8, 'minute').toISOString(), sharedWithFamily: true },
  { id: 'pet-rio', familyId: 'family-li', ownerMemberId: 'member-li', name: 'Rio', species: 'dog', breed: 'Border collie', weightKg: 18.2, healthScore: 69, heartRate: 146, activity: 'run', lastComputedAt: now.subtract(25, 'minute').toISOString(), sharedWithFamily: false },
];

export const devices: Device[] = [
  { id: 'device-001', familyId: 'family-wang', petId: 'pet-milo', serial: 'PQ-COLLAR-001', firmware: '2.0.1', state: 'online', battery: 72, connectedBy: 'Yanbo iPhone', lastConnectedAt: now.subtract(2, 'minute').toISOString(), lastSyncedAt: now.subtract(1, 'minute').toISOString(), uploadedPackets24h: 1084 },
  { id: 'device-018', familyId: 'family-wang', petId: 'pet-luna', serial: 'PQ-COLLAR-018', firmware: '2.0.0', state: 'recent', battery: 51, connectedBy: 'Anna Pixel', lastConnectedAt: now.subtract(18, 'minute').toISOString(), lastSyncedAt: now.subtract(15, 'minute').toISOString(), uploadedPackets24h: 822 },
  { id: 'device-044', familyId: 'family-wang', petId: 'pet-coco', serial: 'PQ-COLLAR-044', firmware: '1.9.7', state: 'offline', battery: 18, connectedBy: 'Dad Android', lastConnectedAt: now.subtract(11, 'hour').toISOString(), lastSyncedAt: now.subtract(12, 'hour').toISOString(), uploadedPackets24h: 0 },
  { id: 'device-057', familyId: 'family-chen', petId: 'pet-nori', serial: 'PQ-COLLAR-057', firmware: '2.0.1', state: 'online', battery: 84, connectedBy: 'Mia iPhone', lastConnectedAt: now.subtract(4, 'minute').toISOString(), lastSyncedAt: now.subtract(3, 'minute').toISOString(), uploadedPackets24h: 964 },
  { id: 'device-071', familyId: 'family-li', petId: 'pet-rio', serial: 'PQ-COLLAR-071', firmware: '2.0.1', state: 'online', battery: 66, connectedBy: 'Eric Android', lastConnectedAt: now.subtract(9, 'minute').toISOString(), lastSyncedAt: now.subtract(9, 'minute').toISOString(), uploadedPackets24h: 1208 },
];

export const petMedicalRecords: PetMedicalRecord[] = [
  { id: 'medical-record-001', familyId: 'family-wang', petId: 'pet-milo', type: 'vaccination', title: 'Annual vaccination', clinic: 'Northside Vet', veterinarian: 'Dr. Harper', occurredAt: now.subtract(8, 'day').toISOString(), nextDueAt: now.add(357, 'day').toISOString(), summary: 'Core vaccine completed. No adverse reaction reported.', attachmentCount: 2, visibility: 'family' },
  { id: 'medical-record-002', familyId: 'family-wang', petId: 'pet-milo', type: 'checkup', title: 'Wellness check', clinic: 'Northside Vet', veterinarian: 'Dr. Harper', occurredAt: now.subtract(21, 'day').toISOString(), summary: 'Weight stable. Heart and respiratory checks normal.', attachmentCount: 1, visibility: 'family' },
  { id: 'medical-record-003', familyId: 'family-wang', petId: 'pet-luna', type: 'medication', title: 'Skin allergy medication', clinic: 'PetCare City', veterinarian: 'Dr. Lin', occurredAt: now.subtract(4, 'day').toISOString(), nextDueAt: now.add(10, 'day').toISOString(), summary: 'Two-week medication course. Review if scratching continues.', attachmentCount: 1, visibility: 'owner_only' },
  { id: 'medical-record-004', familyId: 'family-wang', petId: 'pet-coco', type: 'lab_result', title: 'Blood test', clinic: 'Northside Vet', veterinarian: 'Dr. Harper', occurredAt: now.subtract(38, 'day').toISOString(), summary: 'Baseline lab result uploaded for future comparison.', attachmentCount: 3, visibility: 'family' },
  { id: 'medical-record-005', familyId: 'family-chen', petId: 'pet-nori', type: 'checkup', title: 'Dental check', clinic: 'Bay Vet', veterinarian: 'Dr. Fisher', occurredAt: now.subtract(12, 'day').toISOString(), nextDueAt: now.add(80, 'day').toISOString(), summary: 'Mild tartar noted. Monitor appetite and chewing.', attachmentCount: 1, visibility: 'family' },
  { id: 'medical-record-006', familyId: 'family-li', petId: 'pet-rio', type: 'diagnosis', title: 'Exercise heart rate review', clinic: 'City Animal Hospital', veterinarian: 'Dr. Patel', occurredAt: now.subtract(2, 'day').toISOString(), nextDueAt: now.add(14, 'day').toISOString(), summary: 'Review requested after active heart rate exceeded baseline.', attachmentCount: 2, visibility: 'family' },
];

export const petMedicalReports: PetMedicalReport[] = [
  { id: 'medical-report-001', familyId: 'family-wang', petId: 'pet-milo', title: 'June wellness report', periodStart: now.subtract(30, 'day').toISOString(), periodEnd: now.toISOString(), generatedAt: now.subtract(6, 'hour').toISOString(), status: 'ready', riskLevel: 'normal', source: 'backend_algorithm', summary: 'Activity and resting heart rate stayed within expected range.' },
  { id: 'medical-report-002', familyId: 'family-wang', petId: 'pet-luna', title: 'Medication follow-up report', periodStart: now.subtract(14, 'day').toISOString(), periodEnd: now.toISOString(), generatedAt: now.subtract(2, 'hour').toISOString(), status: 'needs_review', riskLevel: 'watch', source: 'backend_algorithm', summary: 'Elevated activity heart rate should be reviewed with symptoms.' },
  { id: 'medical-report-003', familyId: 'family-wang', petId: 'pet-coco', title: 'Offline data recovery report', periodStart: now.subtract(7, 'day').toISOString(), periodEnd: now.toISOString(), generatedAt: now.subtract(40, 'minute').toISOString(), status: 'processing', riskLevel: 'watch', source: 'backend_algorithm', summary: 'Waiting for collar sync before backend can complete analysis.' },
  { id: 'medical-report-004', familyId: 'family-chen', petId: 'pet-nori', title: 'Dental care report', periodStart: now.subtract(30, 'day').toISOString(), periodEnd: now.toISOString(), generatedAt: now.subtract(1, 'day').toISOString(), status: 'ready', riskLevel: 'normal', source: 'vet_upload', summary: 'Vet uploaded dental check summary and care advice.' },
  { id: 'medical-report-005', familyId: 'family-li', petId: 'pet-rio', title: 'Active heart rate review', periodStart: now.subtract(7, 'day').toISOString(), periodEnd: now.toISOString(), generatedAt: now.subtract(25, 'minute').toISOString(), status: 'needs_review', riskLevel: 'urgent', source: 'backend_algorithm', summary: 'Backend flagged sustained elevated heart rate during exercise.' },
];

export const consentRecords: ConsentRecord[] = [
  { id: 'consent-001', familyId: 'family-wang', subjectUserId: 'user-yanbo', grantedToUserId: 'user-anna', scope: 'human_health', state: 'granted', language: 'en-US', version: '2026.08', updatedAt: now.subtract(2, 'day').toISOString() },
  { id: 'consent-002', familyId: 'family-wang', subjectUserId: 'user-anna', grantedToUserId: 'user-yanbo', scope: 'human_health', state: 'granted', language: 'en-US', version: '2026.08', updatedAt: now.subtract(3, 'day').toISOString() },
  { id: 'consent-003', familyId: 'family-wang', subjectUserId: 'user-dad', grantedToUserId: 'user-yanbo', scope: 'human_health', state: 'not_granted', language: 'zh-CN', version: '2026.08', updatedAt: now.subtract(1, 'day').toISOString() },
  { id: 'consent-004', familyId: 'family-wang', subjectUserId: 'user-dad', grantedToUserId: 'user-anna', scope: 'pet_health', state: 'limited', language: 'zh-CN', version: '2026.08', updatedAt: now.subtract(12, 'hour').toISOString() },
];

export const humanHealthRecords: HumanHealthRecord[] = [
  { id: 'health-yanbo', familyId: 'family-wang', memberId: 'member-yanbo', heartRate: 78, restingHeartRate: 62, sleepMinutes: 436, temperatureCelsius: 36.5, updatedAt: now.subtract(6, 'minute').toISOString(), sharedWithFamily: true },
  { id: 'health-anna', familyId: 'family-wang', memberId: 'member-anna', heartRate: 81, restingHeartRate: 64, sleepMinutes: 418, temperatureCelsius: 36.6, updatedAt: now.subtract(18, 'minute').toISOString(), sharedWithFamily: true },
  // Phase-one adapter: temporary member-health data is represented as Will only.
  { id: 'health-will', familyId: 'family-wang', memberId: 'member-will', heartRate: 84, restingHeartRate: 66, sleepMinutes: 402, temperatureCelsius: 36.7, updatedAt: now.subtract(3, 'minute').toISOString(), sharedWithFamily: true },
  { id: 'health-dad', familyId: 'family-wang', memberId: 'member-dad', heartRate: null, restingHeartRate: null, sleepMinutes: null, temperatureCelsius: null, updatedAt: now.subtract(1, 'day').toISOString(), sharedWithFamily: false },
];

export const familyInvitations: FamilyInvitation[] = [
  { id: 'invite-001', familyId: 'family-wang', invitedByUserId: 'user-yanbo', token: 'PQ-WANG-7D2K', createdAt: now.subtract(2, 'hour').toISOString(), expiresAt: now.add(7, 'day').toISOString(), status: 'pending' },
  { id: 'invite-002', familyId: 'family-wang', invitedByUserId: 'user-yanbo', token: 'PQ-WANG-4M8Q', createdAt: now.subtract(8, 'day').toISOString(), expiresAt: now.subtract(1, 'day').toISOString(), status: 'expired' },
];

export const alerts: PlatformAlert[] = [
  { id: 'alert-001', familyId: 'family-wang', petId: 'pet-coco', deviceId: 'device-044', severity: 'warning', message: 'Coco device offline for 12h', createdAt: now.subtract(9, 'hour').toISOString(), status: 'open' },
  { id: 'alert-002', familyId: 'family-li', petId: 'pet-rio', deviceId: 'device-071', severity: 'critical', message: 'Rio active heart rate above baseline', createdAt: now.subtract(24, 'minute').toISOString(), status: 'open' },
  { id: 'alert-003', familyId: 'family-li', petId: 'pet-rio', severity: 'warning', message: 'Algorithm confidence below threshold', createdAt: now.subtract(32, 'minute').toISOString(), status: 'open' },
];

export const auditLogs: AuditLog[] = [
  { id: 'audit-001', actor: 'PetraQ Super Admin', scope: 'super_admin', action: 'Viewed device fleet', target: 'All devices', createdAt: now.subtract(8, 'minute').toISOString() },
  { id: 'audit-002', actor: 'Yanbo Wang', scope: 'family_admin', action: 'Updated sharing permission', target: 'Dad health data', createdAt: now.subtract(2, 'hour').toISOString() },
  { id: 'audit-003', actor: 'PetraQ Super Admin', scope: 'super_admin', action: 'Acknowledged alert', target: 'PQ-COLLAR-071', createdAt: now.subtract(4, 'hour').toISOString() },
];

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
