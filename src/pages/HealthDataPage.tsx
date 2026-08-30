import { EyeInvisibleOutlined, HeartOutlined } from '@ant-design/icons';
import { Card, Collapse, Empty, Segmented, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { getScopedData, userName } from '../services/petraqAdminData';

type HealthView = 'people' | 'pets';
type ChartPoint = { name: string; heartRate: number | null; secondary: number | null };

function HealthChart({ data, secondaryLabel, secondaryUnit, emptyText }: { data: ChartPoint[]; secondaryLabel: string; secondaryUnit: string; emptyText: string }) {
  if (!data.some((item) => item.heartRate !== null || item.secondary !== null)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }
  return (
    <div style={{ width: '100%', height: 340 }} role="img" aria-label={secondaryLabel}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 14, left: -12, bottom: 4 }}>
          <CartesianGrid stroke="#e5ece9" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64746f', fontSize: 12 }} />
          <YAxis yAxisId="heart" tickLine={false} axisLine={false} tick={{ fill: '#64746f', fontSize: 12 }} unit=" bpm" width={72} />
          <YAxis yAxisId="secondary" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#64746f', fontSize: 12 }} unit={secondaryUnit} width={58} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dfe8e4', boxShadow: '0 10px 28px rgba(15, 55, 47, 0.1)' }} formatter={(value: number, key: string) => [`${value}${key === 'heartRate' ? ' bpm' : secondaryUnit}`, key === 'heartRate' ? 'Heart rate' : secondaryLabel]} />
          <Line yAxisId="heart" type="monotone" dataKey="heartRate" stroke="#0f7c6d" strokeWidth={3} dot={{ r: 3, fill: '#0f7c6d' }} connectNulls />
          <Line yAxisId="secondary" type="monotone" dataKey="secondary" stroke="#d9825b" strokeWidth={2} dot={{ r: 3, fill: '#d9825b' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function HealthDataPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const [view, setView] = useState<HealthView>('people');
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const memberName = (memberId: string) => {
    const member = data.members.find((item) => item.id === memberId);
    return member ? userName(member.userId) : memberId;
  };
  const peopleChart = useMemo<ChartPoint[]>(() => data.humanHealth.filter((item) => item.sharedWithFamily).map((item) => ({ name: memberName(item.memberId), heartRate: item.heartRate, secondary: item.sleepMinutes ? Number((item.sleepMinutes / 60).toFixed(1)) : null })), [data.humanHealth]);
  const petChart = useMemo<ChartPoint[]>(() => data.pets.filter((item) => item.sharedWithFamily).map((item) => ({ name: item.name, heartRate: item.heartRate, secondary: item.healthScore })), [data.pets]);

  const details = view === 'people' ? (
    <Table rowKey="id" dataSource={data.humanHealth} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 860 }} columns={[
      { title: translate('成员', 'Member'), dataIndex: 'memberId', render: memberName },
      { title: translate('共享状态', 'Sharing'), dataIndex: 'sharedWithFamily', render: (shared: boolean) => shared ? <Tag color="green">{translate('已共享', 'Shared')}</Tag> : <Tag icon={<EyeInvisibleOutlined />}>{translate('未共享', 'Not shared')}</Tag> },
      { title: translate('心率', 'Heart rate'), dataIndex: 'heartRate', render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—' },
      { title: translate('静息心率', 'Resting'), dataIndex: 'restingHeartRate', render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—' },
      { title: translate('睡眠', 'Sleep'), dataIndex: 'sleepMinutes', render: (value: number | null, record) => record.sharedWithFamily && value ? `${Math.floor(value / 60)}h ${value % 60}m` : '—' },
      { title: translate('体温', 'Temperature'), dataIndex: 'temperatureCelsius', render: (value: number | null, record) => record.sharedWithFamily && value ? `${value.toFixed(1)}°C` : '—' },
      { title: translate('更新时间', 'Updated'), dataIndex: 'updatedAt', render: formatDate },
    ]} />
  ) : (
    <Table rowKey="id" dataSource={data.pets} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 760 }} columns={[
      { title: translate('宠物', 'Pet'), dataIndex: 'name' },
      { title: translate('主人', 'Owner'), dataIndex: 'ownerMemberId', render: memberName },
      { title: translate('共享状态', 'Sharing'), dataIndex: 'sharedWithFamily', render: (shared: boolean) => <Tag color={shared ? 'green' : 'default'}>{shared ? translate('已共享', 'Shared') : translate('未共享', 'Not shared')}</Tag> },
      { title: translate('健康评分', 'Health score'), dataIndex: 'healthScore', render: (value: number | null, record) => record.sharedWithFamily && value ? value : '—' },
      { title: translate('心率', 'Heart rate'), dataIndex: 'heartRate', render: (value: number | null, record) => record.sharedWithFamily && value ? `${value} bpm` : '—' },
      { title: translate('状态', 'Status'), dataIndex: 'activity', render: (value: string, record) => record.sharedWithFamily ? <Tag icon={<HeartOutlined />}>{value}</Tag> : '—' },
      { title: translate('更新时间', 'Updated'), dataIndex: 'lastComputedAt', render: formatDate },
    ]} />
  );

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div className="page-heading">
        <div>
          <Typography.Title level={2}>{translate('健康趋势', 'Health trends')}</Typography.Title>
          <Typography.Text type="secondary">{translate('图表只汇总已明确授权共享的数据。', 'Charts only aggregate data explicitly approved for sharing.')}</Typography.Text>
        </div>
        <Segmented<HealthView> value={view} onChange={setView} options={[{ label: translate('人的健康数据', 'People'), value: 'people' }, { label: translate('宠物健康数据', 'Pets'), value: 'pets' }]} />
      </div>
      <Card title={view === 'people' ? translate('心率与睡眠概览', 'Heart rate and sleep overview') : translate('心率与健康评分概览', 'Heart rate and health score overview')}>
        <HealthChart data={view === 'people' ? peopleChart : petChart} secondaryLabel={view === 'people' ? translate('睡眠', 'Sleep') : translate('健康评分', 'Health score')} secondaryUnit={view === 'people' ? ' h' : ''} emptyText={translate('接入真实健康数据后，趋势图会显示在这里。', 'The trend chart will appear when real health data is connected.')} />
      </Card>
      <Collapse items={[{ key: view, label: view === 'people' ? translate('查看成员健康明细', 'View member health details') : translate('查看宠物健康明细', 'View pet health details'), children: details }]} />
    </Space>
  );
}
