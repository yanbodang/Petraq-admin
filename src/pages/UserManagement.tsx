import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { User, UserRole, UserStatus } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

const { Search } = Input;

export default function UserManagement() {
  const { translate } = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    updateUsers();
  }, []);

  const updateUsers = () => {
    const allUsers = dataManager.getUsers();
    setUsers(allUsers);
    setFilteredUsers(allUsers);
  };

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredUsers(users);
      return;
    }
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(value.toLowerCase()) ||
        user.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeUser(id);
    updateUsers();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const updated: User = {
          ...editingUser,
          ...values,
        };
        dataManager.updateUser(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newUser: User = {
          id: `user-${Date.now()}`,
          username: values.username,
          email: values.email,
          phone: values.phone,
          role: values.role,
          status: values.status,
          createdAt: new Date(),
          animalCount: 0,
          organizationId: values.organizationId,
        };
        dataManager.addUser(newUser);
        message.success(translate('添加成功', 'Added'));
      }
      setIsModalVisible(false);
      updateUsers();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: translate('用户名', 'Username'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: translate('邮箱', 'Email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: translate('手机', 'Phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | undefined) => phone || '-',
    },
    {
      title: translate('角色', 'Role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          管理员: 'red',
          普通用户: 'blue',
          查看者: 'default',
        };
        const roleLabel: Record<string, string> = {
          管理员: translate('管理员', 'Admin'),
          普通用户: translate('普通用户', 'User'),
          查看者: translate('查看者', 'Viewer'),
        };
        return <Tag color={colorMap[role] || 'default'}>{roleLabel[role] || role}</Tag>;
      },
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          活跃: 'green',
          禁用: 'red',
          待激活: 'orange',
        };
        const statusLabel: Record<string, string> = {
          活跃: translate('活跃', 'Active'),
          禁用: translate('禁用', 'Disabled'),
          待激活: translate('待激活', 'Pending'),
        };
        return <Tag color={colorMap[status] || 'default'}>{statusLabel[status] || status}</Tag>;
      },
    },
    {
      title: translate('动物数量', 'Animals'),
      dataIndex: 'animalCount',
      key: 'animalCount',
      render: (count: number | undefined) => count || 0,
    },
    {
      title: translate('创建时间', 'Created At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这个用户吗？删除后该用户下的所有动物数据也将被删除。', 'Delete this user? Animals under the user will also be removed.')}
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

  const organizations = dataManager.getOrganizations();

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('用户管理', 'User Management')}</h2>
        <Space>
          <Search
            placeholder={translate('搜索用户名或邮箱', 'Search username or email')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {translate('添加用户', 'Add User')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? translate('编辑用户', 'Edit User') : translate('添加用户', 'Add User')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label={translate('用户名', 'Username')}
            rules={[{ required: true, message: translate('请输入用户名', 'Please enter username') }]}
          >
            <Input placeholder={translate('请输入用户名', 'Please enter username')} />
          </Form.Item>
          <Form.Item
            name="email"
            label={translate('邮箱', 'Email')}
            rules={[
              { required: true, message: translate('请输入邮箱', 'Please enter email') },
              { type: 'email', message: translate('请输入有效的邮箱地址', 'Enter a valid email') },
            ]}
          >
            <Input placeholder={translate('请输入邮箱', 'Please enter email')} />
          </Form.Item>
          <Form.Item
            name="phone"
            label={translate('手机号', 'Phone')}
          >
            <Input placeholder={translate('请输入手机号', 'Please enter phone')} />
          </Form.Item>
          <Form.Item
            name="role"
            label={translate('角色', 'Role')}
            rules={[{ required: true, message: translate('请选择角色', 'Please select role') }]}
          >
            <Select placeholder={translate('请选择角色', 'Please select role')}>
              {Object.values(UserRole).map((role) => (
                <Select.Option key={role} value={role}>
                  {role}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label={translate('状态', 'Status')}
            rules={[{ required: true, message: translate('请选择状态', 'Please select status') }]}
          >
            <Select placeholder={translate('请选择状态', 'Please select status')}>
              {Object.values(UserStatus).map((status) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="organizationId"
            label={translate('所属组织', 'Organization')}
          >
            <Select placeholder={translate('请选择组织（可选）', 'Select organization (optional)')} allowClear>
              {organizations.map((org) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
