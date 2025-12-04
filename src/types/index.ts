// 用户角色
export enum UserRole {
  ADMIN = '管理员',
  USER = '普通用户',
  VIEWER = '查看者',
}

// 用户状态
export enum UserStatus {
  ACTIVE = '活跃',
  INACTIVE = '禁用',
  PENDING = '待激活',
}

// 数据同步状态
export enum SyncStatus {
  SUCCESS = '成功',
  FAILED = '失败',
  PENDING = '进行中',
  CANCELLED = '已取消',
}

// 同步类型
export enum SyncType {
  FULL = '全量同步',
  INCREMENTAL = '增量同步',
  MANUAL = '手动同步',
}

// 用户模型
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt?: Date;
  animalCount?: number; // 用户下的动物数量
  organizationId?: string; // 所属组织/租户
}

// 组织/租户模型
export interface Organization {
  id: string;
  name: string;
  description?: string;
  userCount: number;
  animalCount: number;
  createdAt: Date;
  status: 'active' | 'inactive';
}

// 动物模型（属于用户）
export interface Animal {
  id: string;
  userId: string; // 所属用户ID
  name: string;
  type: string;
  gender: string;
  weight: number;
  age: number;
  createdAt: Date;
  lastSyncAt?: Date;
}

// 数据同步记录
export interface SyncRecord {
  id: string;
  userId: string;
  syncType: SyncType;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  recordCount?: number;
  errorMessage?: string;
  syncDirection: 'upload' | 'download'; // 上传或下载
}

// 系统统计
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAnimals: number;
  totalOrganizations: number;
  todaySyncCount: number;
  failedSyncCount: number;
}

// 用户权限
export interface UserPermission {
  userId: string;
  canManageUsers: boolean;
  canViewAllData: boolean;
  canSyncData: boolean;
  canManageSettings: boolean;
}

// 健康数据类型
export enum HealthDataType {
  HEART_RATE = '心率',
  TEMPERATURE = '体温',
  ACTIVITY = '活动量',
  SLEEP = '睡眠质量',
  STRESS = '压力状态',
}

// 健康数据点
export interface HealthDataPoint {
  id: string;
  animalId: string;
  type: HealthDataType;
  value: number;
  timestamp: Date;
  unit: string;
}

// 健康评分
export interface HealthScore {
  id: string;
  animalId: string;
  overallScore: number; // 0-100
  heartRateScore: number;
  temperatureScore: number;
  activityScore: number;
  sleepScore: number;
  stressScore: number;
  timestamp: Date;
}

// 健康预警
export interface HealthAlert {
  id: string;
  animalId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

// 动物健康状态汇总
export interface AnimalHealthStatus {
  animalId: string;
  animalName: string;
  latestHealthScore: number;
  latestHeartRate?: number;
  latestTemperature?: number;
  latestActivity?: number;
  alertCount: number;
  lastUpdateTime: Date;
}
