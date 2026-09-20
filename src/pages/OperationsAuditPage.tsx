import { Alert, Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { useRemoteGroupData } from '../hooks/useRemoteGroupData';
import { groupSyncService, SyncRun } from '../services/groupSyncService';

const statusColors: Record<string, string> = {
  completed: 'green', success: 'green', running: 'blue', pending: 'gold', failed: 'red',
};

export default function OperationsAuditPage() {
  const { currentUser, session } = useAuth();
  const { translate } = useLocale();
  const remote = useRemoteGroupData();
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const family = remote.families[0];

  useEffect(() => {
    if (!family?.id || !session?.token) return;
    setLoading(true);
    setError(null);
    groupSyncService.listSyncRuns(family.id, session.token)
      .then(setRuns)
      .catch((caught) => setError(caught instanceof Error ? caught.message : translate('读取同步记录失败', 'Failed to load sync history')))
      .finally(() => setLoading(false));
  }, [family?.id, session?.token, translate]);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>
          {currentUser?.role === 'super_admin' ? translate('运维审计', 'Operations Audit') : translate('家庭操作记录', 'Family Audit Log')}
        </Typography.Title>
        <Typography.Text type="secondary">{translate('显示后端实际执行的数据同步记录。', 'Backend data synchronization history.')}</Typography.Text>
      </div>

      {(remote.error || error) && <Alert type="error" showIcon message={translate('操作记录读取失败', 'Failed to load operations')} description={remote.error || error} />}

      <Card title={translate('数据同步记录', 'Data sync history')}>
        <Table
          rowKey="id"
          loading={remote.loading || loading}
          dataSource={runs}
          columns={[
            { title: translate('来源', 'Source'), dataIndex: 'source_type' },
            { title: translate('状态', 'Status'), dataIndex: 'status', render: (value: string) => <Tag color={statusColors[value] ?? 'default'}>{value}</Tag> },
            { title: translate('读取', 'Read'), dataIndex: 'records_read' },
            { title: translate('写入', 'Written'), dataIndex: 'records_written' },
            { title: translate('未匹配', 'Unmapped'), dataIndex: 'records_unmapped' },
            { title: translate('错误', 'Error'), dataIndex: 'error_message', render: (value?: string) => value || '-' },
            { title: translate('开始时间', 'Started'), dataIndex: 'started_at', render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss') },
            { title: translate('完成时间', 'Finished'), dataIndex: 'finished_at', render: (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-' },
          ]}
        />
      </Card>

      <Alert
        type="info"
        showIcon
        message={translate('告警与通用审计尚未接入', 'Alerts and general audit are not available yet')}
        description={translate('当前后端没有告警或通用操作日志表，因此本页不再展示浏览器内的模拟记录。', 'The backend has no alert or general audit-log store, so browser-only mock records are no longer displayed.')}
      />
    </Space>
  );
}
