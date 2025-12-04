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

export default function Dashboard() {
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
      title: '时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (id: string) => {
        const user = dataManager.getUser(id);
        return user?.username || id;
      },
    },
    {
      title: '类型',
      dataIndex: 'syncType',
      key: 'syncType',
    },
    {
      title: '方向',
      dataIndex: 'syncDirection',
      key: 'syncDirection',
      render: (dir: string) => (
        <Tag color={dir === 'upload' ? 'blue' : 'green'}>
          {dir === 'upload' ? '上传' : '下载'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          成功: 'green',
          失败: 'red',
          进行中: 'blue',
          已取消: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number | undefined) => count || '-',
    },
  ];

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          管理员: 'red',
          普通用户: 'blue',
          查看者: 'default',
        };
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          活跃: 'green',
          禁用: 'red',
          待激活: 'orange',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '动物数量',
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
      <h2 style={{ marginBottom: 24 }}>系统概览</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总动物数"
              value={stats.totalAnimals}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="组织数量"
              value={stats.totalOrganizations}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={12}>
          <Card title="今日同步统计">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="今日同步"
                  value={stats.todaySyncCount}
                  prefix={<SyncOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="失败次数"
                  value={stats.failedSyncCount}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>同步成功率</div>
              <Progress
                percent={parseFloat(successRate)}
                status={parseFloat(successRate) >= 90 ? 'success' : 'exception'}
                format={() => `${successRate}%`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card title="用户动物分布" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userStatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="animals" fill="#8884d8" name="动物数量" />
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
