import {
  User,
  UserStatus,
  Organization,
  Animal,
  SyncRecord,
  SyncType,
  SyncStatus,
  SystemStats,
  HealthDataPoint,
  HealthDataType,
  HealthScore,
  HealthAlert,
  AnimalHealthStatus,
  Device,
  MedicalRecord,
  Report,
  ReportType,
  AITip,
  AITipType,
  AIPushRule,
  PaymentStatus,
  PaymentType,
  SubscriptionPlan,
  SubscriptionStatus,
  AnimalSubscription,
  Invoice,
  DataRequest,
} from '../types';

class DataManager {
  private users: User[] = [];
  private organizations: Organization[] = [];
  private animals: Animal[] = [];
  private syncRecords: SyncRecord[] = [];
  private healthData: HealthDataPoint[] = [];
  private healthScores: HealthScore[] = [];
  private healthAlerts: HealthAlert[] = [];
  private devices: Device[] = [];
  private medicalRecords: MedicalRecord[] = [];
  private reports: Report[] = [];
  private aiTips: AITip[] = [];
  private aiPushRules: AIPushRule[] = [];
  private subscriptions: AnimalSubscription[] = [];
  private invoices: Invoice[] = [];
  private dataRequests: DataRequest[] = [];

  constructor() {}

  // 用户管理
  getUsers(): User[] {
    return this.users;
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  addUser(user: User): void {
    this.users.push(user);
    this.refreshDerivedState();
  }

  updateUser(user: User): void {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
      this.refreshDerivedState();
    }
  }

  removeUser(id: string): void {
    this.users = this.users.filter((u) => u.id !== id);
    const removedAnimalIds = new Set(this.animals.filter((animal) => animal.userId === id).map((animal) => animal.id));
    this.animals = this.animals.filter((animal) => animal.userId !== id);
    this.devices = this.devices.filter((device) => device.userId !== id && !removedAnimalIds.has(device.animalId || ''));
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.userId !== id && !removedAnimalIds.has(subscription.animalId)
    );
    this.refreshDerivedState();
  }

  // 组织管理
  getOrganizations(): Organization[] {
    return this.organizations;
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.find((o) => o.id === id);
  }

  addOrganization(org: Organization): void {
    this.organizations.push(org);
  }

  updateOrganization(org: Organization): void {
    const index = this.organizations.findIndex((o) => o.id === org.id);
    if (index !== -1) {
      this.organizations[index] = org;
    }
  }

  removeOrganization(id: string): void {
    this.organizations = this.organizations.filter((o) => o.id !== id);
    // 删除组织时，将用户移出组织
    this.users.forEach((user) => {
      if (user.organizationId === id) {
        user.organizationId = undefined;
      }
    });
  }

  // 动物管理（按用户）
  getAnimalsByUser(userId: string): Animal[] {
    return this.animals.filter((a) => a.userId === userId);
  }

  // 动物管理（按组织）
  getAnimalsByOrganization(organizationId: string): Animal[] {
    // 获取组织下的所有用户
    const orgUsers = this.users.filter((u) => u.organizationId === organizationId);
    const userIds = orgUsers.map((u) => u.id);
    // 获取这些用户下的所有动物
    return this.animals.filter((a) => userIds.includes(a.userId));
  }

  // 获取组织下的用户
  getUsersByOrganization(organizationId: string): User[] {
    return this.users.filter((u) => u.organizationId === organizationId);
  }

  getAllAnimals(): Animal[] {
    return this.animals;
  }

  getAnimal(id: string): Animal | undefined {
    return this.animals.find((a) => a.id === id);
  }

  addAnimal(animal: Animal): void {
    if (animal.deviceId) {
      this.animals = this.animals.map((item) =>
        item.deviceId === animal.deviceId
          ? {
              ...item,
              deviceId: undefined,
              subscriptionId: undefined,
            }
          : item
      );
      this.subscriptions = this.subscriptions.filter((subscription) => subscription.deviceId !== animal.deviceId);
    }
    this.animals.push(animal);
    if (animal.deviceId) {
      const device = this.devices.find((item) => item.id === animal.deviceId);
      if (device) {
        device.animalId = animal.id;
        device.userId = animal.userId;
        this.ensureSubscriptionForDevice(device);
      }
    }
    this.refreshDerivedState();
  }

  updateAnimal(animal: Animal): void {
    const index = this.animals.findIndex((a) => a.id === animal.id);
    if (index !== -1) {
      if (animal.deviceId) {
        this.animals = this.animals.map((item) =>
          item.id !== animal.id && item.deviceId === animal.deviceId
            ? {
                ...item,
                deviceId: undefined,
                subscriptionId: undefined,
              }
            : item
        );
        this.subscriptions = this.subscriptions.filter(
          (subscription) => subscription.animalId === animal.id || subscription.deviceId !== animal.deviceId
        );
      }
      this.animals[index] = animal;
      if (animal.deviceId) {
        const device = this.devices.find((item) => item.id === animal.deviceId);
        if (device) {
          device.animalId = animal.id;
          device.userId = animal.userId;
          this.ensureSubscriptionForDevice(device);
        }
      }
      this.refreshDerivedState();
    }
  }

  removeAnimal(id: string): void {
    this.animals = this.animals.filter((animal) => animal.id !== id);
    this.devices = this.devices.map((device) =>
      device.animalId === id
        ? {
            ...device,
            animalId: undefined,
            userId: undefined,
            subscriptionId: undefined,
            isPaid: false,
            paymentType: undefined,
          }
        : device
    );
    this.subscriptions = this.subscriptions.filter((subscription) => subscription.animalId !== id);
    this.refreshDerivedState();
  }

  // 更新组织的动物数量统计
  private updateOrganizationAnimalCount(organizationId: string): void {
    const orgAnimals = this.getAnimalsByOrganization(organizationId);
    const org = this.organizations.find((o) => o.id === organizationId);
    if (org) {
      org.animalCount = orgAnimals.length;
    }
  }

  private getPaymentTypeForPlan(plan: SubscriptionPlan): PaymentType | undefined {
    switch (plan) {
      case SubscriptionPlan.MONTHLY:
        return PaymentType.MONTHLY;
      case SubscriptionPlan.YEARLY:
        return PaymentType.YEARLY;
      default:
        return undefined;
    }
  }

  private refreshDerivedState(): void {
    this.animals = this.animals.map((animal) => ({
      ...animal,
      subscriptionId: undefined,
    }));

    this.devices = this.devices.map((device) => ({
      ...device,
      subscriptionId: undefined,
      isPaid: false,
      paymentType: undefined,
    }));

    const refreshedAnimalMap = new Map(this.animals.map((animal) => [animal.id, animal]));
    const refreshedDeviceMap = new Map(this.devices.map((device) => [device.id, device]));

    this.animals.forEach((animal) => {
      if (!animal.deviceId) {
        return;
      }

      const device = refreshedDeviceMap.get(animal.deviceId);
      if (device) {
        device.animalId = animal.id;
        device.userId = animal.userId;
      }
    });

    this.subscriptions = this.subscriptions.filter((subscription) => {
      const animal = refreshedAnimalMap.get(subscription.animalId);
      const device = refreshedDeviceMap.get(subscription.deviceId);

      if (!animal || !device) {
        return false;
      }

      subscription.userId = animal.userId;
      animal.subscriptionId = subscription.id;
      animal.deviceId = device.id;
      device.userId = animal.userId;
      device.animalId = animal.id;
      device.subscriptionId = subscription.id;
      device.isActivated = true;
      device.isPaid = subscription.status === SubscriptionStatus.ACTIVE;
      device.paymentType = this.getPaymentTypeForPlan(subscription.plan);
      return true;
    });

    this.devices.forEach((device) => {
      if (!device.subscriptionId && !device.isActivated) {
        device.paymentType = undefined;
      }

      const animal = device.animalId ? refreshedAnimalMap.get(device.animalId) : undefined;
      if (animal) {
        device.userId = animal.userId;
        animal.deviceId = device.id;
      }
    });

    this.users = this.users.map((user) => {
      const userAnimals = this.animals.filter((animal) => animal.userId === user.id);
      const userDevices = this.devices.filter((device) => device.userId === user.id);
      const userSubscriptions = this.subscriptions.filter((subscription) => subscription.userId === user.id);
      const activeSubscriptions = userSubscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE);
      const trialSubscriptions = userSubscriptions.filter((subscription) => subscription.status === SubscriptionStatus.TRIALING);
      const expiredSubscriptions = userSubscriptions.filter((subscription) => subscription.status === SubscriptionStatus.EXPIRED);

      const nextPaymentStatus =
        activeSubscriptions.length > 0
          ? PaymentStatus.PAID
          : expiredSubscriptions.length > 0
            ? PaymentStatus.OVERDUE
            : trialSubscriptions.length > 0
              ? PaymentStatus.FREE
              : userDevices.length > 0
                ? PaymentStatus.UNPAID
                : (user.paymentStatus || PaymentStatus.FREE);

      return {
        ...user,
        animalCount: userAnimals.length,
        deviceCount: userDevices.length,
        paidDeviceCount: activeSubscriptions.length,
        trialDeviceCount: trialSubscriptions.length,
        unpaidDeviceCount: Math.max(userDevices.length - activeSubscriptions.length - trialSubscriptions.length, 0),
        subscriptionCount: activeSubscriptions.length + trialSubscriptions.length,
        hasOverdue: expiredSubscriptions.length > 0,
        paymentStatus: nextPaymentStatus,
      };
    });

    this.organizations.forEach((org) => {
      this.updateOrganizationAnimalCount(org.id);
      org.userCount = this.getUsersByOrganization(org.id).length;
    });
  }

  private ensureSubscriptionForDevice(device: Device): void {
    if (!device.isActivated || !device.animalId) {
      return;
    }

    const animal = this.animals.find((item) => item.id === device.animalId);
    if (!animal) {
      return;
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const existing = this.subscriptions.find(
      (subscription) => subscription.deviceId === device.id || subscription.animalId === animal.id
    );

    if (existing) {
      existing.userId = animal.userId;
      existing.animalId = animal.id;
      existing.deviceId = device.id;
      if (existing.status === SubscriptionStatus.PENDING) {
        existing.plan = SubscriptionPlan.TRIAL;
        existing.status = SubscriptionStatus.TRIALING;
        existing.activatedAt = now;
        existing.currentPeriodStart = now;
        existing.currentPeriodEnd = trialEndsAt;
        existing.trialEndsAt = trialEndsAt;
      }
      return;
    }

    this.subscriptions.push({
      id: `subscription-${Date.now()}-${device.id}`,
      userId: animal.userId,
      animalId: animal.id,
      deviceId: device.id,
      plan: SubscriptionPlan.TRIAL,
      status: SubscriptionStatus.TRIALING,
      createdAt: now,
      activatedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      trialEndsAt,
    });
  }

  // 数据同步管理
  getSyncRecords(userId?: string): SyncRecord[] {
    if (userId) {
      return this.syncRecords.filter((r) => r.userId === userId);
    }
    return this.syncRecords;
  }

  getSyncRecord(id: string): SyncRecord | undefined {
    return this.syncRecords.find((r) => r.id === id);
  }

  addSyncRecord(record: SyncRecord): void {
    this.syncRecords.push(record);
  }

  updateSyncRecord(record: SyncRecord): void {
    const index = this.syncRecords.findIndex((r) => r.id === record.id);
    if (index !== -1) {
      this.syncRecords[index] = record;
    }
  }

  // 触发数据同步
  triggerSync(userId: string, syncType: SyncType, direction: 'upload' | 'download'): SyncRecord {
    const record: SyncRecord = {
      id: `sync-${Date.now()}`,
      userId,
      syncType,
      status: SyncStatus.PENDING,
      startTime: new Date(),
      syncDirection: direction,
    };

    this.syncRecords.push(record);

    // 模拟同步过程
    setTimeout(() => {
      const index = this.syncRecords.findIndex((r) => r.id === record.id);
      if (index !== -1) {
        // 90%成功率
        const success = Math.random() > 0.1;
        this.syncRecords[index] = {
          ...this.syncRecords[index],
          status: success ? SyncStatus.SUCCESS : SyncStatus.FAILED,
          endTime: new Date(),
          recordCount: success ? Math.floor(Math.random() * 100) + 10 : 0,
          errorMessage: success ? undefined : '同步失败：网络连接超时',
        };
      }
    }, 2000);

    return record;
  }

  // 系统统计
  getSystemStats(): SystemStats {
    const activeUsers = this.users.filter((u) => u.status === UserStatus.ACTIVE).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySyncs = this.syncRecords.filter(
      (r) => r.startTime >= today && r.status === SyncStatus.SUCCESS
    ).length;
    const failedSyncs = this.syncRecords.filter((r) => r.status === SyncStatus.FAILED).length;
    const activeSubscriptions = this.subscriptions.filter(
      (subscription) => subscription.status === SubscriptionStatus.ACTIVE
    ).length;
    const trialSubscriptions = this.subscriptions.filter(
      (subscription) => subscription.status === SubscriptionStatus.TRIALING
    ).length;
    const snapshotOnlyAnimals = this.animals.filter((animal) => {
      if (!animal.subscriptionId) {
        return true;
      }
      const subscription = this.subscriptions.find((item) => item.id === animal.subscriptionId);
      return !subscription || ![SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(subscription.status);
    }).length;

    return {
      totalUsers: this.users.length,
      activeUsers,
      totalAnimals: this.animals.length,
      totalOrganizations: this.organizations.length,
      todaySyncCount: todaySyncs,
      failedSyncCount: failedSyncs,
      activeSubscriptions,
      trialSubscriptions,
      snapshotOnlyAnimals,
    };
  }

  // 获取动物的健康状态
  getAnimalHealthStatus(animalId: string): AnimalHealthStatus | undefined {
    const animal = this.animals.find((a) => a.id === animalId);
    if (!animal) return undefined;

    const latestScore = this.healthScores
      .filter((s) => s.animalId === animalId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const latestHeartRate = this.healthData
      .filter((d) => d.animalId === animalId && d.type === HealthDataType.HEART_RATE)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const latestTemperature = this.healthData
      .filter((d) => d.animalId === animalId && d.type === HealthDataType.TEMPERATURE)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const latestActivity = this.healthData
      .filter((d) => d.animalId === animalId && d.type === HealthDataType.ACTIVITY)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const latestHRV = this.healthData
      .filter((d) => d.animalId === animalId && d.type === HealthDataType.HRV)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const latestMood = this.healthData
      .filter((d) => d.animalId === animalId && d.type === HealthDataType.MOOD)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const alertCount = this.healthAlerts.filter((a) => a.animalId === animalId && !a.isRead).length;

    return {
      animalId: animal.id,
      animalName: animal.name,
      latestHealthScore: latestScore?.overallScore || 0,
      latestHeartRate: latestHeartRate?.value,
      latestTemperature: latestTemperature?.value,
      latestActivity: latestActivity?.value,
      latestHRV: latestHRV?.value,
      latestMood: latestMood?.value?.toString(),
      alertCount,
      lastUpdateTime: latestScore?.timestamp || new Date(),
    };
  }

  // 获取组织下所有动物的健康状态
  getOrganizationAnimalsHealth(organizationId: string): AnimalHealthStatus[] {
    const orgAnimals = this.getAnimalsByOrganization(organizationId);
    return orgAnimals
      .map((animal) => this.getAnimalHealthStatus(animal.id))
      .filter((status): status is AnimalHealthStatus => status !== undefined);
  }

  // 获取动物的预警
  getAnimalAlerts(animalId: string): HealthAlert[] {
    return this.healthAlerts.filter((a) => a.animalId === animalId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 获取组织下的预警
  getOrganizationAlerts(organizationId: string): HealthAlert[] {
    const orgAnimals = this.getAnimalsByOrganization(organizationId);
    const animalIds = orgAnimals.map((a) => a.id);
    return this.healthAlerts.filter((a) => animalIds.includes(a.animalId)).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 获取动物的健康数据（按类型和时间范围）
  getAnimalHealthData(animalId: string, type: HealthDataType, hours: number = 24): HealthDataPoint[] {
    const cutoffTime = new Date(Date.now() - hours * 3600 * 1000);
    return this.healthData
      .filter((d) => d.animalId === animalId && d.type === type && d.timestamp >= cutoffTime)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // 获取动物的所有健康数据（按时间范围）
  getAnimalAllHealthData(animalId: string, hours: number = 24): HealthDataPoint[] {
    const cutoffTime = new Date(Date.now() - hours * 3600 * 1000);
    return this.healthData
      .filter((d) => d.animalId === animalId && d.timestamp >= cutoffTime)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // 获取所有历史健康数据（不限制时间范围）
  getAnimalHistoricalHealthData(animalId: string): HealthDataPoint[] {
    return this.healthData
      .filter((d) => d.animalId === animalId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // 设备管理
  getDevices(): Device[] {
    return this.devices;
  }

  getDevice(id: string): Device | undefined {
    return this.devices.find((d) => d.id === id);
  }

  getDevicesByUser(userId: string): Device[] {
    return this.devices.filter((d) => d.userId === userId);
  }

  addDevice(device: Device): void {
    if (device.animalId) {
      this.devices = this.devices.map((item) =>
        item.animalId === device.animalId
          ? {
              ...item,
              animalId: undefined,
              subscriptionId: undefined,
              isPaid: false,
              paymentType: undefined,
            }
          : item
      );
      this.subscriptions = this.subscriptions.filter((subscription) => subscription.animalId !== device.animalId);
    }
    this.devices.push(device);
    this.ensureSubscriptionForDevice(device);
    this.refreshDerivedState();
  }

  updateDevice(device: Device): void {
    const index = this.devices.findIndex((d) => d.id === device.id);
    if (index !== -1) {
      if (device.animalId) {
        this.devices = this.devices.map((item) =>
          item.id !== device.id && item.animalId === device.animalId
            ? {
                ...item,
                animalId: undefined,
                subscriptionId: undefined,
                isPaid: false,
                paymentType: undefined,
              }
            : item
        );
        this.subscriptions = this.subscriptions.filter(
          (subscription) => subscription.deviceId === device.id || subscription.animalId !== device.animalId
        );
      }
      this.devices[index] = device;
      if (device.isActivated && device.animalId) {
        this.ensureSubscriptionForDevice(device);
      } else {
        this.subscriptions = this.subscriptions.map((subscription) =>
          subscription.deviceId === device.id
            ? {
                ...subscription,
                status: SubscriptionStatus.EXPIRED,
                currentPeriodEnd: new Date(),
              }
            : subscription
        );
      }
      this.refreshDerivedState();
    }
  }

  removeDevice(id: string): void {
    this.devices = this.devices.filter((device) => device.id !== id);
    this.subscriptions = this.subscriptions.filter((subscription) => subscription.deviceId !== id);
    this.animals = this.animals.map((animal) =>
      animal.deviceId === id
        ? {
            ...animal,
            deviceId: undefined,
            subscriptionId: undefined,
          }
        : animal
    );
    this.refreshDerivedState();
  }

  // 动物订阅管理
  getSubscriptions(userId?: string): AnimalSubscription[] {
    const subscriptions = userId
      ? this.subscriptions.filter((subscription) => subscription.userId === userId)
      : this.subscriptions;

    return [...subscriptions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getSubscription(id: string): AnimalSubscription | undefined {
    return this.subscriptions.find((subscription) => subscription.id === id);
  }

  getSubscriptionByAnimal(animalId: string): AnimalSubscription | undefined {
    return this.subscriptions.find((subscription) => subscription.animalId === animalId);
  }

  private replaceConflictingSubscriptions(subscription: AnimalSubscription): void {
    this.subscriptions = this.subscriptions.filter(
      (item) =>
        item.id === subscription.id ||
        (item.animalId !== subscription.animalId && item.deviceId !== subscription.deviceId)
    );
  }

  addSubscription(subscription: AnimalSubscription): void {
    this.replaceConflictingSubscriptions(subscription);
    const index = this.subscriptions.findIndex((item) => item.id === subscription.id);
    if (index !== -1) {
      this.subscriptions[index] = subscription;
    } else {
      this.subscriptions.push(subscription);
    }
    this.refreshDerivedState();
  }

  updateSubscription(subscription: AnimalSubscription): void {
    const index = this.subscriptions.findIndex((item) => item.id === subscription.id);
    if (index !== -1) {
      this.replaceConflictingSubscriptions(subscription);
      const refreshedIndex = this.subscriptions.findIndex((item) => item.id === subscription.id);
      this.subscriptions[refreshedIndex] = subscription;
      this.refreshDerivedState();
    } else {
      this.addSubscription(subscription);
    }
  }

  removeSubscription(id: string): void {
    this.subscriptions = this.subscriptions.filter((subscription) => subscription.id !== id);
    this.refreshDerivedState();
  }

  // 医疗记录管理
  getMedicalRecords(animalId?: string): MedicalRecord[] {
    if (animalId) {
      return this.medicalRecords.filter((r) => r.animalId === animalId);
    }
    return this.medicalRecords;
  }

  addMedicalRecord(record: MedicalRecord): void {
    this.medicalRecords.push(record);
  }

  updateMedicalRecord(record: MedicalRecord): void {
    const index = this.medicalRecords.findIndex((r) => r.id === record.id);
    if (index !== -1) {
      this.medicalRecords[index] = record;
    }
  }

  removeMedicalRecord(id: string): void {
    this.medicalRecords = this.medicalRecords.filter((r) => r.id !== id);
  }

  // 报告管理
  getReports(userId?: string): Report[] {
    if (userId) {
      return this.reports.filter((r) => r.userId === userId);
    }
    return this.reports;
  }

  addReport(report: Report): void {
    this.reports.push(report);
  }

  generateMonthlyReport(userId: string, period: { start: Date; end: Date }): Report {
    const user = this.getUser(userId);
    const userAnimals = this.getAnimalsByUser(userId);
    const animalIds = userAnimals.map((a) => a.id);
    const healthStatuses = animalIds
      .map((id) => this.getAnimalHealthStatus(id))
      .filter((s): s is AnimalHealthStatus => s !== undefined);

    const avgHealthScore = healthStatuses.length > 0
      ? healthStatuses.reduce((sum, s) => sum + s.latestHealthScore, 0) / healthStatuses.length
      : 0;

    const report: Report = {
      id: `report-${Date.now()}`,
      userId,
      type: ReportType.MONTHLY_FREE,
      title: `月度健康报告 - ${user?.username || userId}`,
      content: `本报告涵盖 ${period.start.toLocaleDateString()} 至 ${period.end.toLocaleDateString()} 期间的健康数据。\n\n` +
        `总动物数: ${userAnimals.length}\n` +
        `平均健康评分: ${avgHealthScore.toFixed(1)}/100\n` +
        `健康动物数: ${healthStatuses.filter((s) => s.latestHealthScore >= 80).length}\n` +
        `需要关注: ${healthStatuses.filter((s) => s.latestHealthScore < 80 && s.latestHealthScore >= 60).length}\n` +
        `异常动物数: ${healthStatuses.filter((s) => s.latestHealthScore < 60).length}`,
      generatedAt: new Date(),
      period,
      isPaid: false,
    };

    this.reports.push(report);
    return report;
  }

  generateOnDemandReport(userId: string, animalId?: string, period?: { start: Date; end: Date }): Report {
    const user = this.getUser(userId);
    const animal = animalId ? this.getAnimal(animalId) : undefined;
    const healthStatus = animalId ? this.getAnimalHealthStatus(animalId) : undefined;

    const report: Report = {
      id: `report-${Date.now()}`,
      userId,
      animalId,
      type: ReportType.ON_DEMAND_PAID,
      title: animal
        ? `${animal.name} - 详细健康报告`
        : `${user?.username || userId} - 综合健康报告`,
      content: animal && healthStatus
        ? `动物名称: ${animal.name}\n类型: ${animal.type}\n性别: ${animal.gender}\n\n` +
          `健康评分: ${healthStatus.latestHealthScore.toFixed(1)}/100\n` +
          `心率: ${healthStatus.latestHeartRate || 'N/A'} bpm\n` +
          `体温: ${healthStatus.latestTemperature || 'N/A'} °C\n` +
          `活动量: ${healthStatus.latestActivity || 'N/A'}%\n` +
          `HRV: ${healthStatus.latestHRV || 'N/A'}\n` +
          `情绪: ${healthStatus.latestMood || 'N/A'}\n` +
          `预警数量: ${healthStatus.alertCount}`
        : `用户: ${user?.username || userId}\n动物总数: ${this.getAnimalsByUser(userId).length}`,
      generatedAt: new Date(),
      period,
      isPaid: false,
    };

    this.reports.push(report);
    return report;
  }

  // AI文案库管理
  getAITips(type?: AITipType): AITip[] {
    if (type) {
      return this.aiTips.filter((t) => t.type === type && t.isActive);
    }
    return this.aiTips;
  }

  addAITip(tip: AITip): void {
    this.aiTips.push(tip);
  }

  updateAITip(tip: AITip): void {
    const index = this.aiTips.findIndex((t) => t.id === tip.id);
    if (index !== -1) {
      this.aiTips[index] = tip;
    }
  }

  removeAITip(id: string): void {
    this.aiTips = this.aiTips.filter((t) => t.id !== id);
  }

  // AI推送规则管理
  getAIPushRules(): AIPushRule[] {
    return this.aiPushRules.filter((r) => r.isActive);
  }

  addAIPushRule(rule: AIPushRule): void {
    this.aiPushRules.push(rule);
  }

  updateAIPushRule(rule: AIPushRule): void {
    const index = this.aiPushRules.findIndex((r) => r.id === rule.id);
    if (index !== -1) {
      this.aiPushRules[index] = rule;
    }
  }

  removeAIPushRule(id: string): void {
    this.aiPushRules = this.aiPushRules.filter((r) => r.id !== id);
  }

  // 发票管理
  getInvoices(userId?: string): Invoice[] {
    if (userId) {
      return this.invoices.filter((inv) => inv.userId === userId);
    }
    return this.invoices;
  }

  addInvoice(invoice: Invoice): void {
    this.invoices.push(invoice);
  }

  updateInvoice(invoice: Invoice): void {
    const index = this.invoices.findIndex((inv) => inv.id === invoice.id);
    if (index !== -1) {
      this.invoices[index] = invoice;
    }
  }

  removeInvoice(id: string): void {
    this.invoices = this.invoices.filter((inv) => inv.id !== id);
  }

  // 数据请求管理
  getDataRequests(userId?: string): DataRequest[] {
    if (userId) {
      return this.dataRequests.filter((req) => req.userId === userId);
    }
    return this.dataRequests;
  }

  addDataRequest(request: DataRequest): void {
    this.dataRequests.push(request);
  }

  updateDataRequest(request: DataRequest): void {
    const index = this.dataRequests.findIndex((req) => req.id === request.id);
    if (index !== -1) {
      this.dataRequests[index] = request;
    }
  }

  removeDataRequest(id: string): void {
    this.dataRequests = this.dataRequests.filter((req) => req.id !== id);
  }

  // 导出数据
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      users: this.users,
      animals: this.animals,
      devices: this.devices,
      subscriptions: this.subscriptions,
      medicalRecords: this.medicalRecords,
      healthData: this.healthData,
      healthScores: this.healthScores,
      reports: this.reports,
      exportDate: new Date().toISOString(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV格式（简化版）
      let csv = 'Type,ID,Name,Date\n';
      this.users.forEach((u) => {
        csv += `User,${u.id},${u.username},${u.createdAt.toISOString()}\n`;
      });
      this.animals.forEach((a) => {
        csv += `Animal,${a.id},${a.name},${a.createdAt.toISOString()}\n`;
      });
      return csv;
    }
  }
}

export const dataManager = new DataManager();
