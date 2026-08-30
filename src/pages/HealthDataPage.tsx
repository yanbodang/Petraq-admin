import { EyeInvisibleOutlined, HeartOutlined } from '@ant-design/icons';
import { Card, Segmented, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { getScopedData, userName } from '../services/petraqAdminData';

type HealthView = 'people' | 'pets';

export default function HealthDataPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const [view, setView] = useState<HealthView>('people');
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);
  const [humanHealth] = useState(data.humanHealth);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  const memberName = (memberId: string) => {
    const member = data.members.find((item) => item.id === memberId);
    return member ? userName(member.userId) : memberId;
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{translate('健康数据', 'Health data')}</Typography.Title>
          <Typography.Text type="secondary">
            {translate('只显示家庭成员明确共享的健康信息。', 'Only health information explicitly shared by family members is visible.')}
          </Typography.Text>
        </div>
        <Segmented<HealthView>
          value={view}
          onChange={setView}
          options={[
            { label: translate('人的健康数据', 'People'), value: 'people' },
            { label: translate('宠物健康数据', 'Pets'), value: 'pets' },
          ]}
        />
      </div>

      {view === 'people' ? (
        <Card title={translate('家庭成员健康', 'Family member health')}>
          <Table
            rowKey="id"
            dataSource={humanHealth}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            scroll={{ x: 860 }}
            columns={[
              { title: translate('成员', 'Member'), dataIndex: 'memberId', render: memberName },
              {
                title: translate('共享状态', 'Sharing'),
                dataIndex: 'sharedWithFamily',
                render: (shared: boolean) => shared
                  ? <Tag color="green">{translate('已共享', 'Shared')}</Tag>
                  : <Tag icon={<EyeInvisibleOutlined />}>{translate('未共享', 'Not shared')}</Tag>,
              },
              {
                title: translate('心率', 'Heart rate'),
                dataIndex: 'heartRate',
                render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—',
              },
              {
                title: translate('静息心率', 'Resting'),
                dataIndex: 'restingHeartRate',
                render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—',
              },
              {
                title: translate('睡眠', 'Sleep'),
                dataIndex: 'sleepMinutes',
                render: (value: number | null, record) => record.sharedWithFamily && value ? `${Math.floor(value / 60)}h ${value % 60}m` : '—',
              },
              {
                title: translate('体温', 'Temperature'),
                dataIndex: 'temperatureCelsius',
                render: (value: number | null, record) => record.sharedWithFamily && value ? `${value.toFixed(1)}°C` : '—',
              },
              { title: translate('更新时间', 'Updated'), dataIndex: 'updatedAt', render: formatDate },
            ]}
          />
        </Card>
      ) : (
        <Card title={translate('宠物健康', 'Pet health')}>
          <Table
            rowKey="id"
            dataSource={data.pets}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            scroll={{ x: 760 }}
            columns={[
              { title: translate('宠物', 'Pet'), dataIndex: 'name' },
              { title: translate('主人', 'Owner'), dataIndex: 'ownerMemberId', render: memberName },
              {
                title: translate('共享状态', 'Sharing'),
                dataIndex: 'sharedWithFamily',
                render: (shared: boolean) => <Tag color={shared ? 'green' : 'default'}>{shared ? translate('已共享', 'Shared') : translate('未共享', 'Not shared')}</Tag>,
              },
              { title: translate('健康评分', 'Health score'), dataIndex: 'healthScore', render: (value: number | null, record) => record.sharedWithFamily && value ? value : '—' },
              { title: translate('心率', 'Heart rate'), dataIndex: 'heartRate', render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—' },
              { title: translate('状态', 'Status'), dataIndex: 'activity', render: (value: string, record) => record.sharedWithFamily ? <Tag icon={<HeartOutlined />}>{value}</Tag> : '—' },
              { title: translate('更新时间', 'Updated'), dataIndex: 'lastComputedAt', render: formatDate },
            ]}
          />
        </Card>
      )}
    </Space>
  );
}
