import {
  User,
  UserRole,
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
} from '../types';

class DataManager {
  private users: User[] = [];
  private organizations: Organization[] = [];
  private animals: Animal[] = [];
  private syncRecords: SyncRecord[] = [];
  private healthData: HealthDataPoint[] = [];
  private healthScores: HealthScore[] = [];
  private healthAlerts: HealthAlert[] = [];

  constructor() {
    this.setupMockData();
    this.startHealthDataGeneration();
  }

  // 用户管理
  getUsers(): User[] {
    return this.users;
  }

  getUser(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  addUser(user: User): void {
    this.users.push(user);
  }

  updateUser(user: User): void {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  removeUser(id: string): void {
    this.users = this.users.filter((u) => u.id !== id);
    // 删除用户时，也删除其下的动物
    this.animals = this.animals.filter((a) => a.userId !== id);
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
    this.animals.push(animal);
    // 更新用户的动物数量
    const user = this.users.find((u) => u.id === animal.userId);
    if (user) {
      user.animalCount = (user.animalCount || 0) + 1;
      // 更新组织的动物数量
      if (user.organizationId) {
        this.updateOrganizationAnimalCount(user.organizationId);
      }
    }
  }

  updateAnimal(animal: Animal): void {
    const index = this.animals.findIndex((a) => a.id === animal.id);
    if (index !== -1) {
      this.animals[index] = animal;
    }
  }

  removeAnimal(id: string): void {
    const animal = this.animals.find((a) => a.id === id);
    if (animal) {
      this.animals = this.animals.filter((a) => a.id !== id);
      // 更新用户的动物数量
      const user = this.users.find((u) => u.id === animal.userId);
      if (user && user.animalCount) {
        user.animalCount = Math.max(0, user.animalCount - 1);
        // 更新组织的动物数量
        if (user.organizationId) {
          this.updateOrganizationAnimalCount(user.organizationId);
        }
      }
    }
  }

  // 更新组织的动物数量统计
  private updateOrganizationAnimalCount(organizationId: string): void {
    const orgAnimals = this.getAnimalsByOrganization(organizationId);
    const org = this.organizations.find((o) => o.id === organizationId);
    if (org) {
      org.animalCount = orgAnimals.length;
    }
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

    return {
      totalUsers: this.users.length,
      activeUsers,
      totalAnimals: this.animals.length,
      totalOrganizations: this.organizations.length,
      todaySyncCount: todaySyncs,
      failedSyncCount: failedSyncs,
    };
  }

  // 初始化模拟数据
  private setupMockData(): void {
    // 创建组织
    const org1: Organization = {
      id: 'org-1',
      name: '农场A',
      description: '大型畜牧农场',
      userCount: 5,
      animalCount: 50,
      createdAt: new Date('2024-01-01'),
      status: 'active',
    };

    const org2: Organization = {
      id: 'org-2',
      name: '宠物医院B',
      description: '专业宠物医疗机构',
      userCount: 3,
      animalCount: 30,
      createdAt: new Date('2024-02-01'),
      status: 'active',
    };

    this.organizations = [org1, org2];

    // 创建用户
    const users: User[] = [
      {
        id: 'user-1',
        username: 'admin',
        email: 'admin@petraq.com',
        phone: '13800138000',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
        animalCount: 0,
      },
      {
        id: 'user-2',
        username: 'farmer1',
        email: 'farmer1@example.com',
        phone: '13800138001',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-15'),
        lastLoginAt: new Date(Date.now() - 3600000),
        animalCount: 20,
        organizationId: 'org-1',
      },
      {
        id: 'user-3',
        username: 'farmer2',
        email: 'farmer2@example.com',
        phone: '13800138002',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-20'),
        animalCount: 15,
        organizationId: 'org-1',
      },
      {
        id: 'user-4',
        username: 'vet1',
        email: 'vet1@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-02-10'),
        animalCount: 10,
        organizationId: 'org-2',
      },
      {
        id: 'user-5',
        username: 'viewer1',
        email: 'viewer1@example.com',
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-02-15'),
        animalCount: 0,
      },
    ];

    this.users = users;

    // 创建动物数据
    const animalTypes = ['牛', '羊', '猪', '马', '狗', '猫'];
    const genders = ['公', '母'];

    users.forEach((user, userIndex) => {
      if (user.role === UserRole.USER && user.animalCount) {
        for (let i = 0; i < user.animalCount; i++) {
          this.animals.push({
            id: `animal-${user.id}-${i}`,
            userId: user.id,
            name: `${animalTypes[userIndex % animalTypes.length]}${String(i + 1).padStart(3, '0')}`,
            type: animalTypes[userIndex % animalTypes.length],
            gender: genders[i % 2],
            weight: 50 + Math.random() * 500,
            age: Math.floor(Math.random() * 10) + 1,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600000),
            lastSyncAt: new Date(Date.now() - Math.random() * 24 * 3600000),
          });
        }
      }
    });

    // 更新组织的动物数量统计
    this.organizations.forEach((org) => {
      this.updateOrganizationAnimalCount(org.id);
      // 更新组织的用户数量
      const orgUsers = this.getUsersByOrganization(org.id);
      org.userCount = orgUsers.length;
    });

    // 创建同步记录
    users.forEach((user) => {
      if (user.role === UserRole.USER) {
        for (let i = 0; i < 5; i++) {
          const syncTime = new Date(Date.now() - i * 24 * 3600000);
          this.syncRecords.push({
            id: `sync-${user.id}-${i}`,
            userId: user.id,
            syncType: i === 0 ? SyncType.MANUAL : SyncType.INCREMENTAL,
            status: i < 2 ? SyncStatus.SUCCESS : SyncStatus.SUCCESS,
            startTime: syncTime,
            endTime: new Date(syncTime.getTime() + 2000),
            recordCount: Math.floor(Math.random() * 50) + 10,
            syncDirection: i % 2 === 0 ? 'upload' : 'download',
          });
        }
      }
    });

    // 生成初始健康数据
    this.generateInitialHealthData();
  }

  // 生成初始健康数据
  private generateInitialHealthData(): void {
    this.animals.forEach((animal) => {
      // 为每个动物生成健康评分
      const healthScore: HealthScore = {
        id: `score-${animal.id}`,
        animalId: animal.id,
        overallScore: 60 + Math.random() * 35,
        heartRateScore: 70 + Math.random() * 25,
        temperatureScore: 75 + Math.random() * 20,
        activityScore: 60 + Math.random() * 30,
        sleepScore: 60 + Math.random() * 35,
        stressScore: 70 + Math.random() * 20,
        timestamp: new Date(),
      };
      this.healthScores.push(healthScore);

      // 生成最新的健康数据点
      const heartRate = this.generateMockHeartRate(animal);
      const temperature = this.generateMockTemperature(animal);
      const activity = Math.random() * 100;

      this.healthData.push(
        {
          id: `data-${animal.id}-hr`,
          animalId: animal.id,
          type: HealthDataType.HEART_RATE,
          value: heartRate,
          timestamp: new Date(),
          unit: 'bpm',
        },
        {
          id: `data-${animal.id}-temp`,
          animalId: animal.id,
          type: HealthDataType.TEMPERATURE,
          value: temperature,
          timestamp: new Date(),
          unit: '°C',
        },
        {
          id: `data-${animal.id}-act`,
          animalId: animal.id,
          type: HealthDataType.ACTIVITY,
          value: activity,
          timestamp: new Date(),
          unit: '%',
        }
      );

      // 检查并生成预警
      this.checkAndGenerateAlerts(animal, heartRate, temperature, healthScore.overallScore);
    });
  }

  // 生成模拟心率
  private generateMockHeartRate(animal: Animal): number {
    // 根据动物类型生成不同的心率范围
    const ranges: Record<string, { min: number; max: number }> = {
      牛: { min: 60, max: 80 },
      羊: { min: 70, max: 90 },
      猪: { min: 70, max: 100 },
      马: { min: 30, max: 50 },
      狗: { min: 60, max: 140 },
      猫: { min: 140, max: 220 },
      鸡: { min: 200, max: 400 },
      鸭: { min: 200, max: 400 },
    };
    const range = ranges[animal.type] || { min: 60, max: 100 };
    return Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10;
  }

  // 生成模拟体温
  private generateMockTemperature(animal: Animal): number {
    const ranges: Record<string, { min: number; max: number }> = {
      牛: { min: 38.0, max: 39.5 },
      羊: { min: 38.5, max: 40.0 },
      猪: { min: 38.0, max: 40.0 },
      马: { min: 37.0, max: 38.5 },
      狗: { min: 37.5, max: 39.5 },
      猫: { min: 37.5, max: 39.2 },
      鸡: { min: 40.0, max: 42.0 },
      鸭: { min: 40.0, max: 42.0 },
    };
    const range = ranges[animal.type] || { min: 37.0, max: 40.0 };
    return Math.round((range.min + Math.random() * (range.max - range.min)) * 10) / 10;
  }

  // 检查并生成预警
  private checkAndGenerateAlerts(
    animal: Animal,
    heartRate: number,
    temperature: number,
    healthScore: number
  ): void {
    const ranges: Record<string, { hr: { min: number; max: number }; temp: { min: number; max: number } }> = {
      牛: { hr: { min: 60, max: 80 }, temp: { min: 38.0, max: 39.5 } },
      羊: { hr: { min: 70, max: 90 }, temp: { min: 38.5, max: 40.0 } },
      猪: { hr: { min: 70, max: 100 }, temp: { min: 38.0, max: 40.0 } },
      马: { hr: { min: 30, max: 50 }, temp: { min: 37.0, max: 38.5 } },
      狗: { hr: { min: 60, max: 140 }, temp: { min: 37.5, max: 39.5 } },
      猫: { hr: { min: 140, max: 220 }, temp: { min: 37.5, max: 39.2 } },
      鸡: { hr: { min: 200, max: 400 }, temp: { min: 40.0, max: 42.0 } },
      鸭: { hr: { min: 200, max: 400 }, temp: { min: 40.0, max: 42.0 } },
    };

    const range = ranges[animal.type] || { hr: { min: 60, max: 100 }, temp: { min: 37.0, max: 40.0 } };

    // 检查心率异常
    if (heartRate < range.hr.min || heartRate > range.hr.max) {
      const deviation = Math.min(Math.abs(heartRate - range.hr.min), Math.abs(heartRate - range.hr.max));
      const severity = deviation > 20 ? 'high' : deviation > 10 ? 'medium' : 'low';
      this.healthAlerts.push({
        id: `alert-${animal.id}-hr-${Date.now()}`,
        animalId: animal.id,
        type: '心率异常',
        severity,
        message: `${animal.name}的心率异常: ${heartRate} bpm (正常范围: ${range.hr.min}-${range.hr.max})`,
        timestamp: new Date(),
        isRead: false,
      });
    }

    // 检查体温异常
    if (temperature < range.temp.min || temperature > range.temp.max) {
      const deviation = Math.min(Math.abs(temperature - range.temp.min), Math.abs(temperature - range.temp.max));
      const severity = deviation > 1.0 ? 'high' : deviation > 0.5 ? 'medium' : 'low';
      this.healthAlerts.push({
        id: `alert-${animal.id}-temp-${Date.now()}`,
        animalId: animal.id,
        type: '体温异常',
        severity,
        message: `${animal.name}的体温异常: ${temperature}°C (正常范围: ${range.temp.min}-${range.temp.max})`,
        timestamp: new Date(),
        isRead: false,
      });
    }

    // 检查健康评分过低
    if (healthScore < 60) {
      this.healthAlerts.push({
        id: `alert-${animal.id}-score-${Date.now()}`,
        animalId: animal.id,
        type: '健康评分异常',
        severity: healthScore < 40 ? 'critical' : 'high',
        message: `${animal.name}的健康评分较低: ${healthScore.toFixed(1)}分，建议关注`,
        timestamp: new Date(),
        isRead: false,
      });
    }
  }

  // 开始健康数据生成（定期更新）
  private startHealthDataGeneration(): void {
    window.setInterval(() => {
      this.updateHealthData();
    }, 10000); // 每10秒更新一次
  }

  // 更新健康数据
  private updateHealthData(): void {
    this.animals.forEach((animal) => {
      const heartRate = this.generateMockHeartRate(animal);
      const temperature = this.generateMockTemperature(animal);
      const activity = Math.random() * 100;

      // 更新最新数据
      this.healthData = this.healthData.filter(
        (d) => !(d.animalId === animal.id && [HealthDataType.HEART_RATE, HealthDataType.TEMPERATURE, HealthDataType.ACTIVITY].includes(d.type))
      );

      this.healthData.push(
        {
          id: `data-${animal.id}-hr-${Date.now()}`,
          animalId: animal.id,
          type: HealthDataType.HEART_RATE,
          value: heartRate,
          timestamp: new Date(),
          unit: 'bpm',
        },
        {
          id: `data-${animal.id}-temp-${Date.now()}`,
          animalId: animal.id,
          type: HealthDataType.TEMPERATURE,
          value: temperature,
          timestamp: new Date(),
          unit: '°C',
        },
        {
          id: `data-${animal.id}-act-${Date.now()}`,
          animalId: animal.id,
          type: HealthDataType.ACTIVITY,
          value: activity,
          timestamp: new Date(),
          unit: '%',
        }
      );

      // 更新健康评分
      const latestScore = this.healthScores.find((s) => s.animalId === animal.id);
      if (latestScore) {
        const newScore = {
          ...latestScore,
          overallScore: 60 + Math.random() * 35,
          heartRateScore: 70 + Math.random() * 25,
          temperatureScore: 75 + Math.random() * 20,
          activityScore: 60 + Math.random() * 30,
          timestamp: new Date(),
        };
        const index = this.healthScores.findIndex((s) => s.id === latestScore.id);
        if (index !== -1) {
          this.healthScores[index] = newScore;
        }
      }

      // 检查预警（10%概率生成新预警）
      if (Math.random() < 0.1) {
        this.checkAndGenerateAlerts(animal, heartRate, temperature, latestScore?.overallScore || 70);
      }
    });
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

    const alertCount = this.healthAlerts.filter((a) => a.animalId === animalId && !a.isRead).length;

    return {
      animalId: animal.id,
      animalName: animal.name,
      latestHealthScore: latestScore?.overallScore || 0,
      latestHeartRate: latestHeartRate?.value,
      latestTemperature: latestTemperature?.value,
      latestActivity: latestActivity?.value,
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
}

export const dataManager = new DataManager();
