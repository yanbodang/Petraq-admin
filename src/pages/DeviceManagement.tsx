import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, Tag, Popconfirm, message, InputNumber, Switch, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BluetoothOutlined, BatteryOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Device, User, PaymentType } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

const { Search } = Input;

export default function DeviceManagement() {
  const { translate } = useLocale();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();
  const [users] = useState<User[]>(dataManager.getUsers());

  useEffect(() => {
    updateDevices();
  }, []);

  const updateDevices = () => {
    const allDevices = dataManager.getDevices();
    setDevices(allDevices);
    setFilteredDevices(allDevices);
  };

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredDevices(devices);
      return;
    }
    const filtered = devices.filter(
      (device) =>
        device.code.toLowerCase().includes(value.toLowerCase()) ||
        device.id.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDevices(filtered);
  };

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({
      isActivated: false,
      isPaid: false,
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
      isPaid: device.isPaid,
      paymentType: device.paymentType,
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
      if (editingDevice) {
        const updated: Device = {
          ...editingDevice,
          ...values,
        };
        dataManager.updateDevice(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newDevice: Device = {
          id: `device-${Date.now()}`,
          code: values.code || `DEV${Date.now()}`,
          userId: values.userId,
          animalId: values.animalId,
          isActivated: values.isActivated || false,
          isPaid: values.isPaid || false,
          paymentType: values.paymentType,
          batteryLevel: values.batteryLevel || 100,
          isBluetoothConnected: values.isBluetoothConnected || false,
          createdAt: new Date(),
          lastSyncAt: values.isActivated ? new Date() : undefined,
        };
        dataManager.addDevice(newDevice);
        message.success(translate('添加成功', 'Added'));
      }
      setIsModalVisible(false);
      updateDevices();
    } catch (error) {
      console.error('Validation failed:', error);
    }
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
        const user = users.find((u) => u.id === userId);
        return user?.username || userId;
      },
    },
    {
      title: translate('激活状态', 'Activation'),
      dataIndex: 'isActivated',
      key: 'isActivated',
      render: (activated: boolean) => (
        <Tag color={activated ? 'green' : 'default'}>
          {activated ? translate('已激活', 'Activated') : translate('未激活', 'Inactive')}
        </Tag>
      ),
    },
    {
      title: translate('付费状态', 'Payment'),
      key: 'payment',
      render: (_: any, record: Device) => (
        <Space>
          <Tag color={record.isPaid ? 'green' : 'default'}>
            {record.isPaid ? translate('已付费', 'Paid') : translate('未付费', 'Unpaid')}
          </Tag>
          {record.paymentType && (
            <Tag>{record.paymentType}</Tag>
          )}
        </Space>
      ),
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
            <BatteryOutlined style={{ color }} />
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
        <Tag color={connected ? 'blue' : 'default'} icon={<BluetoothOutlined />}>
          {connected ? translate('已连接', 'Connected') : translate('未连接', 'Disconnected')}
        </Tag>
      ),
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
      render: (_: any, record: Device) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
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

  const userAnimals = users.flatMap((user) => {
    const animals = dataManager.getAnimalsByUser(user.id);
    return animals.map((animal) => ({ ...animal, userId: user.id, userName: user.username }));
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('设备管理', 'Device Management')}</h2>
        <Space>
          <Search
            placeholder={translate('搜索设备代码', 'Search device code')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {translate('添加设备', 'Add Device')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingDevice ? translate('编辑设备', 'Edit Device') : translate('添加设备', 'Add Device')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label={translate('设备代码', 'Device Code')}
            rules={[{ required: true, message: translate('请输入设备代码', 'Please enter device code') }]}
          >
            <Input placeholder={translate('请输入设备代码', 'Please enter device code')} />
          </Form.Item>
          <Form.Item
            name="userId"
            label={translate('所属用户', 'User')}
          >
            <Select placeholder={translate('请选择用户（可选）', 'Select user (optional)')} allowClear>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="animalId"
            label={translate('关联动物', 'Animal')}
          >
            <Select placeholder={translate('请选择动物（可选）', 'Select animal (optional)')} allowClear>
              {userAnimals.map((animal) => (
                <Select.Option key={animal.id} value={animal.id}>
                  {animal.userName} - {animal.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="isActivated"
            label={translate('是否激活', 'Activated')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isPaid"
            label={translate('是否付费', 'Paid')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="paymentType"
            label={translate('付费类型', 'Payment Type')}
          >
            <Select placeholder={translate('请选择付费类型', 'Please select payment type')} allowClear>
              {Object.values(PaymentType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="batteryLevel"
            label={translate('电量 (%)', 'Battery Level (%)')}
          >
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

