import { Alert, Card, Col, Row, Space, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';
import { useRemoteGroupData } from '../hooks/useRemoteGroupData';

const deviceColor = {
  online: 'green',
  recent: 'gold',
  offline: 'red',
};

export default function PetsDevicesPage() {
  const { translate } = useLocale();
  const remote = useRemoteGroupData({ includeHealth: true });
  const family = remote.families[0];
  const pets = remote.snapshot?.pets ?? [];
  const members = remote.snapshot?.members ?? [];
  const latestHealth = new Map<string, (typeof remote.health.pets)[number]>();
  remote.health.pets.forEach((record) => {
    if (!record.pet_id) return;
    const previous = latestHealth.get(record.pet_id);
    if (!previous || dayjs(record.recorded_at).isAfter(previous.recorded_at)) latestHealth.set(record.pet_id, record);
  });
  const healthRows = [...latestHealth.values()];

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

      {remote.error && <Alert type="error" showIcon message={translate('宠物数据读取失败', 'Failed to load pet data')} description={remote.error} />}
      {remote.loading && <Spin tip={translate('正在同步宠物数据…', 'Syncing pet data…')} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <Card title={translate('宠物', 'Pets')}>
            <Table
              rowKey="id"
              loading={remote.loading}
              dataSource={pets}
              columns={[
                { title: translate('宠物', 'Pet'), dataIndex: 'name' },
                {
                  title: translate('家庭', 'Family'),
                  key: 'family',
                  render: () => family?.name ?? remote.snapshot?.group?.name ?? '-',
                },
                {
                  title: translate('主人', 'Owner'),
                  dataIndex: 'owner_user_id',
                  render: (userId: string) => members.find((item) => item.user_id === userId)?.name ?? userId,
                },
                {
                  title: translate('类型', 'Species'),
                  dataIndex: 'species',
                  render: (value: string) => <Tag>{speciesLabel(value)}</Tag>,
                },
                {
                  title: translate('评分', 'Score'),
                  key: 'healthScore',
                  render: () => '-',
                },
                {
                  title: translate('心率', 'Heart rate'),
                  key: 'heartRate',
                  render: (_: unknown, pet: { id: string }) => {
                    const record = remote.health.pets.find((item) => item.pet_id === pet.id && item.metric_type === 'heart_rate');
                    return record ? `${record.value} ${record.unit || 'bpm'}` : '-';
                  },
                },
                {
                  title: translate('共享', 'Shared'),
                  dataIndex: 'shared_with_group',
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
              loading={remote.loading}
              dataSource={healthRows}
              columns={[
                {
                  title: translate('宠物', 'Pet'),
                  dataIndex: 'pet_id',
                  render: (value: string) => pets.find((pet) => pet.id === value)?.name ?? value,
                },
                {
                  title: translate('状态', 'State'),
                  key: 'state',
                  render: (_: unknown, record: { recorded_at: string }) => {
                    const hours = dayjs().diff(dayjs(record.recorded_at), 'hour');
                    const state: keyof typeof deviceColor = hours <= 1 ? 'online' : hours <= 24 ? 'recent' : 'offline';
                    return <Tag color={deviceColor[state]}>{deviceStateLabel(state)}</Tag>;
                  },
                },
                {
                  title: translate('最新指标', 'Latest metric'),
                  dataIndex: 'metric_type',
                },
                {
                  title: translate('更新来源', 'Updated by'),
                  key: 'source',
                  render: () => translate('后端健康同步', 'Backend health sync'),
                },
                {
                  title: translate('上次同步', 'Last sync'),
                  dataIndex: 'recorded_at',
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
