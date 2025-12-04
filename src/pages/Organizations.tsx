import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, Popconfirm, message, Card, Statistic, Row, Col, Descriptions, Tabs, Progress, Badge, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, HeartOutlined, WarningOutlined, ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Organization, Animal, AnimalHealthStatus, HealthAlert } from '../types';
import dayjs from 'dayjs';
import AnimalHealthChart from '../components/AnimalHealthChart';

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    updateOrganizations();
  }, []);

  const updateOrganizations = () => {
    const orgs = dataManager.getOrganizations();
    setOrganizations(orgs);
  };

  const handleAdd = () => {
    setEditingOrg(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.setFieldsValue({
      name: org.name,
      description: org.description,
      status: org.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeOrganization(id);
    updateOrganizations();
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingOrg) {
        const updated: Organization = {
          ...editingOrg,
          ...values,
        };
        dataManager.updateOrganization(updated);
        message.success('更新成功');
      } else {
        const newOrg: Organization = {
          id: `org-${Date.now()}`,
          name: values.name,
          description: values.description,
          userCount: 0,
          animalCount: 0,
          createdAt: new Date(),
          status: values.status || 'active',
        };
        dataManager.addOrganization(newOrg);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      updateOrganizations();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: '组织名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: '动物数',
      dataIndex: 'animalCount',
      key: 'animalCount',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Organization) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个组织吗？删除后该组织下的用户将移出组织。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (org: Organization) => {
    setViewingOrg(org);
    setIsDetailModalVisible(true);
  };

  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.status === 'active').length,
    totalUsers: organizations.reduce((sum, o) => sum + o.userCount, 0),
    totalAnimals: organizations.reduce((sum, o) => sum + o.animalCount, 0),
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>组织管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加组织
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="组织总数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="活跃组织" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总用户数" value={stats.totalUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总动物数" value={stats.totalAnimals} />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={organizations}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => {
            const orgUsers = dataManager.getUsersByOrganization(record.id);
            const orgAnimals = dataManager.getAnimalsByOrganization(record.id);
            
            // 按类型统计动物
            const animalsByType = orgAnimals.reduce((acc, animal) => {
              acc[animal.type] = (acc[animal.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="组织用户" size="small">
                      {orgUsers.length === 0 ? (
                        <div>暂无用户</div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {orgUsers.map((user) => (
                            <div key={user.id}>
                              <Tag>{user.username}</Tag>
                              <span style={{ marginLeft: 8, color: '#666' }}>
                                ({user.animalCount || 0}只动物)
                              </span>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="动物类型分布" size="small">
                      {Object.keys(animalsByType).length === 0 ? (
                        <div>暂无动物</div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {Object.entries(animalsByType).map(([type, count]) => (
                            <div key={type}>
                              <Tag color="blue">{type}</Tag>
                              <span style={{ marginLeft: 8 }}>{count}只</span>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </Col>
                </Row>
              </div>
            );
          },
        }}
      />

      <Modal
        title={editingOrg ? '编辑组织' : '添加组织'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="组织名称"
            rules={[{ required: true, message: '请输入组织名称' }]}
          >
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入组织描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Input placeholder="状态" disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${viewingOrg?.name} - 详细信息`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {viewingOrg && <OrganizationDetailView organization={viewingOrg} />}
      </Modal>
    </div>
  );
}

// 组织详情视图组件
function OrganizationDetailView({ organization }: { organization: Organization }) {
  const [healthStatuses, setHealthStatuses] = useState<AnimalHealthStatus[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [viewingAnimal, setViewingAnimal] = useState<Animal | null>(null);

  const orgUsers = dataManager.getUsersByOrganization(organization.id);
  const orgAnimals = dataManager.getAnimalsByOrganization(organization.id);

  useEffect(() => {
    updateHealthData();
  }, [organization.id]);

  const updateHealthData = () => {
    const statuses = dataManager.getOrganizationAnimalsHealth(organization.id);
    const orgAlerts = dataManager.getOrganizationAlerts(organization.id);
    setHealthStatuses(statuses);
    setAlerts(orgAlerts);
  };

  // 按类型统计动物
  const animalsByType = orgAnimals.reduce((acc, animal) => {
    acc[animal.type] = (acc[animal.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 按用户分组动物
  const animalsByUser = orgUsers.map((user) => ({
    user,
    animals: dataManager.getAnimalsByUser(user.id),
  }));

  // 健康统计
  const healthStats = {
    total: healthStatuses.length,
    healthy: healthStatuses.filter((s) => s.latestHealthScore >= 80).length,
    warning: healthStatuses.filter((s) => s.latestHealthScore >= 60 && s.latestHealthScore < 80).length,
    critical: healthStatuses.filter((s) => s.latestHealthScore < 60).length,
    avgScore: healthStatuses.length > 0
      ? healthStatuses.reduce((sum, s) => sum + s.latestHealthScore, 0) / healthStatuses.length
      : 0,
    totalAlerts: alerts.filter((a) => !a.isRead).length,
  };

  const handleViewAnimalChart = (animal: Animal) => {
    setViewingAnimal(animal);
    setIsChartModalVisible(true);
  };

  const animalColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: '体重 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => weight.toFixed(1),
    },
    {
      title: '年龄 (岁)',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Animal) => (
        <Button
          type="link"
          icon={<LineChartOutlined />}
          onClick={() => handleViewAnimalChart(record)}
        >
          健康数据
        </Button>
      ),
    },
  ];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, string> = {
      low: 'default',
      medium: 'orange',
      high: 'red',
      critical: 'red',
    };
    return colorMap[severity] || 'default';
  };

  const healthStatusColumns = [
    {
      title: '动物名称',
      dataIndex: 'animalName',
      key: 'animalName',
    },
    {
      title: '健康评分',
      dataIndex: 'latestHealthScore',
      key: 'latestHealthScore',
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            type="circle"
            percent={score}
            size={50}
            strokeColor={getHealthScoreColor(score)}
            format={() => `${score.toFixed(0)}`}
          />
          <Tag color={getHealthScoreColor(score)}>{score >= 80 ? '健康' : score >= 60 ? '注意' : '异常'}</Tag>
        </div>
      ),
      sorter: (a: AnimalHealthStatus, b: AnimalHealthStatus) => a.latestHealthScore - b.latestHealthScore,
    },
    {
      title: '心率',
      dataIndex: 'latestHeartRate',
      key: 'latestHeartRate',
      render: (rate: number | undefined) => rate ? `${rate.toFixed(0)} bpm` : '-',
    },
    {
      title: '体温',
      dataIndex: 'latestTemperature',
      key: 'latestTemperature',
      render: (temp: number | undefined) => temp ? `${temp.toFixed(1)}°C` : '-',
    },
    {
      title: '活动量',
      dataIndex: 'latestActivity',
      key: 'latestActivity',
      render: (activity: number | undefined) => activity ? `${activity.toFixed(0)}%` : '-',
    },
    {
      title: '预警数',
      dataIndex: 'alertCount',
      key: 'alertCount',
      render: (count: number) => (
        <Badge count={count} showZero={false}>
          <span>{count > 0 ? count : '-'}</span>
        </Badge>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdateTime',
      key: 'lastUpdateTime',
      render: (date: Date) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AnimalHealthStatus) => {
        const animal = orgAnimals.find((a) => a.id === record.animalId);
        if (!animal) return null;
        return (
          <Button
            type="link"
            icon={<LineChartOutlined />}
            onClick={() => handleViewAnimalChart(animal)}
          >
            查看图表
          </Button>
        );
      },
    },
  ];

  const alertColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '动物',
      dataIndex: 'animalId',
      key: 'animalId',
      render: (id: string) => {
        const animal = orgAnimals.find((a) => a.id === id);
        return animal?.name || id;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const severityMap: Record<string, string> = {
          low: '轻微',
          medium: '中等',
          high: '严重',
          critical: '紧急',
        };
        return <Tag color={getSeverityColor(severity)}>{severityMap[severity] || severity}</Tag>;
      },
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div>
          <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="组织名称">{organization.name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={organization.status === 'active' ? 'green' : 'red'}>
                {organization.status === 'active' ? '活跃' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {organization.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="用户数">{orgUsers.length}</Descriptions.Item>
            <Descriptions.Item label="动物数">{orgAnimals.length}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(organization.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均健康评分"
                  value={healthStats.avgScore.toFixed(1)}
                  suffix="/ 100"
                  valueStyle={{ color: getHealthScoreColor(healthStats.avgScore) }}
                  prefix={<HeartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="健康" value={healthStats.healthy} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="注意" value={healthStats.warning} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="异常"
                  value={healthStats.critical}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {healthStats.totalAlerts > 0 && (
              <Alert
                message={`有 ${healthStats.totalAlerts} 条未读预警`}
                type="warning"
                icon={<WarningOutlined />}
                style={{ flex: 1, marginRight: 16 }}
              />
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={updateHealthData}
            >
              刷新健康数据
            </Button>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="动物类型分布" size="small">
                {Object.keys(animalsByType).length === 0 ? (
                  <div>暂无动物</div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(animalsByType).map(([type, count]) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color="blue">{type}</Tag>
                        <span>{count}只</span>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="用户列表" size="small">
                {orgUsers.length === 0 ? (
                  <div>暂无用户</div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {orgUsers.map((user) => (
                      <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Tag>{user.username}</Tag>
                          <span style={{ marginLeft: 8, color: '#666' }}>{user.email}</span>
                        </div>
                        <span>{user.animalCount || 0}只</span>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'health',
      label: (
        <span>
          健康状态
          {healthStats.totalAlerts > 0 && (
            <Badge count={healthStats.totalAlerts} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={updateHealthData}
            >
              刷新数据
            </Button>
          </div>
          <Table
            columns={healthStatusColumns}
            dataSource={healthStatuses}
            rowKey="animalId"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'alerts',
      label: (
        <span>
          健康预警
          {healthStats.totalAlerts > 0 && (
            <Badge count={healthStats.totalAlerts} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={updateHealthData}
            >
              刷新数据
            </Button>
          </div>
          {alerts.length === 0 ? (
            <Alert message="暂无预警" type="success" />
          ) : (
            <Table
              columns={alertColumns}
              dataSource={alerts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          )}
        </div>
      ),
    },
    {
      key: 'animals',
      label: `所有动物 (${orgAnimals.length})`,
      children: (
        <Table
          columns={animalColumns}
          dataSource={orgAnimals}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ),
    },
    {
      key: 'byUser',
      label: '按用户查看',
      children: (
        <div>
          {animalsByUser.map(({ user, animals }) => (
            <Card
              key={user.id}
              title={
                <Space>
                  <span>{user.username}</span>
                  <Tag>{user.email}</Tag>
                  <Tag color="blue">{animals.length}只动物</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {animals.length === 0 ? (
                <div>该用户暂无动物</div>
              ) : (
                <Table
                  columns={animalColumns}
                  dataSource={animals}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs items={tabItems} />
      <Modal
        title={viewingAnimal ? `${viewingAnimal.name} - 健康数据图表` : '健康数据图表'}
        open={isChartModalVisible}
        onCancel={() => setIsChartModalVisible(false)}
        footer={null}
        width={1200}
      >
        {viewingAnimal && <AnimalHealthChart animalId={viewingAnimal.id} />}
      </Modal>
    </>
  );
}
