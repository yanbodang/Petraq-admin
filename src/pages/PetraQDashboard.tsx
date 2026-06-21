import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { ExclamationCircleOutlined, MedicineBoxOutlined, MobileOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
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

  const onlineDevices = data.devices.filter((device) => device.state === 'online').length;
  const rawPackets = data.devices.reduce((sum, device) => sum + device.uploadedPackets24h, 0);
  const medicalReviews = data.medicalReports.filter((report) => report.status === 'needs_review').length;

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
            ? translate('查看 PetraQ 全平台用户、家庭、设备、告警和授权状态。', 'All users, families, devices, alerts, and consent status across PetraQ.')
            : translate('查看当前家庭成员、共享宠物、设备和隐私授权。', 'Your family members, shared pets, devices, and privacy permissions.')}
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
            <Statistic title={translate('在线设备', 'Devices online')} value={`${onlineDevices}/${data.devices.length}`} prefix={<MobileOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('24 小时原始包', 'Raw packets 24h')} value={rawPackets} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('医疗复核', 'Medical review')} value={medicalReviews} prefix={<MedicineBoxOutlined />} />
          </Card>
        </Col>
      </Row>

      <Alert
        showIcon
        icon={<ExclamationCircleOutlined />}
        type="info"
        message={translate('架构边界', 'Architecture boundary')}
        description={translate(
          'App 上传原始 BLE 数据，后端负责解析和算法计算，再向 App 与 Admin 提供计算后的快照。',
          'The App uploads raw BLE payloads. Backend services parse, run algorithms, and expose computed snapshots to App and Admin.'
        )}
      />

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
                { title: translate('设备', 'Devices'), dataIndex: 'deviceCount' },
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
          <Card title={translate('设备状态', 'Device status')}>
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={data.devices.slice(0, 6)}
              columns={[
                { title: translate('设备', 'Device'), dataIndex: 'serial' },
                {
                  title: translate('宠物', 'Pet'),
                  dataIndex: 'petId',
                  render: (value: string) => petName(value),
                },
                {
                  title: translate('状态', 'State'),
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
