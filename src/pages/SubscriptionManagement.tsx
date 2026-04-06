import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Card,
  DatePicker,
  Typography,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { dataManager } from '../services/dataManager';
import {
  Animal,
  AnimalSubscription,
  Device,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
} from '../types';

const statusColor: Record<string, string> = {
  待激活: 'default',
  'Trial中': 'gold',
  已付费: 'green',
  已过期: 'red',
};

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<AnimalSubscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<AnimalSubscription | null>(null);
  const [form] = Form.useForm();

  const selectedUserId = Form.useWatch('userId', form);
  const selectedAnimalId = Form.useWatch('animalId', form);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSubscriptions(dataManager.getSubscriptions());
    setUsers(dataManager.getUsers());
    setAnimals(dataManager.getAllAnimals());
    setDevices(dataManager.getDevices());
  };

  const animalOptions = useMemo(() => {
    if (!selectedUserId) {
      return animals;
    }
    return animals.filter((animal) => animal.userId === selectedUserId);
  }, [animals, selectedUserId]);

  const deviceOptions = useMemo(() => {
    if (selectedAnimalId) {
      return devices.filter(
        (device) => !device.animalId || device.animalId === selectedAnimalId || device.id === editingSubscription?.deviceId
      );
    }

    if (selectedUserId) {
      return devices.filter(
        (device) => !device.userId || device.userId === selectedUserId || device.id === editingSubscription?.deviceId
      );
    }

    return devices;
  }, [devices, selectedAnimalId, selectedUserId, editingSubscription]);

  const handleAdd = () => {
    setEditingSubscription(null);
    form.resetFields();
    form.setFieldsValue({
      status: SubscriptionStatus.TRIALING,
      plan: SubscriptionPlan.TRIAL,
      currentPeriodStart: dayjs(),
      currentPeriodEnd: dayjs().add(5, 'day'),
      trialEndsAt: dayjs().add(5, 'day'),
    });
    setIsModalVisible(true);
  };

  const handleEdit = (subscription: AnimalSubscription) => {
    setEditingSubscription(subscription);
    form.setFieldsValue({
      userId: subscription.userId,
      animalId: subscription.animalId,
      deviceId: subscription.deviceId,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart ? dayjs(subscription.currentPeriodStart) : undefined,
      currentPeriodEnd: subscription.currentPeriodEnd ? dayjs(subscription.currentPeriodEnd) : undefined,
      trialEndsAt: subscription.trialEndsAt ? dayjs(subscription.trialEndsAt) : undefined,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeSubscription(id);
    refreshData();
    message.success('订阅已删除');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const animal = dataManager.getAnimal(values.animalId);
      const userId = animal?.userId || values.userId;

      if (!userId) {
        message.error('请选择订阅所属用户');
        return;
      }

      const subscription: AnimalSubscription = {
        id: editingSubscription?.id || `subscription-${Date.now()}`,
        userId,
        animalId: values.animalId,
        deviceId: values.deviceId,
        plan: values.plan,
        status: values.status,
        createdAt: editingSubscription?.createdAt || new Date(),
        activatedAt: editingSubscription?.activatedAt || new Date(),
        currentPeriodStart: values.currentPeriodStart?.toDate(),
        currentPeriodEnd: values.currentPeriodEnd?.toDate(),
        trialEndsAt: values.trialEndsAt?.toDate(),
      };

      if (editingSubscription) {
        dataManager.updateSubscription(subscription);
        message.success('订阅已更新');
      } else {
        dataManager.addSubscription(subscription);
        message.success('订阅已创建');
      }

      setIsModalVisible(false);
      refreshData();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE).length,
    trialing: subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.TRIALING).length,
    expired: subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.EXPIRED).length,
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => users.find((user) => user.id === userId)?.username || userId,
    },
    {
      title: '动物',
      dataIndex: 'animalId',
      key: 'animalId',
      render: (animalId: string) => {
        const animal = dataManager.getAnimal(animalId);
        return animal ? `${animal.name} / ${animal.type}` : animalId;
      },
    },
    {
      title: '硬件',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (deviceId: string) => dataManager.getDevice(deviceId)?.code || deviceId,
    },
    {
      title: '套餐',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: SubscriptionPlan) => <Tag>{plan}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubscriptionStatus) => (
        <Tag color={statusColor[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: '周期',
      key: 'period',
      render: (_: unknown, record: AnimalSubscription) => {
        const start = record.currentPeriodStart ? dayjs(record.currentPeriodStart).format('YYYY-MM-DD') : '-';
        const end = record.trialEndsAt || record.currentPeriodEnd;
        return `${start} ~ ${end ? dayjs(end).format('YYYY-MM-DD') : '-'}`;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AnimalSubscription) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除这个订阅吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>动物订阅管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建订阅
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">总订阅数</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">已付费</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.active}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">Trial中</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.trialing}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">已过期</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.expired}</div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Paragraph style={{ margin: 0 }}>
          这里维护动物和硬件的 1:1 subscription 关系。设备激活后系统会先自动建一条 Trial，运营可在此升级为月付或年付，或手动标记过期。
        </Typography.Paragraph>
      </Card>

      <Table columns={columns} dataSource={subscriptions} rowKey="id" pagination={{ pageSize: 10 }} />

      <Modal
        title={editingSubscription ? '编辑订阅' : '新建订阅'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userId" label="所属用户">
            <Select allowClear placeholder="请选择用户">
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="animalId"
            label="所属动物"
            rules={[{ required: true, message: '请选择动物' }]}
          >
            <Select placeholder="请选择动物">
              {animalOptions.map((animal) => (
                <Select.Option key={animal.id} value={animal.id}>
                  {animal.name} / {animal.type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="deviceId"
            label="绑定硬件"
            rules={[{ required: true, message: '请选择硬件' }]}
          >
            <Select placeholder="请选择硬件">
              {deviceOptions.map((device) => (
                <Select.Option key={device.id} value={device.id}>
                  {device.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="plan"
            label="套餐"
            rules={[{ required: true, message: '请选择套餐' }]}
          >
            <Select>
              {Object.values(SubscriptionPlan).map((plan) => (
                <Select.Option key={plan} value={plan}>
                  {plan}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.values(SubscriptionStatus).map((status) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="currentPeriodStart" label="周期开始">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currentPeriodEnd" label="周期结束">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="trialEndsAt" label="Trial结束">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
