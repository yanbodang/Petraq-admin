import { Alert, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { HeartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { useRemoteGroupData } from '../hooks/useRemoteGroupData';
import {
  Device,
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
  const remote = useRemoteGroupData({ includeHealth: true });
  const remoteFamily = remote.families.find((family) => family.id === currentUser?.familyId) ?? remote.families[0];
  const familyRows = remote.families.length
    ? remote.families.map((family) => ({
        ...family,
        memberCount: family.id === remoteFamily?.id ? remote.snapshot?.members.length ?? family.memberCount : family.memberCount,
        petCount: family.id === remoteFamily?.id ? remote.snapshot?.pets.length ?? family.petCount : family.petCount,
      }))
    : data.families;

  const sharedPeople = remote.snapshot
    ? remote.snapshot.members.filter((member) => member.share_human_health).length
    : data.humanHealth.filter((record) => record.sharedWithFamily).length;
  const sharedPets = remote.snapshot
    ? remote.snapshot.pets.filter((pet) => pet.shared_with_group).length
    : data.pets.filter((pet) => pet.sharedWithFamily).length;
  const userCount = remote.snapshot?.members.length ?? data.users.length;
  const latestByPet = new Map<string, Device>();
  for (const record of remote.health.pets) {
    if (!record.pet_id) continue;
    const existing = latestByPet.get(record.pet_id);
    if (!existing || dayjs(record.recorded_at).isAfter(existing.lastSyncedAt)) {
      latestByPet.set(record.pet_id, {
        id: `qa-${record.pet_id}`,
        familyId: remoteFamily?.id ?? currentUser?.familyId ?? '',
        petId: record.pet_id,
        serial: '',
        firmware: '',
        state: 'recent',
        battery: 0,
        connectedBy: 'QA sync',
        lastConnectedAt: record.recorded_at,
        lastSyncedAt: record.recorded_at,
        uploadedPackets24h: 0,
      });
    }
  }
  const recentHealth = [...latestByPet.values()];
  const remotePetName = (petId?: string) => remote.snapshot?.pets.find((pet) => pet.id === petId)?.name ?? petName(petId);

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
            : translate(`${remoteFamily?.name ?? data.families[0]?.name ?? '家庭'}概览`, `${remoteFamily?.name ?? data.families[0]?.name ?? 'Family'} Overview`)}
        </Typography.Title>
        <Typography.Text type="secondary">
          {role === 'super_admin'
            ? translate('查看 PetraQ 全平台用户、家庭、健康共享和告警状态。', 'Users, families, health sharing and alerts across PetraQ.')
            : translate('查看当前家庭成员、宠物和隐私授权。', 'Your family members, pets and privacy permissions.')}
        </Typography.Text>
      </div>

      {remote.error && <Alert type="error" showIcon message={translate('家庭数据读取失败', 'Failed to load family data')} description={remote.error} />}
      {remote.loading && <Spin tip={translate('正在同步家庭数据…', 'Syncing family data…')} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('家庭', 'Families')} value={familyRows.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('用户', 'Users')} value={userCount} prefix={<UserOutlined />} />
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
              dataSource={familyRows}
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
              dataSource={recentHealth.length ? recentHealth.slice(0, 6) : data.devices.slice(0, 6)}
              columns={[
                { title: translate('宠物', 'Pet'), dataIndex: 'petId', render: (value: string) => remotePetName(value) },
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
