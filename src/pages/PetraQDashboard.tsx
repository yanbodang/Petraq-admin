import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { HeartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import {
  familyName,
  formatRelative,
  getScopedData,
  petName,
} from '../services/petraqAdminData';
import { localizeMockText } from '../services/textLocalization';

const stateColor = {
  online: 'green',
  recent: 'gold',
  offline: 'red',
};

export default function PetraQDashboard() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const role = currentUser?.role ?? 'family_admin';
  const data = getScopedData(role, currentUser?.familyId);

  const sharedPeople = data.humanHealth.filter((record) => record.sharedWithFamily).length;
  const sharedPets = data.pets.filter((pet) => pet.sharedWithFamily).length;

  const deviceStateLabel = (state: keyof typeof stateColor) => {
    const labels: Record<keyof typeof stateColor, string> = {
      online: translate('在线', 'Online'),
      recent: translate('最近在线', 'Recent'),
      offline: translate('离线', 'Offline'),
    };
    return labels[state];
  };

  const severityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      info: translate('信息', 'Info'),
      warning: translate('警告', 'Warning'),
      critical: translate('严重', 'Critical'),
    };
    return labels[severity] ?? severity;
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {role === 'super_admin'
            ? translate('平台概览', 'Platform Overview')
            : translate(`${data.families[0]?.name ?? '家庭'}概览`, `${data.families[0]?.name ?? 'Family'} Overview`)}
        </Typography.Title>
        <Typography.Text type="secondary">
          {role === 'super_admin'
            ? translate('查看 PetraQ 全平台用户、家庭、健康共享和告警状态。', 'Users, families, health sharing and alerts across PetraQ.')
            : translate('查看当前家庭成员、宠物和隐私授权。', 'Your family members, pets and privacy permissions.')}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('家庭', 'Families')} value={data.families.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('用户', 'Users')} value={data.users.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('共享人的健康', 'People sharing')} value={sharedPeople} prefix={<HeartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('共享宠物健康', 'Pets sharing')} value={sharedPets} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title={translate('家庭与宠物', 'Families and pets')}>
            <Table
              rowKey="id"
              pagination={false}
              dataSource={data.families}
              columns={[
                { title: translate('家庭', 'Family'), dataIndex: 'name' },
                { title: translate('地区', 'Region'), dataIndex: 'region', render: (value: string) => localizeMockText(value, translate) },
                { title: translate('成员', 'Members'), dataIndex: 'memberCount' },
                { title: translate('宠物', 'Pets'), dataIndex: 'petCount' },
                { title: translate('已共享宠物', 'Shared pets'), dataIndex: 'petCount' },
                {
                  title: translate('待处理告警', 'Open alerts'),
                  dataIndex: 'openAlerts',
                  render: (value: number) => <Tag color={value > 0 ? 'red' : 'green'}>{value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title={translate('最近健康更新', 'Recent health updates')}>
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={data.devices.slice(0, 6)}
              columns={[
                { title: translate('宠物', 'Pet'), dataIndex: 'petId', render: (value: string) => petName(value) },
                {
                  title: translate('数据状态', 'Data status'),
                  dataIndex: 'state',
                  render: (value: keyof typeof stateColor) => <Tag color={stateColor[value]}>{deviceStateLabel(value)}</Tag>,
                },
                {
                  title: translate('同步', 'Sync'),
                  dataIndex: 'lastSyncedAt',
                  render: (value: string) => formatRelative(value),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title={translate('待处理告警', 'Open alerts')}>
        <Table
          rowKey="id"
          pagination={false}
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
            {
              title: translate('创建时间', 'Created'),
              dataIndex: 'createdAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
