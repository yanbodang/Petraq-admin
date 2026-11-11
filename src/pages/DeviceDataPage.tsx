import { Alert, Button, Card, Col, DatePicker, Empty, Row, Select, Space, Spin, Table, Tabs, Tag, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { DeviceDiagnostic, DeviceHistoryPage, DevicePacket, GroupDevice, GroupSnapshot, groupSyncService, WellbeingMetric } from '../services/groupSyncService';

type Tab = 'trends' | 'diagnostics' | 'raw';
type Scope = { groupId: string; token: string };
type Range = { from: string; to: string; days: number; offset: number };

function useRead<T>(load: (signal: AbortSignal) => Promise<T>): { data?: T; error?: string; loading: boolean } {
  const [state, setState] = useState<{ load: typeof load; data?: T; error?: string }>();

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ load, data }); },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ load, error: error instanceof Error ? error.message : 'service_unavailable' });
        }
      },
    );
    return () => controller.abort();
  }, [load]);

  return state?.load === load ? { ...state, loading: false } : { loading: true };
}

function ReadError({ error }: { error?: string }) {
  const { translate } = useLocale();
  if (!error) return null;
  const reason = ['HTTP 403', 'forbidden', 'manager_required', 'subject_unavailable'].includes(error)
    ? translate('当前账号没有权限查看这些数据。', 'This account does not have access to these data.')
    : error === 'range_too_large'
      ? translate('此时间段的数据较多，请缩短查询范围。', 'Choose a shorter time range.')
      : error;
  return <Alert type="error" showIcon message={translate('读取数据失败', 'Failed to load data')} description={reason} />;
}

function MetricChart({ title, metric, days }: { title: string; metric?: WellbeingMetric; days: number }) {
  const { language, translate } = useLocale();
  const timeFormat = new Intl.DateTimeFormat(language, days === 1
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric' });
  const points = (metric?.points ?? [])
    .map((point) => ({ ...point, timestamp: Date.parse(point.time) }))
    .filter((point) => Number.isFinite(point.timestamp));
  const unit = metric?.unit ?? '';
  return (
    <Card title={title}>
      {points.some((point) => point.value !== null) ? (
        <>
          {metric?.value != null && (
            <Typography.Paragraph>
              {translate('期间均值', 'Period average')} <strong>{metric.value} {unit}</strong>
            </Typography.Paragraph>
          )}
          <div role="img" aria-label={title} style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={points} margin={{ top: 8, right: 18, bottom: 4, left: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 6" />
                <XAxis type="number" scale="time" dataKey="timestamp" domain={['dataMin', 'dataMax']} tickFormatter={(value) => timeFormat.format(value)} />
                <YAxis unit={` ${unit}`} width={70} />
                <Tooltip labelFormatter={(value) => timeFormat.format(Number(value))} formatter={(value: number) => [`${value} ${unit}`, title]} />
                <Line type="linear" dataKey="value" stroke="#0f7c6d" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('这段时间暂无可展示数据', 'No data available for this period')} />}
    </Card>
  );
}

function MetricTrends({ groupId, token, range, subject, deviceId }: Scope & {
  range: Range;
  subject: { id: string; type: GroupDevice['subject_type'] };
  deviceId?: string;
}) {
  const { translate } = useLocale();
  const { days, to, offset } = range;
  const { id, type } = subject;
  const load = useCallback((signal: AbortSignal) => {
    const query = new URLSearchParams({ subjectType: type, subjectId: id, days: String(days), end: to, offset: String(offset) });
    if (deviceId) query.set('deviceId', deviceId);
    return groupSyncService.getWellbeing(groupId, token, query, signal);
  }, [days, deviceId, groupId, id, offset, to, token, type]);
  const { data, error, loading } = useRead(load);

  if (loading) return <Spin />;
  if (error) return <ReadError error={error} />;
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}><MetricChart title={translate('心率', 'Heart rate')} metric={data?.metrics.heart_rate} days={days} /></Col>
      <Col xs={24} xl={12}><MetricChart title={translate('睡眠时长', 'Sleep duration')} metric={data?.metrics.sleep_minutes} days={days} /></Col>
    </Row>
  );
}

function CursorHistory<T>({ fetchPage, render }: {
  fetchPage: (signal: AbortSignal, before?: string) => Promise<DeviceHistoryPage<T>>;
  render: (items: T[], loading: boolean) => React.ReactNode;
}) {
  const { translate } = useLocale();
  const [cursors, setCursors] = useState<string[]>([]);
  const before = cursors[cursors.length - 1];
  const load = useCallback((signal: AbortSignal) => fetchPage(signal, before), [before, fetchPage]);
  const { data, error, loading } = useRead(load);
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <ReadError error={error} />
      {render(data?.items ?? [], loading)}
      {(cursors.length > 0 || data?.nextBefore) && (
        <Space wrap>
          <Button disabled={loading || cursors.length === 0} onClick={() => setCursors((previous) => previous.slice(0, -1))}>
            {translate('上一页', 'Previous page')}
          </Button>
          <Button disabled={loading || !data?.nextBefore} onClick={() => {
            if (data?.nextBefore) setCursors([...cursors, data.nextBefore]);
          }}>
            {translate('下一页', 'Next page')}
          </Button>
        </Space>
      )}
    </Space>
  );
}

function DiagnosticHistory({ groupId, token, range, userId, deviceId, category, installationId, runId }: Scope & {
  range: Range;
  userId?: string;
  deviceId?: string;
  category?: 'operations' | 'errors';
  installationId?: string;
  runId?: string;
}) {
  const { translate } = useLocale();
  const { from, to } = range;
  const fetchPage = useCallback((signal: AbortSignal, before?: string) =>
    groupSyncService.listDeviceDiagnostics(groupId, token, { from, to, userId, deviceId, category, installationId, runId, before }, signal),
  [groupId, token, from, to, userId, deviceId, category, installationId, runId]);
  return (
    <Card title={translate('诊断与操作记录', 'Diagnostic timeline')}>
      <CursorHistory<DeviceDiagnostic> fetchPage={fetchPage} render={(items, loading) => (
        <Table
          rowKey={(row) => `${row.user_id}:${row.id}`}
          dataSource={items}
          loading={loading}
          pagination={false}
          scroll={{ x: 1240 }}
          columns={[
            { title: translate('发生时间', 'Occurred'), dataIndex: 'occurred_at', render: formatTime },
            { title: translate('接收时间', 'Received'), dataIndex: 'received_at', render: formatTime },
            { title: translate('用户', 'User'), dataIndex: 'user_name', render: (name, row) => name || row.user_id },
            { title: translate('安装实例', 'Installation'), dataIndex: 'installation_id', render: (value) => value ? <Typography.Text copyable={{ text: value }}>{value.slice(0, 8)}</Typography.Text> : '—' },
            { title: translate('启动会话', 'App run'), dataIndex: 'run_id', render: (value) => value ? <Typography.Text copyable={{ text: value }}>{value.slice(0, 8)}</Typography.Text> : '—' },
            { title: translate('页面', 'Screen'), dataIndex: 'screen', render: (value) => value || '—' },
            { title: translate('蓝牙配件', 'Bluetooth accessory'), dataIndex: 'device_name', render: (name, row) => name || row.device_id || (row.peripheral_id ? <Typography.Text copyable={{ text: row.peripheral_id }}>{row.peripheral_id.slice(0, 8)}</Typography.Text> : '—') },
            { title: translate('事件', 'Event'), dataIndex: 'event', render: (event) => event === 'app_operation' ? translate('用户操作', 'User operation') : event === 'app_exception' ? translate('程序异常', 'App exception') : event },
            { title: translate('状态', 'Status'), dataIndex: 'status', render: (status: string) => <Tag color={status === 'error' ? 'red' : undefined}>{status}</Tag> },
            { title: translate('操作或错误码', 'Action or error code'), dataIndex: 'code', render: (value) => value || '—' },
            { title: translate('失败原因', 'Failure reason'), dataIndex: 'reason', render: (value) => value || '—' },
            { title: translate('计数', 'Count'), dataIndex: 'count', render: (value) => value ?? '—' },
          ]}
        />
      )} />
    </Card>
  );
}

function formatTime(value?: string | null) {
  return value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
}

const packetContentStyle = { marginBottom: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 280, overflow: 'auto' } as const;

function PacketHistory({ groupId, token, range, deviceId }: Scope & { range: Range; deviceId: string }) {
  const { translate } = useLocale();
  const { from, to } = range;
  const fetchPage = useCallback((signal: AbortSignal, before?: string) =>
    groupSyncService.listDevicePackets(groupId, deviceId, token, { from, to, before }, signal),
  [groupId, token, from, to, deviceId]);
  const metricLabels: Record<string, string> = {
    heart_rate: translate('心率', 'Heart rate'),
    hrv: translate('心率变异性', 'Heart rate variability'),
    temperature: translate('体温', 'Temperature'),
    battery_voltage: translate('电池电压', 'Battery voltage'),
  };
  return (
    <Card title={translate('设备原始数据包', 'Raw device packets')}>
      <CursorHistory<DevicePacket> fetchPage={fetchPage} render={(items, loading) => (
        <Table
          rowKey="id"
          dataSource={items}
          loading={loading}
          pagination={false}
          scroll={{ x: 760 }}
          columns={[
            { title: translate('记录 ID', 'Record ID'), dataIndex: 'id' },
            { title: translate('采集时间', 'Recorded'), dataIndex: 'recorded_at', render: formatTime },
            { title: translate('接收时间', 'Received'), dataIndex: 'received_at', render: formatTime },
            { title: translate('数据类型', 'Packet type'), dataIndex: 'packet_type', render: (value) => value || '—' },
            {
              title: translate('解析状态', 'Parse status'),
              dataIndex: 'parse_status',
              render: (status: DevicePacket['parse_status']) => (
                <Tag color={status === 'parsed' ? 'green' : status === 'unparsed' ? 'orange' : 'default'}>
                  {status === 'parsed' ? translate('已解析', 'Parsed') : status === 'unparsed' ? translate('无法解析', 'Unparsed') : translate('未处理', 'Unprocessed')}
                </Tag>
              ),
            },
            { title: translate('解析错误', 'Parse error'), dataIndex: 'parse_error', render: (value) => value || '—' },
          ]}
          expandable={{
            expandedRowRender: (row) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text copyable>
                  {translate('数据包标识', 'Packet key')} {row.packet_key}
                </Typography.Text>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Typography.Text strong>{translate('原始数据（十六进制）', 'Raw data (hex)')}</Typography.Text>
                    <pre style={packetContentStyle}>{row.payload_hex}</pre>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Typography.Text strong>{translate('解析结果', 'Parsed result')}</Typography.Text>
                    <pre style={packetContentStyle}>{row.parsed_data === null ? translate('暂无解析结果', 'No parsed result') : JSON.stringify(row.parsed_data, null, 2)}</pre>
                  </Col>
                </Row>
                <Typography.Text strong>{translate('入库指标', 'Stored metrics')}</Typography.Text>
                <Table
                  size="small"
                  rowKey={(metric) => `${metric.metric_type}:${metric.recorded_at}`}
                  dataSource={row.projected_metrics ?? []}
                  pagination={false}
                  locale={{ emptyText: translate('此数据包暂无入库指标', 'No stored metrics for this packet') }}
                  columns={[
                    { title: translate('指标', 'Metric'), dataIndex: 'metric_type', render: (type: string) => metricLabels[type] ?? type },
                    { title: translate('数值', 'Value'), dataIndex: 'value', render: (value, metric) => `${value} ${metric.unit}` },
                    { title: translate('观测时间', 'Observation time'), dataIndex: 'recorded_at', render: formatTime },
                  ]}
                />
              </Space>
            ),
          }}
        />
      )} />
    </Card>
  );
}

function GroupDeviceData({ groupId, token, userId }: Scope & { userId?: string }) {
  const { translate } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('diagnostics');
  const [days, setDays] = useState(7);
  const [end, setEnd] = useState<Dayjs | null>(null);
  const [refreshedAt, setRefreshedAt] = useState(() => dayjs());
  const [subjectKey, setSubjectKey] = useState<string>();
  const [trendDeviceId, setTrendDeviceId] = useState<string>();
  const [rawDeviceId, setRawDeviceId] = useState<string>();
  const [diagnosticUserId, setDiagnosticUserId] = useState<string>();
  const [diagnosticCategory, setDiagnosticCategory] = useState<'operations' | 'errors'>();
  const [installationId, setInstallationId] = useState<string>();
  const [runId, setRunId] = useState<string>();
  const [diagnosticDeviceId, setDiagnosticDeviceId] = useState<string>();
  const load = useCallback((signal: AbortSignal) => Promise.all([
    groupSyncService.getGroupSnapshot(groupId, token, signal),
    groupSyncService.getGroupDevices(groupId, token, signal),
  ]), [groupId, token]);
  const { data, error, loading } = useRead(load);
  const snapshot: GroupSnapshot | undefined = data?.[0];
  const devices = data?.[1].devices ?? [];
  const canManage = data?.[1].canManage ?? false;
  const tab = canManage ? activeTab : 'trends';
  const subjects = [
    ...(snapshot?.members ?? []).filter((member) => member.user_id === userId || member.share_human_health)
      .map((member) => ({ id: member.id, type: 'member' as const, label: member.name, key: `member:${member.id}` })),
    ...(snapshot?.pets ?? []).filter((pet) => pet.owner_user_id === userId || pet.shared_with_group)
      .map((pet) => ({ id: pet.id, type: 'pet' as const, label: pet.name, key: `pet:${pet.id}` })),
  ];
  const subject = subjects.find((item) => item.key === subjectKey) ?? subjects[0];
  const trendDevices = devices.filter((device) => device.subject_id === subject?.id && device.subject_type === subject.type);
  const visibleDevices = devices.filter((device) => subjects.some((item) => item.id === device.subject_id && item.type === device.subject_type));
  const deviceOptions = (rows: GroupDevice[]) => rows.map((row) => {
    const name = row.serial ? `${row.name} · ${row.serial}` : row.name;
    return {
      value: row.id,
      label: row.removed_at ? `${name} · ${translate('已解绑', 'Unbound')}` : name,
    };
  });
  const range = useMemo<Range>(() => {
    const to = end ?? refreshedAt;
    const from = days === 1
      ? (to.valueOf() === to.startOf('day').valueOf() ? to.subtract(1, 'day') : to).startOf('day')
      : to.subtract(days * 24, 'hour');
    return { days, from: from.toISOString(), to: to.toISOString(), offset: to.utcOffset() };
  }, [days, end, refreshedAt]);
  const loadRuns = useCallback((signal: AbortSignal) => canManage && tab === 'diagnostics'
    ? groupSyncService.listDiagnosticRuns(groupId, token, { from: range.from, to: range.to }, signal)
    : Promise.resolve({ items: [] }), [canManage, tab, groupId, token, range.from, range.to]);
  const { data: runData, error: runError } = useRead(loadRuns);
  const runs = runData?.items ?? [];
  const installations = [...new Set(runs.map((run) => run.installation_id))];
  const resetPagination = [range.from, range.to, refreshedAt.valueOf()].join('|');

  if (loading) return <Spin />;
  if (error) return <ReadError error={error} />;
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Tabs
        activeKey={tab}
        onChange={(value) => setActiveTab(value as Tab)}
        items={[
          { key: 'trends', label: translate('指标趋势', 'Metrics') },
          ...(canManage ? [
            { key: 'diagnostics', label: translate('诊断记录', 'Diagnostics') },
            { key: 'raw', label: translate('原始数据包', 'Raw packets') },
          ] : []),
        ]}
      />
      <Card size="small">
        <Space wrap>
          {tab === 'trends' && <>
            <Select
              aria-label={translate('成员或宠物', 'Member or pet')}
              placeholder={translate('选择成员或宠物', 'Select a member or pet')}
              value={subject?.key}
              style={{ minWidth: 170 }}
              options={subjects.map((item) => ({ value: item.key, label: item.label }))}
              onChange={(value) => { setSubjectKey(value); setTrendDeviceId(undefined); }}
            />
            <Select
              aria-label={translate('指标设备', 'Metrics device')}
              placeholder={translate('所有数据来源', 'All sources')}
              allowClear
              value={trendDeviceId}
              onChange={setTrendDeviceId}
              options={deviceOptions(trendDevices)}
              style={{ minWidth: 185 }}
            />
          </>}
          {tab === 'diagnostics' && <>
            <Select
              aria-label={translate('App 安装实例', 'App installation')}
              placeholder={translate('所有 App 安装实例', 'All app installations')}
              allowClear value={installationId}
              onChange={(id) => { setInstallationId(id); setRunId(undefined); }}
              options={installations.map((id) => ({ value: id, label: id.slice(0, 8) }))}
              style={{ minWidth: 190 }}
            />
            <Select
              aria-label={translate('启动会话', 'App run')}
              placeholder={translate('所有启动会话', 'All app runs')}
              allowClear value={runId} onChange={setRunId}
              options={runs.filter((run) => !installationId || run.installation_id === installationId)
                .map((run) => ({ value: run.run_id, label: `${formatTime(run.started_at)} · ${run.run_id.slice(0, 8)}` }))}
              style={{ minWidth: 230 }}
            />
            <Select
              aria-label={translate('记录类型', 'Event type')}
              placeholder={translate('所有记录', 'All events')}
              allowClear
              value={diagnosticCategory}
              onChange={setDiagnosticCategory}
              options={[
                { value: 'operations', label: translate('用户操作', 'User operations') },
                { value: 'errors', label: translate('异常与失败', 'Exceptions and failures') },
              ]}
              style={{ minWidth: 145 }}
            />
            <Select
              aria-label={translate('诊断用户', 'Diagnostic user')}
              placeholder={translate('所有用户', 'All users')}
              allowClear
              value={diagnosticUserId}
              onChange={setDiagnosticUserId}
              options={snapshot?.members.map((member) => ({ value: member.user_id, label: member.name }))}
              style={{ minWidth: 145 }}
            />
            <Select
              aria-label={translate('诊断设备', 'Diagnostic device')}
              placeholder={translate('所有设备', 'All devices')}
              allowClear
              value={diagnosticDeviceId}
              onChange={setDiagnosticDeviceId}
              options={deviceOptions(devices)}
              style={{ minWidth: 185 }}
            />
          </>}
          {tab === 'raw' && <Select
            aria-label={translate('原始包设备', 'Raw packet device')}
            placeholder={translate('选择设备', 'Select device')}
            value={rawDeviceId}
            onChange={setRawDeviceId}
            options={deviceOptions(visibleDevices)}
            style={{ minWidth: 185 }}
          />}
          <Select
            aria-label={translate('时间范围', 'Time range')}
            value={days}
            onChange={setDays}
            options={[
              { value: 1, label: translate('当天', 'Selected day') },
              { value: 7, label: translate('7 天', '7 days') },
              { value: 30, label: translate('30 天', '30 days') },
              { value: 90, label: translate('90 天', '90 days') },
            ]}
          />
          <DatePicker
            aria-label={translate('截止时间（本机时区）', 'End time (local time zone)')}
            placeholder={translate('截止时间（默认现在）', 'End time (now by default)')}
            showTime
            value={end}
            onChange={setEnd}
            disabledDate={(date) => date.isAfter(dayjs(), 'day')}
          />
          <Button onClick={() => setRefreshedAt(dayjs())}>{translate('刷新', 'Refresh')}</Button>
        </Space>
      </Card>
      {tab === 'trends' && (subject
        ? <MetricTrends key={resetPagination} groupId={groupId} token={token} range={range} subject={subject} deviceId={trendDeviceId} />
        : <Empty description={translate('当前家庭暂无已授权的成员或宠物数据', 'No authorized member or pet data in this family')} />)}
      {tab === 'diagnostics' && runError && <ReadError error={runError} />}
      {tab === 'diagnostics' && <DiagnosticHistory
        key={`${resetPagination}|${diagnosticUserId}|${diagnosticDeviceId}|${diagnosticCategory}|${installationId}|${runId}`}
        groupId={groupId} token={token} range={range} userId={diagnosticUserId} deviceId={diagnosticDeviceId} category={diagnosticCategory} installationId={installationId} runId={runId}
      />}
      {tab === 'raw' && (rawDeviceId
        ? <PacketHistory key={`${resetPagination}|${rawDeviceId}`} groupId={groupId} token={token} range={range} deviceId={rawDeviceId} />
        : <Empty description={translate('请选择要核验的设备', 'Select a device to inspect its packets')} />)}
    </Space>
  );
}

export default function DeviceDataPage() {
  const { currentUser, session } = useAuth();
  const { translate } = useLocale();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const token = session?.token;
  const load = useCallback((signal: AbortSignal) =>
    token ? groupSyncService.listGroups(token, signal) : Promise.resolve([]),
  [token]);
  const { data: groups, error, loading } = useRead(load);
  const activeGroup = groups?.find((group) => group.id === (selectedGroup ?? currentUser?.familyId)) ?? groups?.[0];
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <div className="page-heading">
        <Typography.Title level={2}>{translate('设备数据与诊断', 'Device data and diagnostics')}</Typography.Title>
        {activeGroup && <Select
          aria-label={translate('家庭', 'Family')}
          value={activeGroup.id}
          onChange={setSelectedGroup}
          options={groups?.map((group) => ({ value: group.id, label: group.name }))}
          style={{ minWidth: 175 }}
        />}
      </div>
      <ReadError error={error} />
      {loading && <Spin />}
      {activeGroup && token
        ? <GroupDeviceData key={activeGroup.id} groupId={activeGroup.id} token={token} userId={currentUser?.id} />
        : !loading && !error && <Empty description={translate('暂无可查看的家庭', 'No accessible family')} />}
    </Space>
  );
}
