import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  Popconfirm,
  message,
  InputNumber,
  Switch,
  Progress,
  Row,
  Col,
  Card,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  WifiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Device, User, SubscriptionStatus } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

const { Search } = Input;

const subscriptionStatusColor: Record<string, string> = {
  待激活: 'default',
  'Trial中': 'gold',
  已付费: 'green',
  已过期: 'red',
};

export default function DeviceManagement() {
  const { translate } = useLocale();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    updateDevices();
  }, []);

  const animals = useMemo(() => dataManager.getAllAnimals(), [devices]);

  const updateDevices = () => {
    const allDevices = dataManager.getDevices();
    setDevices(allDevices);
    setFilteredDevices(allDevices);
    setUsers(dataManager.getUsers());
  };

  const getSubscription = (device: Device) => {
    if (device.subscriptionId) {
      return dataManager.getSubscription(device.subscriptionId);
    }
    if (device.animalId) {
      return dataManager.getSubscriptionByAnimal(device.animalId);
    }
    return undefined;
  };

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredDevices(devices);
      return;
    }

    const keyword = value.toLowerCase();
    const filtered = devices.filter((device) => {
      const animal = device.animalId ? dataManager.getAnimal(device.animalId) : undefined;
      return (
        device.code.toLowerCase().includes(keyword) ||
        device.id.toLowerCase().includes(keyword) ||
        animal?.name.toLowerCase().includes(keyword)
      );
    });
    setFilteredDevices(filtered);
  };

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({
      isActivated: false,
      batteryLevel: 100,
      isBluetoothConnected: false,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue({
      code: device.code,
      userId: device.userId,
      animalId: device.animalId,
      isActivated: device.isActivated,
      batteryLevel: device.batteryLevel,
      isBluetoothConnected: device.isBluetoothConnected,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeDevice(id);
    updateDevices();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const baseDevice: Device = {
        id: editingDevice?.id || `device-${Date.now()}`,
        code: values.code || `DEV${Date.now()}`,
        userId: values.userId,
        animalId: values.animalId,
        isActivated: values.isActivated || false,
        isPaid: editingDevice?.isPaid || false,
        paymentType: editingDevice?.paymentType,
        subscriptionId: editingDevice?.subscriptionId,
        batteryLevel: values.batteryLevel || 100,
        isBluetoothConnected: values.isBluetoothConnected || false,
        createdAt: editingDevice?.createdAt || new Date(),
        lastSyncAt: values.isActivated ? new Date() : undefined,
        activationDate: values.isActivated ? (editingDevice?.activationDate || new Date()) : undefined,
      };

      if (editingDevice) {
        dataManager.updateDevice(baseDevice);
        message.success(translate('更新成功', 'Updated'));
      } else {
        dataManager.addDevice(baseDevice);
        message.success(translate('添加成功', 'Added'));
      }

      setIsModalVisible(false);
      updateDevices();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const deviceStats = {
    total: devices.length,
    activated: devices.filter((device) => device.isActivated).length,
    trialing: devices.filter((device) => getSubscription(device)?.status === SubscriptionStatus.TRIALING).length,
    paid: devices.filter((device) => getSubscription(device)?.status === SubscriptionStatus.ACTIVE).length,
  };

  const columns = [
    {
      title: translate('设备代码', 'Device Code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: translate('用户', 'User'),
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string | undefined) => {
        if (!userId) return '-';
        const user = users.find((item) => item.id === userId);
        return user?.username || userId;
      },
    },
    {
      title: translate('关联动物', 'Animal'),
      dataIndex: 'animalId',
      key: 'animalId',
      render: (animalId: string | undefined) => {
        if (!animalId) return '-';
        const animal = dataManager.getAnimal(animalId);
        return animal ? `${animal.name} / ${animal.type}` : animalId;
      },
    },
    {
      title: translate('激活状态', 'Activation'),
      dataIndex: 'isActivated',
      key: 'isActivated',
      render: (activated: boolean, record: Device) => (
        <Space direction="vertical" size={4}>
          <Tag color={activated ? 'green' : 'default'}>
            {activated ? translate('已激活', 'Activated') : translate('未激活', 'Inactive')}
          </Tag>
          {record.activationDate && (
            <Typography.Text type="secondary">
              {dayjs(record.activationDate).format('YYYY-MM-DD')}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: translate('订阅状态', 'Subscription'),
      key: 'subscription',
      render: (_: unknown, record: Device) => {
        const subscription = getSubscription(record);
        if (!subscription) {
          return <Tag>{translate('未创建', 'Not Created')}</Tag>;
        }

        const endTime = subscription.trialEndsAt || subscription.currentPeriodEnd;
        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Tag color={subscriptionStatusColor[subscription.status] || 'default'}>
                {subscription.status}
              </Tag>
              <Tag>{subscription.plan}</Tag>
            </Space>
            <Typography.Text type="secondary">
              {endTime ? dayjs(endTime).format('YYYY-MM-DD HH:mm') : translate('无周期结束时间', 'No end date')}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: translate('电量', 'Battery'),
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (level: number | undefined) => {
        if (level === undefined) return '-';
        const color = level > 50 ? 'green' : level > 20 ? 'orange' : 'red';
        return (
          <Space>
            <ThunderboltOutlined style={{ color }} />
            <Progress percent={level} size="small" status={level < 20 ? 'exception' : 'active'} />
            <span>{level}%</span>
          </Space>
        );
      },
    },
    {
      title: translate('蓝牙连接', 'Bluetooth'),
      dataIndex: 'isBluetoothConnected',
      key: 'isBluetoothConnected',
      render: (connected: boolean | undefined) => (
        <Tag color={connected ? 'blue' : 'default'} icon={<WifiOutlined />}>
          {connected ? translate('已连接', 'Connected') : translate('未连接', 'Disconnected')}
        </Tag>
      ),
    },
    {
      title: translate('最后同步', 'Last Sync'),
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      render: (date: Date | undefined) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: unknown, record: Device) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这个设备吗？', 'Delete this device?')}
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('设备管理', 'Device Management')}</h2>
        <Space>
          <Search
            placeholder={translate('搜索设备代码或动物名', 'Search device or animal')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 260 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {translate('添加设备', 'Add Device')}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">{translate('设备总数', 'Total Devices')}</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{deviceStats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">{translate('已激活', 'Activated')}</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{deviceStats.activated}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">{translate('Trial中', 'Trialing')}</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{deviceStats.trialing}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Typography.Text type="secondary">{translate('已付费', 'Paid')}</Typography.Text>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{deviceStats.paid}</div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Paragraph style={{ margin: 0 }}>
          设备一旦激活并绑定动物，mock 管理层会自动为该动物创建一条 5 天 Trial subscription。
          后续月付和年付统一在订阅管理页调整，设备页只负责绑定与激活状态。
        </Typography.Paragraph>
      </Card>

      <Table columns={columns} dataSource={filteredDevices} rowKey="id" pagination={{ pageSize: 10 }} />

      <Modal
        title={editingDevice ? translate('编辑设备', 'Edit Device') : translate('添加设备', 'Add Device')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label={translate('设备代码', 'Device Code')}
            rules={[{ required: true, message: translate('请输入设备代码', 'Please enter device code') }]}
          >
            <Input placeholder={translate('请输入设备代码', 'Please enter device code')} />
          </Form.Item>
          <Form.Item name="userId" label={translate('所属用户', 'User')}>
            <Select placeholder={translate('请选择用户（可选）', 'Select user (optional)')} allowClear>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="animalId" label={translate('关联动物', 'Animal')}>
            <Select placeholder={translate('请选择动物（可选）', 'Select animal (optional)')} allowClear>
              {animals.map((animal) => (
                <Select.Option key={animal.id} value={animal.id}>
                  {animal.name} / {animal.type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActivated" label={translate('是否激活', 'Activated')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="batteryLevel" label={translate('电量 (%)', 'Battery Level (%)')}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isBluetoothConnected"
            label={translate('蓝牙连接', 'Bluetooth Connected')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
