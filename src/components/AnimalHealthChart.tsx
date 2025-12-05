import { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Statistic, Space, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { HealthDataType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

interface AnimalHealthChartProps {
  animalId: string;
}

export default function AnimalHealthChart({ animalId }: AnimalHealthChartProps) {
  const { translate } = useLocale();
  const [selectedDataType, setSelectedDataType] = useState<HealthDataType>(HealthDataType.HEART_RATE);
  const [timeRange, setTimeRange] = useState<number>(24); // 小时
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    updateChartData();
  }, [animalId, selectedDataType, timeRange]);

  const updateChartData = () => {
    const data = dataManager.getAnimalHealthData(animalId, selectedDataType, timeRange);

    // 准备图表数据
    const chartData = data.map((point) => ({
      time: dayjs(point.timestamp).format('MM-DD HH:mm'),
      value: point.value,
      unit: point.unit,
    }));
    setChartData(chartData);
  };

  // 获取最新数据
  const latestData = {
    heartRate: dataManager.getAnimalHealthData(animalId, HealthDataType.HEART_RATE, 1)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0],
    temperature: dataManager.getAnimalHealthData(animalId, HealthDataType.TEMPERATURE, 1)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0],
    activity: dataManager.getAnimalHealthData(animalId, HealthDataType.ACTIVITY, 1)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0],
  };

  // 获取健康评分
  const healthStatus = dataManager.getAnimalHealthStatus(animalId);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const dataTypeOptions = [
    { label: translate('心率', 'Heart Rate'), value: HealthDataType.HEART_RATE },
    { label: translate('体温', 'Temperature'), value: HealthDataType.TEMPERATURE },
    { label: translate('活动量', 'Activity'), value: HealthDataType.ACTIVITY },
    { label: translate('睡眠质量', 'Sleep Quality'), value: HealthDataType.SLEEP },
    { label: translate('压力状态', 'Stress'), value: HealthDataType.STRESS },
  ];

  const timeRangeOptions = [
    { label: translate('最近1小时', 'Last 1h'), value: 1 },
    { label: translate('最近6小时', 'Last 6h'), value: 6 },
    { label: translate('最近24小时', 'Last 24h'), value: 24 },
    { label: translate('最近3天', 'Last 3d'), value: 72 },
    { label: translate('最近7天', 'Last 7d'), value: 168 },
  ];

  // 准备综合图表数据（显示多个指标）
  const allMetricsData = dataManager.getAnimalAllHealthData(animalId, timeRange);
  const metricsByTime = new Map<string, { time: string; heartRate?: number; temperature?: number; activity?: number }>();
  
  allMetricsData.forEach((point) => {
    const timeKey = dayjs(point.timestamp).format('MM-DD HH:mm');
    if (!metricsByTime.has(timeKey)) {
      metricsByTime.set(timeKey, { time: timeKey });
    }
    const data = metricsByTime.get(timeKey)!;
    if (point.type === HealthDataType.HEART_RATE) {
      data.heartRate = point.value;
    } else if (point.type === HealthDataType.TEMPERATURE) {
      data.temperature = point.value;
    } else if (point.type === HealthDataType.ACTIVITY) {
      data.activity = point.value;
    }
  });

  const combinedChartData = Array.from(metricsByTime.values()).sort((a, b) => 
    dayjs(a.time, 'MM-DD HH:mm').valueOf() - dayjs(b.time, 'MM-DD HH:mm').valueOf()
  );

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('健康评分', 'Health Score')}
              value={healthStatus?.latestHealthScore.toFixed(1) || 0}
              suffix="/ 100"
              valueStyle={{ color: getHealthScoreColor(healthStatus?.latestHealthScore || 0) }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('心率', 'Heart Rate')}
              value={latestData.heartRate?.value.toFixed(0) || '-'}
              suffix={latestData.heartRate?.unit || 'bpm'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('体温', 'Temperature')}
              value={latestData.temperature?.value.toFixed(1) || '-'}
              suffix={latestData.temperature?.unit || '°C'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('活动量', 'Activity')}
              value={latestData.activity?.value.toFixed(0) || '-'}
              suffix={latestData.activity?.unit || '%'}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={translate('数据筛选', 'Data Filters')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={updateChartData}>
            {translate('刷新', 'Refresh')}
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Space>
          <Select
            style={{ width: 150 }}
            value={selectedDataType}
            onChange={setSelectedDataType}
            options={dataTypeOptions}
          />
          <Select
            style={{ width: 150 }}
            value={timeRange}
            onChange={setTimeRange}
            options={timeRangeOptions}
          />
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card title={`${dataTypeOptions.find(o => o.value === selectedDataType)?.label}${translate('趋势', ' Trend')}`} style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  name={dataTypeOptions.find(o => o.value === selectedDataType)?.label}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="综合健康指标">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="heartRate"
              stroke="#ff4d4f"
              name={translate('心率 (bpm)', 'Heart Rate (bpm)')}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              stroke="#52c41a"
              name={translate('体温 (°C)', 'Temperature (°C)')}
              strokeWidth={2}
            />
            <Bar
              yAxisId="left"
              dataKey="activity"
              fill="#1890ff"
              name={translate('活动量 (%)', 'Activity (%)')}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
