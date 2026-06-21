import { Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { familyName, getScopedData, petName } from '../services/petraqAdminData';
import { localizeMockText } from '../services/textLocalization';

export default function OperationsAuditPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const role = currentUser?.role ?? 'family_admin';
  const data = getScopedData(role, currentUser?.familyId);

  const severityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      info: translate('信息', 'Info'),
      warning: translate('警告', 'Warning'),
      critical: translate('严重', 'Critical'),
    };
    return labels[severity] ?? severity;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: translate('待处理', 'Open'),
      acknowledged: translate('已确认', 'Acknowledged'),
      resolved: translate('已解决', 'Resolved'),
    };
    return labels[status] ?? status;
  };

  const scopeLabel = (scope: string) => {
    return scope === 'super_admin' ? translate('超级管理员', 'Super Admin') : translate('家庭管理员', 'Family Admin');
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>
          {role === 'super_admin' ? translate('运维审计', 'Operations Audit') : translate('家庭操作记录', 'Family Audit Log')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {translate(
            '用于追踪告警、操作行为、设备同步状态和权限变更。',
            'Alerts, operator actions, device sync status, and permission changes for traceability.'
          )}
        </Typography.Text>
      </div>

      <Card title={translate('待处理告警', 'Open alerts')}>
        <Table
          rowKey="id"
          dataSource={data.alerts}
          columns={[
            {
              title: translate('家庭', 'Family'),
              dataIndex: 'familyId',
              render: (value: string) => familyName(value),
            },
            {
              title: translate('宠物', 'Pet'),
              dataIndex: 'petId',
              render: (value?: string) => petName(value),
            },
            {
              title: translate('级别', 'Severity'),
              dataIndex: 'severity',
              render: (value: string) => <Tag color={value === 'critical' ? 'red' : 'gold'}>{severityLabel(value)}</Tag>,
            },
            { title: translate('消息', 'Message'), dataIndex: 'message', render: (value: string) => localizeMockText(value, translate) },
            { title: translate('状态', 'Status'), dataIndex: 'status', render: (value: string) => statusLabel(value) },
            {
              title: translate('创建时间', 'Created'),
              dataIndex: 'createdAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Card>

      <Card title={translate('审计日志', 'Audit log')}>
        <Table
          rowKey="id"
          dataSource={data.audits}
          columns={[
            { title: translate('操作人', 'Actor'), dataIndex: 'actor' },
            {
              title: translate('范围', 'Scope'),
              dataIndex: 'scope',
              render: (value: string) => <Tag color={value === 'super_admin' ? 'purple' : 'blue'}>{scopeLabel(value)}</Tag>,
            },
            { title: translate('动作', 'Action'), dataIndex: 'action', render: (value: string) => localizeMockText(value, translate) },
            { title: translate('对象', 'Target'), dataIndex: 'target', render: (value: string) => localizeMockText(value, translate) },
            {
              title: translate('时间', 'Time'),
              dataIndex: 'createdAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
