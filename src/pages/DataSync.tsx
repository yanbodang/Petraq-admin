import { useState, useEffect } from 'react';
import { Table, Button, Select, Space, Tag, Card, Statistic, Row, Col, message, Modal, Radio } from 'antd';
import { SyncOutlined, ReloadOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { SyncRecord, SyncType, SyncStatus, User } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

export default function DataSync() {
  const { translate } = useLocale();
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
      message.warning(translate('请先选择用户', 'Please select user first'));
      return;
    }
    setIsSyncModalVisible(true);
  };

  const handleConfirmSync = () => {
    dataManager.triggerSync(selectedUserId, syncType, syncDirection);
    message.success(translate('同步任务已启动', 'Sync started'));
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
      title: translate('时间', 'Time'),
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: SyncRecord, b: SyncRecord) =>
        a.startTime.getTime() - b.startTime.getTime(),
    },
    {
      title: translate('用户', 'User'),
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
      title: translate('同步类型', 'Sync Type'),
      dataIndex: 'syncType',
      key: 'syncType',
      render: (type: string) => {
        const labelMap: Record<string, string> = {
          全量同步: translate('全量同步', 'Full Sync'),
          增量同步: translate('增量同步', 'Incremental Sync'),
          手动同步: translate('手动同步', 'Manual Sync'),
        };
        return <Tag color={getSyncTypeColor(type)}>{labelMap[type] || type}</Tag>;
      },
      filters: Object.values(SyncType).map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value: any, record: SyncRecord) => record.syncType === value,
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
      filters: [
        { text: translate('上传', 'Upload'), value: 'upload' },
        { text: translate('下载', 'Download'), value: 'download' },
      ],
      onFilter: (value: any, record: SyncRecord) => record.syncDirection === value,
    },
    {
      title: translate('状态', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {{
            成功: translate('成功', 'Success'),
            失败: translate('失败', 'Failed'),
            进行中: translate('进行中', 'Running'),
            已取消: translate('已取消', 'Cancelled'),
          }[status] || status}
        </Tag>
      ),
      filters: Object.values(SyncStatus).map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value: any, record: SyncRecord) => record.status === value,
    },
    {
      title: translate('记录数', 'Records'),
      dataIndex: 'recordCount',
      key: 'recordCount',
      render: (count: number | undefined) => count || '-',
    },
    {
      title: translate('耗时', 'Duration'),
      key: 'duration',
      render: (_: any, record: SyncRecord) => {
        if (!record.endTime) return '-';
        const duration = (record.endTime.getTime() - record.startTime.getTime()) / 1000;
        return `${duration.toFixed(1)}秒`;
      },
    },
    {
      title: translate('错误信息', 'Error Message'),
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
        <h2 style={{ margin: 0 }}>{translate('数据同步管理', 'Data Sync')}</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder={translate('筛选用户', 'Filter user')}
            value={selectedUserId}
            onChange={setSelectedUserId}
            allowClear
            options={[
              { label: translate('全部用户', 'All users'), value: '' },
              ...users.map((user) => ({
                label: user.username,
                value: user.id,
              })),
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={updateSyncRecords}>
            {translate('刷新', 'Refresh')}
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleSync}
            disabled={!selectedUserId}
          >
            {translate('触发同步', 'Trigger Sync')}
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('总同步次数', 'Total Syncs')} value={stats.total} prefix={<SyncOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('成功', 'Success')}
              value={stats.success}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DownloadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('失败', 'Failed')}
              value={stats.failed}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UploadOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('成功率', 'Success Rate')} value={successRate} suffix="%" />
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
        title={translate('触发数据同步', 'Start Data Sync')}
        open={isSyncModalVisible}
        onOk={handleConfirmSync}
        onCancel={() => setIsSyncModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>{translate('用户', 'User')}：</strong>
            {users.find((u) => u.id === selectedUserId)?.username}
          </div>
          <div>
            <strong>{translate('同步类型', 'Sync Type')}：</strong>
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
            <strong>{translate('同步方向', 'Direction')}：</strong>
            <Radio.Group
              value={syncDirection}
              onChange={(e) => setSyncDirection(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <Radio value="upload">{translate('上传（App → 服务器）', 'Upload (App → Server)')}</Radio>
              <Radio value="download">{translate('下载（服务器 → App）', 'Download (Server → App)')}</Radio>
            </Radio.Group>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
