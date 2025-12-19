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
  Device,
  MedicalRecord,
  MedicalRecordType,
  Report,
  ReportType,
  AITip,
  AITipType,
  AIPushRule,
  PaymentStatus,
  PaymentType,
  UserGroupType,
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
  private invoices: Invoice[] = [];
  private dataRequests: DataRequest[] = [];

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
        fullName: '管理员',
        address: '北京市朝阳区',
        occupation: '系统管理员',
        birthday: new Date('1990-01-01'),
        gender: '男',
        groupType: UserGroupType.CLINIC,
        paymentStatus: PaymentStatus.PAID,
        hasOverdue: false,
        deviceCount: 0,
        paidDeviceCount: 0,
        unpaidDeviceCount: 0,
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
        fullName: '张农场主',
        address: '内蒙古自治区呼和浩特市',
        occupation: '农场主',
        birthday: new Date('1985-05-15'),
        gender: '男',
        groupType: UserGroupType.LIVESTOCK,
        paymentStatus: PaymentStatus.PAID,
        hasOverdue: false,
        deviceCount: 20,
        paidDeviceCount: 18,
        unpaidDeviceCount: 2,
        promotionInfo: '通过农业合作社推荐',
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
        fullName: '李牧民',
        address: '新疆维吾尔自治区',
        occupation: '牧民',
        birthday: new Date('1988-08-20'),
        gender: '男',
        groupType: UserGroupType.LIVESTOCK,
        paymentStatus: PaymentStatus.OVERDUE,
        hasOverdue: true,
        deviceCount: 15,
        paidDeviceCount: 10,
        unpaidDeviceCount: 5,
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
        fullName: '王兽医',
        address: '上海市浦东新区',
        occupation: '兽医',
        birthday: new Date('1992-03-10'),
        gender: '女',
        groupType: UserGroupType.CLINIC,
        paymentStatus: PaymentStatus.PAID,
        hasOverdue: false,
        deviceCount: 10,
        paidDeviceCount: 10,
        unpaidDeviceCount: 0,
      },
      {
        id: 'user-5',
        username: 'viewer1',
        email: 'viewer1@example.com',
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-02-15'),
        animalCount: 0,
        fullName: '赵保险',
        address: '深圳市南山区',
        occupation: '保险专员',
        birthday: new Date('1995-06-15'),
        gender: '女',
        groupType: UserGroupType.INSURANCE,
        paymentStatus: PaymentStatus.FREE,
        hasOverdue: false,
        deviceCount: 0,
        paidDeviceCount: 0,
        unpaidDeviceCount: 0,
      },
    ];

    this.users = users;

    // 创建动物数据
    const animalTypes = ['牛', '羊', '猪', '马', '狗', '猫'];
    const genders = ['公', '母'];

    users.forEach((user, userIndex) => {
      if (user.role === UserRole.USER && user.animalCount) {
        for (let i = 0; i < user.animalCount; i++) {
          const animalId = `animal-${user.id}-${i}`;
          const deviceId = `device-${user.id}-${i}`;
          const birthday = new Date(Date.now() - (Math.floor(Math.random() * 10) + 1) * 365 * 24 * 3600000);
          const age = Math.floor((Date.now() - birthday.getTime()) / (365 * 24 * 3600000));
          
          // 创建设备
          const device: Device = {
            id: deviceId,
            code: `DEV${String(Date.now() + i).slice(-8)}`,
            userId: user.id,
            animalId: animalId,
            isActivated: true,
            isPaid: i < (user.paidDeviceCount || 0),
            paymentType: i < (user.paidDeviceCount || 0) ? PaymentType.MONTHLY : undefined,
            batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
            isBluetoothConnected: Math.random() > 0.3,
            lastSyncAt: new Date(Date.now() - Math.random() * 24 * 3600000),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600000),
          };
          this.devices.push(device);

          // 创建动物
          this.animals.push({
            id: animalId,
            userId: user.id,
            name: `${animalTypes[userIndex % animalTypes.length]}${String(i + 1).padStart(3, '0')}`,
            type: animalTypes[userIndex % animalTypes.length],
            gender: genders[i % 2],
            weight: 50 + Math.random() * 500,
            age: age,
            birthday: birthday,
            deviceId: deviceId,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600000),
            lastSyncAt: new Date(Date.now() - Math.random() * 24 * 3600000),
          });

          // 为部分动物创建医疗记录
          if (Math.random() > 0.7) {
            const recordTypes = [
              MedicalRecordType.VACCINATION,
              MedicalRecordType.PHYSICAL_EXAM,
              MedicalRecordType.BLOOD_TEST,
              MedicalRecordType.DIAGNOSIS,
            ];
            const recordType = recordTypes[Math.floor(Math.random() * recordTypes.length)];
            this.medicalRecords.push({
              id: `record-${animalId}-${Date.now()}`,
              animalId: animalId,
              type: recordType,
              title: `${recordType}记录`,
              description: `这是${animalId}的${recordType}记录`,
              date: new Date(Date.now() - Math.random() * 180 * 24 * 3600000),
              veterinarian: user.groupType === UserGroupType.CLINIC ? user.fullName : '张兽医',
              clinic: user.organizationId ? this.organizations.find((o) => o.id === user.organizationId)?.name : undefined,
              createdAt: new Date(),
            });
          }
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

    // 初始化AI文案库
    this.aiTips = [
      {
        id: 'tip-1',
        type: AITipType.HEALTH_TIP,
        content: '您的动物健康评分良好，继续保持！',
        tags: ['健康', '良好'],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'tip-2',
        type: AITipType.CARE_TIP,
        content: '建议定期为动物进行体检，确保健康状态',
        tags: ['护理', '体检'],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'tip-3',
        type: AITipType.ALERT_TIP,
        content: '检测到健康指标异常，请及时关注',
        tags: ['预警', '异常'],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
      },
    ];

    // 初始化AI推送规则
    this.aiPushRules = [
      {
        id: 'rule-1',
        name: '健康评分低预警',
        tipType: AITipType.ALERT_TIP,
        conditions: {
          healthScoreRange: [0, 60],
        },
        tipContent: '您的动物健康评分较低，建议及时检查',
        isActive: true,
        priority: 1,
        createdAt: new Date(),
      },
      {
        id: 'rule-2',
        name: '健康评分良好提示',
        tipType: AITipType.HEALTH_TIP,
        conditions: {
          healthScoreRange: [80, 100],
        },
        tipContent: '您的动物健康状况良好，继续保持！',
        isActive: true,
        priority: 2,
        createdAt: new Date(),
      },
    ];
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
      const hrv = 20 + Math.random() * 60; // HRV值 20-80
      const moodValues = ['平静', '活跃', '紧张', '放松', '兴奋'];
      const mood = moodValues[Math.floor(Math.random() * moodValues.length)];

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
        },
        {
          id: `data-${animal.id}-hrv`,
          animalId: animal.id,
          type: HealthDataType.HRV,
          value: hrv,
          timestamp: new Date(),
          unit: 'ms',
        },
        {
          id: `data-${animal.id}-mood`,
          animalId: animal.id,
          type: HealthDataType.MOOD,
          value: moodValues.indexOf(mood),
          timestamp: new Date(),
          unit: '',
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
      const hrv = 20 + Math.random() * 60; // HRV值 20-80
      const moodValues = ['平静', '活跃', '紧张', '放松', '兴奋'];
      const mood = moodValues[Math.floor(Math.random() * moodValues.length)];

      // 更新最新数据（保留历史数据，只更新最新的）
      // 为了保留历史数据，我们只删除最近的数据点，保留旧的
      const now = Date.now();
      this.healthData = this.healthData.filter(
        (d) => !(d.animalId === animal.id && 
          [HealthDataType.HEART_RATE, HealthDataType.TEMPERATURE, HealthDataType.ACTIVITY, HealthDataType.HRV, HealthDataType.MOOD].includes(d.type) &&
          (now - d.timestamp.getTime()) < 60000) // 只删除1分钟内的最新数据
      );

      // 添加新的数据点（保留历史）
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
        },
        {
          id: `data-${animal.id}-hrv-${Date.now()}`,
          animalId: animal.id,
          type: HealthDataType.HRV,
          value: hrv,
          timestamp: new Date(),
          unit: 'ms',
        },
        {
          id: `data-${animal.id}-mood-${Date.now()}`,
          animalId: animal.id,
          type: HealthDataType.MOOD,
          value: moodValues.indexOf(mood),
          timestamp: new Date(),
          unit: '',
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
    this.devices.push(device);
    // 更新用户的设备数量
    if (device.userId) {
      const user = this.users.find((u) => u.id === device.userId);
      if (user) {
        user.deviceCount = (user.deviceCount || 0) + 1;
        if (device.isPaid) {
          user.paidDeviceCount = (user.paidDeviceCount || 0) + 1;
        } else {
          user.unpaidDeviceCount = (user.unpaidDeviceCount || 0) + 1;
        }
      }
    }
  }

  updateDevice(device: Device): void {
    const index = this.devices.findIndex((d) => d.id === device.id);
    if (index !== -1) {
      const oldDevice = this.devices[index];
      this.devices[index] = device;
      // 更新用户设备统计
      if (oldDevice.userId && oldDevice.userId !== device.userId) {
        // 用户变更
        if (oldDevice.userId) {
          const oldUser = this.users.find((u) => u.id === oldDevice.userId);
          if (oldUser) {
            oldUser.deviceCount = Math.max(0, (oldUser.deviceCount || 0) - 1);
            if (oldDevice.isPaid) {
              oldUser.paidDeviceCount = Math.max(0, (oldUser.paidDeviceCount || 0) - 1);
            } else {
              oldUser.unpaidDeviceCount = Math.max(0, (oldUser.unpaidDeviceCount || 0) - 1);
            }
          }
        }
        if (device.userId) {
          const newUser = this.users.find((u) => u.id === device.userId);
          if (newUser) {
            newUser.deviceCount = (newUser.deviceCount || 0) + 1;
            if (device.isPaid) {
              newUser.paidDeviceCount = (newUser.paidDeviceCount || 0) + 1;
            } else {
              newUser.unpaidDeviceCount = (newUser.unpaidDeviceCount || 0) + 1;
            }
          }
        }
      } else if (oldDevice.isPaid !== device.isPaid && device.userId) {
        // 付费状态变更
        const user = this.users.find((u) => u.id === device.userId);
        if (user) {
          if (oldDevice.isPaid && !device.isPaid) {
            user.paidDeviceCount = Math.max(0, (user.paidDeviceCount || 0) - 1);
            user.unpaidDeviceCount = (user.unpaidDeviceCount || 0) + 1;
          } else if (!oldDevice.isPaid && device.isPaid) {
            user.unpaidDeviceCount = Math.max(0, (user.unpaidDeviceCount || 0) - 1);
            user.paidDeviceCount = (user.paidDeviceCount || 0) + 1;
          }
        }
      }
    }
  }

  removeDevice(id: string): void {
    const device = this.devices.find((d) => d.id === id);
    if (device) {
      this.devices = this.devices.filter((d) => d.id !== id);
      if (device.userId) {
        const user = this.users.find((u) => u.id === device.userId);
        if (user) {
          user.deviceCount = Math.max(0, (user.deviceCount || 0) - 1);
          if (device.isPaid) {
            user.paidDeviceCount = Math.max(0, (user.paidDeviceCount || 0) - 1);
          } else {
            user.unpaidDeviceCount = Math.max(0, (user.unpaidDeviceCount || 0) - 1);
          }
        }
      }
    }
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
