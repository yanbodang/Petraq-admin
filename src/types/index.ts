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

// 用户分组类型
export enum UserGroupType {
  PET = '宠物',
  LIVESTOCK = '畜牧',
  CLINIC = '诊所',
  INSURANCE = '保险公司',
}

// 付费状态
export enum PaymentStatus {
  PAID = '已付费',
  UNPAID = '未付费',
  OVERDUE = '欠费',
  FREE = '免费',
}

// 付费类型
export enum PaymentType {
  MONTHLY = '月费',
  YEARLY = '年费',
  ONE_TIME = '一次性',
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
  // 新增字段
  fullName?: string; // 姓名
  address?: string; // 地址
  occupation?: string; // 职业
  birthday?: Date; // 生日
  gender?: '男' | '女' | '其他'; // 性别
  groupType?: UserGroupType; // 用户分组类型
  paymentStatus?: PaymentStatus; // 付费状态
  hasOverdue?: boolean; // 是否有欠费
  deviceCount?: number; // 关联硬件数
  paidDeviceCount?: number; // 已付费硬件数
  unpaidDeviceCount?: number; // 未付费硬件数
  promotionInfo?: string; // 用户推销相关信息
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

// 设备模型
export interface Device {
  id: string;
  code: string; // 设备代码
  userId?: string; // 所属用户ID（可选，未激活时可能为空）
  animalId?: string; // 关联的动物ID
  isActivated: boolean; // 是否激活
  isPaid: boolean; // 是否付费
  paymentType?: PaymentType; // 付费类型
  batteryLevel?: number; // 电量百分比 0-100
  isBluetoothConnected?: boolean; // 是否蓝牙连接
  lastSyncAt?: Date; // 最后同步时间
  createdAt: Date; // 创建时间
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
  birthday?: Date; // 生日
  createdAt: Date;
  lastSyncAt?: Date;
  deviceId?: string; // 关联的设备ID
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
  HRV = 'HRV', // 心率变异性
  MOOD = '情绪', // 情绪状态
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
  latestHRV?: number; // HRV值
  latestMood?: string; // 情绪状态
  alertCount: number;
  lastUpdateTime: Date;
}

// 医疗记录类型
export enum MedicalRecordType {
  VACCINATION = '疫苗',
  PHYSICAL_EXAM = '体检',
  BLOOD_TEST = '血液检查',
  DIAGNOSIS = '诊断报告',
  TREATMENT = '治疗记录',
  OTHER = '其他',
}

// 医疗记录
export interface MedicalRecord {
  id: string;
  animalId: string;
  type: MedicalRecordType;
  title: string;
  description?: string;
  date: Date;
  veterinarian?: string; // 兽医姓名
  clinic?: string; // 诊所名称
  attachments?: string[]; // 附件URL列表
  createdAt: Date;
}

// 报告类型
export enum ReportType {
  MONTHLY_FREE = '每月免费报告',
  ON_DEMAND_PAID = '按需付费报告',
}

// 报告
export interface Report {
  id: string;
  userId: string;
  animalId?: string; // 如果为空，则为用户所有动物的报告
  type: ReportType;
  title: string;
  content: string;
  generatedAt: Date;
  period?: { start: Date; end: Date }; // 报告时间范围
  isPaid?: boolean; // 是否已付费
  downloadUrl?: string; // 下载链接
}

// AI文案类型
export enum AITipType {
  HEALTH_TIP = '健康提示',
  CARE_TIP = '护理建议',
  ALERT_TIP = '预警提示',
  GENERAL = '通用提示',
}

// AI推送规则
export interface AIPushRule {
  id: string;
  name: string;
  tipType: AITipType;
  conditions: {
    healthScoreRange?: [number, number]; // 健康评分范围
    animalType?: string[]; // 适用的动物类型
    alertSeverity?: ('low' | 'medium' | 'high' | 'critical')[]; // 预警严重程度
  };
  tipContent: string; // 提示内容
  isActive: boolean;
  priority: number; // 优先级
  createdAt: Date;
}

// AI文案库
export interface AITip {
  id: string;
  type: AITipType;
  content: string;
  tags?: string[]; // 标签
  isActive: boolean;
  usageCount: number; // 使用次数
  createdAt: Date;
}
