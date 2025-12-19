import { useState, useEffect } from 'react';
import { Table, Select, Card, Tag, Space, Button, message, Modal, Form, Input, InputNumber, Tabs, Row, Col, Statistic, Progress, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Animal, User, AnimalHealthStatus } from '../types';
import dayjs from 'dayjs';
import AnimalHealthChart from '../components/AnimalHealthChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLocale } from '../i18n';

export default function UserAnimals() {
  const { translate } = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<AnimalHealthStatus[]>([]);
  const [activeTab, setActiveTab] = useState<string>('list');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [viewingAnimal, setViewingAnimal] = useState<Animal | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const allUsers = dataManager.getUsers();
    setUsers(allUsers);
    if (allUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      updateAnimals();
    }
  }, [selectedUserId]);

  const updateAnimals = () => {
    if (selectedUserId) {
      const userAnimals = dataManager.getAnimalsByUser(selectedUserId);
      setAnimals(userAnimals);
      // 更新健康状态
      const statuses = userAnimals
        .map((animal) => dataManager.getAnimalHealthStatus(animal.id))
        .filter((status): status is AnimalHealthStatus => status !== undefined);
      setHealthStatuses(statuses);
    }
  };

  const handleAdd = () => {
    if (!selectedUserId) {
      message.warning(translate('请先选择用户', 'Please select user first'));
      return;
    }
    setEditingAnimal(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal);
    form.setFieldsValue({
      name: animal.name,
      type: animal.type,
      gender: animal.gender,
      weight: animal.weight,
      age: animal.age,
      birthday: animal.birthday ? dayjs(animal.birthday) : undefined,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeAnimal(id);
    updateAnimals();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleViewChart = (animal: Animal) => {
    setViewingAnimal(animal);
    setIsChartModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAnimal) {
        const updated: Animal = {
          ...editingAnimal,
          ...values,
          birthday: values.birthday ? values.birthday.toDate() : editingAnimal.birthday,
        };
        dataManager.updateAnimal(updated);
        message.success('更新成功');
      } else {
        const newAnimal: Animal = {
          id: `animal-${Date.now()}`,
          userId: selectedUserId,
          name: values.name,
          type: values.type,
          gender: values.gender,
          weight: values.weight,
          age: values.age,
          birthday: values.birthday ? values.birthday.toDate() : undefined,
          createdAt: new Date(),
          lastSyncAt: new Date(),
        };
        dataManager.addAnimal(newAnimal);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      updateAnimals();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleSync = () => {
    if (!selectedUserId) {
      message.warning('请先选择用户');
      return;
    }
    // 更新同步时间
    animals.forEach((animal) => {
      const updated = { ...animal, lastSyncAt: new Date() };
      dataManager.updateAnimal(updated);
    });
    updateAnimals();
    message.success(translate('同步成功', 'Sync success'));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const columns = [
    {
      title: translate('名称', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: translate('类型', 'Type'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: translate('性别', 'Gender'),
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: translate('体重 (kg)', 'Weight (kg)'),
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => weight.toFixed(1),
    },
    {
      title: translate('年龄 (岁)', 'Age (years)'),
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: translate('生日', 'Birthday'),
      dataIndex: 'birthday',
      key: 'birthday',
      render: (date: Date | undefined) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: translate('创建时间', 'Created At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: translate('最后同步', 'Last Sync'),
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      render: (date: Date | undefined) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: Animal) => (
        <Space>
          <Button
            type="link"
            icon={<LineChartOutlined />}
            onClick={() => handleViewChart(record)}
          >
            {translate('健康数据', 'Health Data')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            {translate('删除', 'Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const animalTypes = ['牛', '羊', '猪', '马', '狗', '猫', '鸡', '鸭'];
  const genders = ['公', '母'];

  // 牲畜类型
  const livestockTypes = ['牛', '羊', '猪', '马', '鸡', '鸭'];

  // 判断是否为牲畜
  const isLivestock = (type: string) => livestockTypes.includes(type);

  // 按类型统计健康状态
  const getHealthStatsByType = () => {
    const statsByType: Record<string, {
      type: string;
      category: 'livestock' | 'pet';
      total: number;
      healthy: number;
      warning: number;
      critical: number;
      avgScore: number;
      animals: Animal[];
      statuses: AnimalHealthStatus[];
    }> = {};

    animals.forEach((animal) => {
      if (!statsByType[animal.type]) {
        statsByType[animal.type] = {
          type: animal.type,
          category: isLivestock(animal.type) ? 'livestock' : 'pet',
          total: 0,
          healthy: 0,
          warning: 0,
          critical: 0,
          avgScore: 0,
          animals: [],
          statuses: [],
        };
      }

      const status = healthStatuses.find((s) => s.animalId === animal.id);
      const stats = statsByType[animal.type];
      stats.total++;
      stats.animals.push(animal);
      if (status) {
        stats.statuses.push(status);
        const score = status.latestHealthScore;
        if (score >= 80) stats.healthy++;
        else if (score >= 60) stats.warning++;
        else stats.critical++;
      }
    });

    // 计算平均分
    Object.values(statsByType).forEach((stats) => {
      if (stats.statuses.length > 0) {
        stats.avgScore = stats.statuses.reduce((sum, s) => sum + s.latestHealthScore, 0) / stats.statuses.length;
      }
    });

    return Object.values(statsByType);
  };

  const healthStatsByType = getHealthStatsByType();
  const livestockStats = healthStatsByType.filter((s) => s.category === 'livestock');
  const petStats = healthStatsByType.filter((s) => s.category === 'pet');

  // 整体统计
  const overallStats = {
    total: animals.length,
    livestock: livestockStats.reduce((sum, s) => sum + s.total, 0),
    pet: petStats.reduce((sum, s) => sum + s.total, 0),
    healthy: healthStatuses.filter((s) => s.latestHealthScore >= 80).length,
    warning: healthStatuses.filter((s) => s.latestHealthScore >= 60 && s.latestHealthScore < 80).length,
    critical: healthStatuses.filter((s) => s.latestHealthScore < 60).length,
    avgScore: healthStatuses.length > 0
      ? healthStatuses.reduce((sum, s) => sum + s.latestHealthScore, 0) / healthStatuses.length
      : 0,
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  // 准备图表数据
  const chartData = healthStatsByType.map((stats) => ({
    name: stats.type,
    total: stats.total,
    healthy: stats.healthy,
    warning: stats.warning,
    critical: stats.critical,
    avgScore: stats.avgScore,
  }));

  const pieData = [
    { name: '健康', value: overallStats.healthy, color: '#52c41a' },
    { name: '注意', value: overallStats.warning, color: '#faad14' },
    { name: '异常', value: overallStats.critical, color: '#ff4d4f' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('用户动物管理', 'User Animals')}</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder={translate('选择用户', 'Select user')}
            value={selectedUserId}
            onChange={setSelectedUserId}
            options={users.map((user) => ({
              label: `${user.username} (${user.animalCount || 0}只)`,
              value: user.id,
            }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleSync}
            disabled={!selectedUserId || animals.length === 0}
          >
            {translate('同步数据', 'Sync Data')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!selectedUserId}>
            {translate('添加动物', 'Add Animal')}
          </Button>
        </Space>
      </div>

      {selectedUser && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>{translate('用户', 'User')}：<strong>{selectedUser.username}</strong></span>
            <span>{translate('邮箱', 'Email')}：{selectedUser.email}</span>
            <span>{translate('动物数量', 'Animals')}：<strong>{animals.length}</strong></span>
          </Space>
        </Card>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: translate('动物列表', 'Animal List'),
            children: (
              <Table
                columns={columns}
                dataSource={animals}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: selectedUserId ? translate('该用户暂无动物数据', 'No animals for this user') : translate('请先选择用户', 'Please select a user') }}
              />
            ),
          },
          {
            key: 'health',
            label: translate('健康统计', 'Health Stats'),
            children: <HealthStatisticsView
              overallStats={overallStats}
              livestockStats={livestockStats}
              petStats={petStats}
              chartData={chartData}
              pieData={pieData}
              getHealthScoreColor={getHealthScoreColor}
            />,
          },
        ]}
      />

      <Modal
        title={editingAnimal ? translate('编辑动物', 'Edit Animal') : translate('添加动物', 'Add Animal')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={translate('名称', 'Name')}
            rules={[{ required: true, message: translate('请输入动物名称', 'Please enter animal name') }]}
          >
            <Input placeholder={translate('请输入动物名称', 'Please enter animal name')} />
          </Form.Item>
          <Form.Item
            name="type"
            label={translate('类型', 'Type')}
            rules={[{ required: true, message: translate('请选择动物类型', 'Please select type') }]}
          >
            <Select placeholder={translate('请选择动物类型', 'Please select type')}>
              {animalTypes.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="gender"
            label={translate('性别', 'Gender')}
            rules={[{ required: true, message: translate('请选择性别', 'Please select gender') }]}
          >
            <Select placeholder={translate('请选择性别', 'Please select gender')}>
              {genders.map((gender) => (
                <Select.Option key={gender} value={gender}>
                  {gender}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="weight"
            label={translate('体重 (kg)', 'Weight (kg)')}
            rules={[{ required: true, message: translate('请输入体重', 'Please enter weight') }]}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="age"
            label={translate('年龄 (岁)', 'Age (years)')}
            rules={[{ required: true, message: translate('请输入年龄', 'Please enter age') }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="birthday"
            label={translate('生日', 'Birthday')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={viewingAnimal ? `${viewingAnimal.name} - ${translate('健康数据图表', 'Health Charts')}` : translate('健康数据图表', 'Health Charts')}
        open={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={1200}
      >
        {viewingAnimal && <AnimalHealthChart animalId={viewingAnimal.id} />}
      </Modal>
    </div>
  );
}

// 健康统计视图组件
interface HealthStatisticsViewProps {
  overallStats: {
    total: number;
    livestock: number;
    pet: number;
    healthy: number;
    warning: number;
    critical: number;
    avgScore: number;
  };
  livestockStats: Array<{
    type: string;
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    avgScore: number;
  }>;
  petStats: Array<{
    type: string;
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    avgScore: number;
  }>;
  chartData: Array<{
    name: string;
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    avgScore: number;
  }>;
  pieData: Array<{ name: string; value: number; color: string }>;
  getHealthScoreColor: (score: number) => string;
}

function HealthStatisticsView({
  overallStats,
  livestockStats,
  petStats,
  chartData,
  pieData,
  getHealthScoreColor,
}: HealthStatisticsViewProps) {
  return (
    <div>
      {/* 整体统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总动物数"
              value={overallStats.total}
              suffix="只"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均健康评分"
              value={overallStats.avgScore.toFixed(1)}
              suffix="/ 100"
              valueStyle={{ color: getHealthScoreColor(overallStats.avgScore) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="健康"
              value={overallStats.healthy}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="注意"
              value={overallStats.warning}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="异常"
              value={overallStats.critical}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="牲畜数量"
              value={overallStats.livestock}
              suffix="只"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="宠物数量"
              value={overallStats.pet}
              suffix="只"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="健康率"
              value={overallStats.total > 0 ? ((overallStats.healthy / overallStats.total) * 100).toFixed(1) : 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="健康状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="各类型动物数量">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#1890ff" name="总数" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 牲畜统计 */}
      <Card title="牲畜健康统计" style={{ marginBottom: 24 }}>
        {livestockStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无牲畜数据</div>
        ) : (
          <Row gutter={16}>
            {livestockStats.map((stats) => (
              <Col xs={24} sm={12} lg={8} key={stats.type} style={{ marginBottom: 16 }}>
                <Card size="small" title={stats.type}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Statistic title="总数" value={stats.total} suffix="只" />
                    </div>
                    <div>
                      <Statistic
                        title="平均健康评分"
                        value={stats.avgScore.toFixed(1)}
                        suffix="/ 100"
                        valueStyle={{ color: getHealthScoreColor(stats.avgScore), fontSize: 18 }}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>健康：</span>
                        <Tag color="green">{stats.healthy}只</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>注意：</span>
                        <Tag color="orange">{stats.warning}只</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>异常：</span>
                        <Tag color="red">{stats.critical}只</Tag>
                      </div>
                    </div>
                    <Progress
                      percent={stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0}
                      strokeColor="#52c41a"
                      format={() => `${stats.total > 0 ? ((stats.healthy / stats.total) * 100).toFixed(0) : 0}%`}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 宠物统计 */}
      <Card title="宠物健康统计">
        {petStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无宠物数据</div>
        ) : (
          <Row gutter={16}>
            {petStats.map((stats) => (
              <Col xs={24} sm={12} lg={8} key={stats.type} style={{ marginBottom: 16 }}>
                <Card size="small" title={stats.type}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Statistic title="总数" value={stats.total} suffix="只" />
                    </div>
                    <div>
                      <Statistic
                        title="平均健康评分"
                        value={stats.avgScore.toFixed(1)}
                        suffix="/ 100"
                        valueStyle={{ color: getHealthScoreColor(stats.avgScore), fontSize: 18 }}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>健康：</span>
                        <Tag color="green">{stats.healthy}只</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>注意：</span>
                        <Tag color="orange">{stats.warning}只</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>异常：</span>
                        <Tag color="red">{stats.critical}只</Tag>
                      </div>
                    </div>
                    <Progress
                      percent={stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0}
                      strokeColor="#52c41a"
                      format={() => `${stats.total > 0 ? ((stats.healthy / stats.total) * 100).toFixed(0) : 0}%`}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}
