import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { SystemStats, User, SyncRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

export default function Dashboard() {
  const { translate } = useLocale();
  const [stats, setStats] = useState<SystemStats>(dataManager.getSystemStats());
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentSyncs, setRecentSyncs] = useState<SyncRecord[]>([]);
  const [userStatsData, setUserStatsData] = useState<any[]>([]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateData = () => {
    const newStats = dataManager.getSystemStats();
    setStats(newStats);

    const users = dataManager.getUsers();
    setRecentUsers(users.slice(0, 5));

    const syncs = dataManager.getSyncRecords();
    setRecentSyncs(syncs.slice(0, 5));

    // 用户统计图表数据
    const userStats = users.map((user) => ({
      name: user.username,
      animals: user.animalCount || 0,
    }));
    setUserStatsData(userStats);
  };

  const syncColumns = [
    {
      title: translate('时间', 'Time'),
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: translate('用户', 'User'),
      dataIndex: 'userId',
      key: 'userId',
      render: (id: string) => {
        const user = dataManager.getUser(id);
        return user?.username || id;
      },
    },
    {
      title: translate('类型', 'Type'),
      dataIndex: 'syncType',
      key: 'syncType',
    },
    {
      title: translate('方向', 'Direction'),
      dataIndex: 'syncDirection',
      key: 'syncDirection',
      render: (dir: string) => (
        <Tag color={dir === 'upload' ? 'blue' : 'green'}>
          {dir === 'upload' ? translate('上传', 'Upload') : translate('下载', 'Download')}
        </Tag>
      ),
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          成功: 'green',
          失败: 'red',
          进行中: 'blue',
          已取消: 'default',
        };
        const statusLabel: Record<string, string> = {
          成功: translate('成功', 'Success'),
          失败: translate('失败', 'Failed'),
          进行中: translate('进行中', 'Running'),
          已取消: translate('已取消', 'Cancelled'),
        };
        return <Tag color={colorMap[status] || 'default'}>{statusLabel[status] || status}</Tag>;
      },
    },
    {
      title: translate('记录数', 'Records'),
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number | undefined) => count || '-',
    },
  ];

  const userColumns = [
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
  ];

  const successRate = stats.todaySyncCount > 0
    ? ((stats.todaySyncCount - stats.failedSyncCount) / stats.todaySyncCount * 100).toFixed(1)
    : '100';

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{translate('系统概览', 'System Overview')}</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('总用户数', 'Total Users')}
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('活跃用户', 'Active Users')}
              value={stats.activeUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('总动物数', 'Total Animals')}
              value={stats.totalAnimals}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('组织数量', 'Organizations')}
              value={stats.totalOrganizations}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={12}>
          <Card title={translate('今日同步统计', 'Today Sync Stats')}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={translate('今日同步', 'Today Syncs')}
                  value={stats.todaySyncCount}
                  prefix={<SyncOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={translate('失败次数', 'Failures')}
                  value={stats.failedSyncCount}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>{translate('同步成功率', 'Sync Success Rate')}</div>
              <Progress
                percent={parseFloat(successRate)}
                status={parseFloat(successRate) >= 90 ? 'success' : 'exception'}
                format={() => `${successRate}%`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card title={translate('用户动物分布', 'Animals by User')} style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userStatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="animals" fill="#8884d8" name={translate('动物数量', 'Animals')} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="最近用户" style={{ height: 400 }}>
            <Table
              dataSource={recentUsers}
              columns={userColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近同步记录" style={{ height: 400 }}>
            <Table
              dataSource={recentSyncs}
              columns={syncColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
