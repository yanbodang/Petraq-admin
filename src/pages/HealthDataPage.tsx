import { HeartOutlined } from '@ant-design/icons';
import { Card, Collapse, Empty, message, Segmented, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { GroupHealthData, GroupHealthRecord, groupSyncService } from '../services/groupSyncService';

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
  const { currentUser, session } = useAuth();
  const { translate } = useLocale();
  const [view, setView] = useState<HealthView>('people');
  const [data, setData] = useState<GroupHealthData>({ people: [], pets: [] });
  const [loading, setLoading] = useState(false);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  useEffect(() => {
    if (!currentUser?.familyId || !session?.token) return;
    setLoading(true);
    groupSyncService.getGroupHealth(currentUser.familyId, session.token)
      .then(setData)
      .catch((error) => message.error(error instanceof Error ? error.message : translate('读取健康数据失败', 'Failed to load health data')))
      .finally(() => setLoading(false));
  }, [currentUser?.familyId, session?.token, translate]);

  const toChart = (records: GroupHealthRecord[]) => records
    .filter((item) => ['heart_rate', 'temperature'].includes(item.metric_type))
    .slice(-80)
    .map((item) => ({
      name: new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.recorded_at)),
      heartRate: item.metric_type === 'heart_rate' ? Number(item.value) : null,
      secondary: item.metric_type === 'temperature' ? Number(item.value) : null,
    }));
  const peopleChart = useMemo<ChartPoint[]>(() => toChart(data.people), [data.people]);
  const petChart = useMemo<ChartPoint[]>(() => toChart(data.pets), [data.pets]);

  const columns = [
    { title: translate('姓名', 'Name'), dataIndex: 'name' },
    { title: translate('数据类型', 'Metric'), dataIndex: 'metric_type', render: (value: string) => <Tag icon={<HeartOutlined />}>{value}</Tag> },
    { title: translate('数值', 'Value'), dataIndex: 'value', render: (value: number, record: GroupHealthRecord) => `${value} ${record.unit || ''}` },
    { title: translate('记录时间', 'Recorded'), dataIndex: 'recorded_at', render: formatDate },
  ];

  const details = view === 'people' ? (
    <Table loading={loading} rowKey="id" dataSource={data.people} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 760 }} columns={columns} />
  ) : (
    <Table loading={loading} rowKey="id" dataSource={data.pets} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 760 }} columns={columns} />
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
        <HealthChart data={view === 'people' ? peopleChart : petChart} secondaryLabel={translate('体温', 'Temperature')} secondaryUnit=" °C" emptyText={translate('当前没有已授权的健康数据。', 'There is no authorized health data yet.')} />
      </Card>
      <Collapse items={[{ key: view, label: view === 'people' ? translate('查看成员健康明细', 'View member health details') : translate('查看宠物健康明细', 'View pet health details'), children: details }]} />
    </Space>
  );
}
