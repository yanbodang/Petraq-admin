import { Card, Col, Row, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import {
  familyName,
  getScopedData,
  petName,
  userName,
} from '../services/petraqAdminData';

const deviceColor = {
  online: 'green',
  recent: 'gold',
  offline: 'red',
};

export default function PetsDevicesPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);

  const deviceStateLabel = (state: keyof typeof deviceColor) => {
    const labels: Record<keyof typeof deviceColor, string> = {
      online: translate('在线', 'Online'),
      recent: translate('最近在线', 'Recent'),
      offline: translate('离线', 'Offline'),
    };
    return labels[state];
  };

  const speciesLabel = (species: string) => {
    const labels: Record<string, string> = {
      dog: translate('狗', 'Dog'),
      cat: translate('猫', 'Cat'),
    };
    return labels[species] ?? species;
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>{translate('宠物管理', 'Pets')}</Typography.Title>
        <Typography.Text type="secondary">
          {translate(
            '查看宠物归属、家庭共享和健康数据更新状态。',
            'Pet ownership, family sharing and health update status.'
          )}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <Card title={translate('宠物', 'Pets')}>
            <Table
              rowKey="id"
              dataSource={data.pets}
              columns={[
                { title: translate('宠物', 'Pet'), dataIndex: 'name' },
                {
                  title: translate('家庭', 'Family'),
                  dataIndex: 'familyId',
                  render: (value: string) => familyName(value),
                },
                {
                  title: translate('主人', 'Owner'),
                  dataIndex: 'ownerMemberId',
                  render: (memberId: string) => {
                    const member = data.members.find((item) => item.id === memberId);
                    return member ? userName(member.userId) : memberId;
                  },
                },
                {
                  title: translate('类型', 'Species'),
                  dataIndex: 'species',
                  render: (value: string) => <Tag>{speciesLabel(value)}</Tag>,
                },
                {
                  title: translate('评分', 'Score'),
                  dataIndex: 'healthScore',
                  render: (value: number | null) => value ?? '-',
                },
                {
                  title: translate('心率', 'Heart rate'),
                  dataIndex: 'heartRate',
                  render: (value: number | null) => (value ? `${value} bpm` : '-'),
                },
                {
                  title: translate('共享', 'Shared'),
                  dataIndex: 'sharedWithFamily',
                  render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? translate('是', 'yes') : translate('否', 'no')}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={11}>
          <Card title={translate('健康同步状态', 'Health sync status')}>
            <Table
              rowKey="id"
              dataSource={data.devices}
              columns={[
                {
                  title: translate('宠物', 'Pet'),
                  dataIndex: 'petId',
                  render: (value: string) => petName(value),
                },
                {
                  title: translate('状态', 'State'),
                  dataIndex: 'state',
                  render: (value: keyof typeof deviceColor) => <Tag color={deviceColor[value]}>{deviceStateLabel(value)}</Tag>,
                },
                {
                  title: translate('电量', 'Battery'),
                  dataIndex: 'battery',
                  render: (value: number) => `${value}%`,
                },
                {
                  title: translate('更新来源', 'Updated by'),
                  dataIndex: 'connectedBy',
                },
                {
                  title: translate('上次同步', 'Last sync'),
                  dataIndex: 'lastSyncedAt',
                  render: (value: string) => dayjs(value).format('MM-DD HH:mm'),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
