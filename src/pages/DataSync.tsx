import { useState, useEffect } from 'react';
import { Table, Button, Select, Space, Tag, Card, Statistic, Row, Col, message, Modal, Radio } from 'antd';
import { SyncOutlined, ReloadOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { SyncRecord, SyncType, SyncStatus, User } from '../types';
import dayjs from 'dayjs';

export default function DataSync() {
  const [syncRecords, setSyncRecords] = useState<SyncRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSyncModalVisible, setIsSyncModalVisible] = useState(false);
  const [syncType, setSyncType] = useState<SyncType>(SyncType.INCREMENTAL);
  const [syncDirection, setSyncDirection] = useState<'upload' | 'download'>('upload');

  useEffect(() => {
    const allUsers = dataManager.getUsers();
    setUsers(allUsers);
    updateSyncRecords();
  }, []);

  useEffect(() => {
    updateSyncRecords();
    const interval = setInterval(updateSyncRecords, 3000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const updateSyncRecords = () => {
    const records = selectedUserId
      ? dataManager.getSyncRecords(selectedUserId)
      : dataManager.getSyncRecords();
    setSyncRecords(records.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
  };

  const handleSync = () => {
    if (!selectedUserId) {
      message.warning('请先选择用户');
      return;
    }
    setIsSyncModalVisible(true);
  };

  const handleConfirmSync = () => {
    dataManager.triggerSync(selectedUserId, syncType, syncDirection);
    message.success('同步任务已启动');
    setIsSyncModalVisible(false);
    updateSyncRecords();
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      成功: 'green',
      失败: 'red',
      进行中: 'blue',
      已取消: 'default',
    };
    return colorMap[status] || 'default';
  };

  const getSyncTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      全量同步: 'purple',
      增量同步: 'blue',
      手动同步: 'orange',
    };
    return colorMap[type] || 'default';
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: SyncRecord, b: SyncRecord) =>
        a.startTime.getTime() - b.startTime.getTime(),
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (id: string) => {
        const user = dataManager.getUser(id);
        return user?.username || id;
      },
      filters: users.map((user) => ({
        text: user.username,
        value: user.id,
      })),
      onFilter: (value: any, record: SyncRecord) => record.userId === value,
    },
    {
      title: '同步类型',
      dataIndex: 'syncType',
      key: 'syncType',
      render: (type: string) => (
        <Tag color={getSyncTypeColor(type)}>{type}</Tag>
      ),
      filters: Object.values(SyncType).map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value: any, record: SyncRecord) => record.syncType === value,
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
      filters: [
        { text: '上传', value: 'upload' },
        { text: '下载', value: 'download' },
      ],
      onFilter: (value: any, record: SyncRecord) => record.syncDirection === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: Object.values(SyncStatus).map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value: any, record: SyncRecord) => record.status === value,
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number | undefined) => count || '-',
    },
    {
      title: '耗时',
      key: 'duration',
      render: (_: any, record: SyncRecord) => {
        if (!record.endTime) return '-';
        const duration = (record.endTime.getTime() - record.startTime.getTime()) / 1000;
        return `${duration.toFixed(1)}秒`;
      },
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (msg: string | undefined) => msg || '-',
      ellipsis: true,
    },
  ];

  const stats = {
    total: syncRecords.length,
    success: syncRecords.filter((r) => r.status === SyncStatus.SUCCESS).length,
    failed: syncRecords.filter((r) => r.status === SyncStatus.FAILED).length,
    pending: syncRecords.filter((r) => r.status === SyncStatus.PENDING).length,
  };

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>数据同步管理</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="筛选用户"
            value={selectedUserId}
            onChange={setSelectedUserId}
            allowClear
            options={[
              { label: '全部用户', value: '' },
              ...users.map((user) => ({
                label: user.username,
                value: user.id,
              })),
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={updateSyncRecords}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleSync}
            disabled={!selectedUserId}
          >
            触发同步
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总同步次数" value={stats.total} prefix={<SyncOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功"
              value={stats.success}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="失败"
              value={stats.failed}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UploadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="成功率" value={successRate} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={syncRecords}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="触发数据同步"
        open={isSyncModalVisible}
        onOk={handleConfirmSync}
        onCancel={() => setIsSyncModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>用户：</strong>
            {users.find((u) => u.id === selectedUserId)?.username}
          </div>
          <div>
            <strong>同步类型：</strong>
            <Radio.Group
              value={syncType}
              onChange={(e) => setSyncType(e.target.value)}
              style={{ marginTop: 8 }}
            >
              {Object.values(SyncType).map((type) => (
                <Radio key={type} value={type}>
                  {type}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <div>
            <strong>同步方向：</strong>
            <Radio.Group
              value={syncDirection}
              onChange={(e) => setSyncDirection(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <Radio value="upload">上传（App → 服务器）</Radio>
              <Radio value="download">下载（服务器 → App）</Radio>
            </Radio.Group>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
