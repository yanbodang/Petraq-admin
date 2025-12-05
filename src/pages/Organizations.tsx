import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, Popconfirm, message, Card, Statistic, Row, Col, Descriptions, Tabs, Progress, Badge, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, HeartOutlined, WarningOutlined, ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Organization, Animal, AnimalHealthStatus, HealthAlert } from '../types';
import dayjs from 'dayjs';
import AnimalHealthChart from '../components/AnimalHealthChart';
import { useLocale } from '../i18n';

export default function Organizations() {
  const { translate } = useLocale();
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
    message.success(translate('删除成功', 'Deleted'));
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
        message.success(translate('更新成功', 'Updated'));
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
        message.success(translate('添加成功', 'Added'));
      }
      setIsModalVisible(false);
      updateOrganizations();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: translate('组织名称', 'Organization'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: translate('描述', 'Description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: translate('用户数', 'Users'),
      dataIndex: 'userCount',
      key: 'userCount',
    },
    {
      title: translate('动物数', 'Animals'),
      dataIndex: 'animalCount',
      key: 'animalCount',
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? translate('活跃', 'Active') : translate('禁用', 'Disabled')}
        </Tag>
      ),
    },
    {
      title: translate('创建时间', 'Created At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: Organization) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            {translate('查看详情', 'View Details')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这个组织吗？删除后该组织下的用户将移出组织。', 'Delete this organization? Users will be removed from it.')}
            onConfirm={() => handleDelete(record.id)}
            okText={translate('确定', 'Confirm')}
            cancelText={translate('取消', 'Cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {translate('删除', 'Delete')}
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
        <h2 style={{ margin: 0 }}>{translate('组织管理', 'Organizations')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {translate('添加组织', 'Add Organization')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('组织总数', 'Total Orgs')} value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('活跃组织', 'Active Orgs')} value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('总用户数', 'Total Users')} value={stats.totalUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('总动物数', 'Total Animals')} value={stats.totalAnimals} />
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
                    <Card title={translate('组织用户', 'Org Users')} size="small">
                      {orgUsers.length === 0 ? (
                        <div>{translate('暂无用户', 'No users')}</div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {orgUsers.map((user) => (
                            <div key={user.id}>
                              <Tag>{user.username}</Tag>
                              <span style={{ marginLeft: 8, color: '#666' }}>
                                ({translate('动物', 'Animals')}: {user.animalCount || 0})
                              </span>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title={translate('动物类型分布', 'Animal Types')} size="small">
                      {Object.keys(animalsByType).length === 0 ? (
                        <div>{translate('暂无动物', 'No animals')}</div>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {Object.entries(animalsByType).map(([type, count]) => (
                            <div key={type}>
                              <Tag color="blue">{type}</Tag>
                              <span style={{ marginLeft: 8 }}>{count}</span>
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
        title={editingOrg ? translate('编辑组织', 'Edit Organization') : translate('添加组织', 'Add Organization')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={translate('组织名称', 'Organization Name')}
            rules={[{ required: true, message: translate('请输入组织名称', 'Please enter organization name') }]}
          >
            <Input placeholder={translate('请输入组织名称', 'Please enter organization name')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={translate('描述', 'Description')}
          >
            <Input.TextArea placeholder={translate('请输入组织描述', 'Please enter description')} rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label={translate('状态', 'Status')}
            initialValue="active"
          >
            <Input placeholder={translate('状态', 'Status')} disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${viewingOrg?.name} - ${translate('详细信息', 'Details')}`}
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
  const { translate } = useLocale();
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
      title: translate('创建时间', 'Created At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: Animal) => (
        <Button
          type="link"
          icon={<LineChartOutlined />}
          onClick={() => handleViewAnimalChart(record)}
        >
          {translate('健康数据', 'Health Data')}
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
      title: translate('动物名称', 'Animal'),
      dataIndex: 'animalName',
      key: 'animalName',
    },
    {
      title: translate('健康评分', 'Health Score'),
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
          <Tag color={getHealthScoreColor(score)}>
            {score >= 80 ? translate('健康', 'Healthy') : score >= 60 ? translate('注意', 'Warning') : translate('异常', 'Critical')}
          </Tag>
        </div>
      ),
      sorter: (a: AnimalHealthStatus, b: AnimalHealthStatus) => a.latestHealthScore - b.latestHealthScore,
    },
    {
      title: translate('心率', 'Heart Rate'),
      dataIndex: 'latestHeartRate',
      key: 'latestHeartRate',
      render: (rate: number | undefined) => rate ? `${rate.toFixed(0)} bpm` : '-',
    },
    {
      title: translate('体温', 'Temperature'),
      dataIndex: 'latestTemperature',
      key: 'latestTemperature',
      render: (temp: number | undefined) => temp ? `${temp.toFixed(1)}°C` : '-',
    },
    {
      title: translate('活动量', 'Activity'),
      dataIndex: 'latestActivity',
      key: 'latestActivity',
      render: (activity: number | undefined) => activity ? `${activity.toFixed(0)}%` : '-',
    },
    {
      title: translate('预警数', 'Alerts'),
      dataIndex: 'alertCount',
      key: 'alertCount',
      render: (count: number) => (
        <Badge count={count} showZero={false}>
          <span>{count > 0 ? count : '-'}</span>
        </Badge>
      ),
    },
    {
      title: translate('更新时间', 'Updated At'),
      dataIndex: 'lastUpdateTime',
      key: 'lastUpdateTime',
      render: (date: Date) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: translate('操作', 'Actions'),
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
            {translate('查看图表', 'View Chart')}
          </Button>
        );
      },
    },
  ];

  const alertColumns = [
    {
      title: translate('时间', 'Time'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: translate('动物', 'Animal'),
      dataIndex: 'animalId',
      key: 'animalId',
      render: (id: string) => {
        const animal = orgAnimals.find((a) => a.id === id);
        return animal?.name || id;
      },
    },
    {
      title: translate('类型', 'Type'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: translate('严重程度', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const severityMap: Record<string, string> = {
          low: translate('轻微', 'Low'),
          medium: translate('中等', 'Medium'),
          high: translate('严重', 'High'),
          critical: translate('紧急', 'Critical'),
        };
        return <Tag color={getSeverityColor(severity)}>{severityMap[severity] || severity}</Tag>;
      },
    },
    {
      title: translate('消息', 'Message'),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: translate('概览', 'Overview'),
      children: (
        <div>
          <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label={translate('组织名称', 'Organization')}>{organization.name}</Descriptions.Item>
            <Descriptions.Item label={translate('状态', 'Status')}>
              <Tag color={organization.status === 'active' ? 'green' : 'red'}>
                {organization.status === 'active' ? translate('活跃', 'Active') : translate('禁用', 'Disabled')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={translate('描述', 'Description')} span={2}>
              {organization.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={translate('用户数', 'Users')}>{orgUsers.length}</Descriptions.Item>
            <Descriptions.Item label={translate('动物数', 'Animals')}>{orgAnimals.length}</Descriptions.Item>
            <Descriptions.Item label={translate('创建时间', 'Created At')} span={2}>
              {dayjs(organization.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title={translate('平均健康评分', 'Avg Health Score')}
                  value={healthStats.avgScore.toFixed(1)}
                  suffix="/ 100"
                  valueStyle={{ color: getHealthScoreColor(healthStats.avgScore) }}
                  prefix={<HeartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title={translate('健康', 'Healthy')} value={healthStats.healthy} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title={translate('注意', 'Warning')} value={healthStats.warning} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={translate('异常', 'Critical')}
                  value={healthStats.critical}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {healthStats.totalAlerts > 0 && (
              <Alert
                message={translate(`有 ${healthStats.totalAlerts} 条未读预警`, `${healthStats.totalAlerts} unread alerts`)}
                type="warning"
                icon={<WarningOutlined />}
                style={{ flex: 1, marginRight: 16 }}
              />
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={updateHealthData}
            >
              {translate('刷新健康数据', 'Refresh Health Data')}
            </Button>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Card title={translate('动物类型分布', 'Animal Types')} size="small">
                {Object.keys(animalsByType).length === 0 ? (
                  <div>{translate('暂无动物', 'No animals')}</div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(animalsByType).map(([type, count]) => (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color="blue">{type}</Tag>
                        <span>{count}</span>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title={translate('用户列表', 'Users')} size="small">
                {orgUsers.length === 0 ? (
                  <div>{translate('暂无用户', 'No users')}</div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {orgUsers.map((user) => (
                      <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Tag>{user.username}</Tag>
                          <span style={{ marginLeft: 8, color: '#666' }}>{user.email}</span>
                        </div>
                        <span>{user.animalCount || 0}</span>
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
          {translate('健康状态', 'Health Status')}
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
              {translate('刷新数据', 'Refresh')}
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
          {translate('健康预警', 'Health Alerts')}
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
              {translate('刷新数据', 'Refresh')}
            </Button>
          </div>
          {alerts.length === 0 ? (
            <Alert message={translate('暂无预警', 'No alerts')} type="success" />
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
      label: `${translate('所有动物', 'All Animals')} (${orgAnimals.length})`,
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
      label: translate('按用户查看', 'By User'),
      children: (
        <div>
          {animalsByUser.map(({ user, animals }) => (
            <Card
              key={user.id}
              title={
                <Space>
                  <span>{user.username}</span>
                  <Tag>{user.email}</Tag>
                  <Tag color="blue">{translate('动物', 'Animals')}: {animals.length}</Tag>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {animals.length === 0 ? (
                <div>{translate('该用户暂无动物', 'No animals for this user')}</div>
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
