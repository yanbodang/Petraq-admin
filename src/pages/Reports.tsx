import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Select, Tag, message, DatePicker, Card, Row, Col, Statistic } from 'antd';
import { DownloadOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { Report, ReportType, User, Animal } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';
import { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

export default function Reports() {
  const { translate } = useLocale();
  const [reports, setReports] = useState<Report[]>([]);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [form] = Form.useForm();
  const [users] = useState<User[]>(dataManager.getUsers());
  const [animals] = useState<Animal[]>(dataManager.getAllAnimals());

  useEffect(() => {
    updateReports();
  }, []);

  const updateReports = () => {
    const allReports = dataManager.getReports();
    setReports(allReports);
  };

  const handleGenerateMonthly = () => {
    form.resetFields();
    form.setFieldsValue({
      reportType: ReportType.MONTHLY_FREE,
    });
    setIsGenerateModalVisible(true);
  };

  const handleGenerateOnDemand = () => {
    form.resetFields();
    form.setFieldsValue({
      reportType: ReportType.ON_DEMAND_PAID,
    });
    setIsGenerateModalVisible(true);
  };

  const handleView = (report: Report) => {
    setViewingReport(report);
    setIsViewModalVisible(true);
  };

  const handleDownload = (report: Report) => {
    const content = `报告标题: ${report.title}\n\n${report.content}\n\n生成时间: ${dayjs(report.generatedAt).format('YYYY-MM-DD HH:mm:ss')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}-${dayjs(report.generatedAt).format('YYYY-MM-DD')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(translate('下载成功', 'Downloaded'));
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      let report: Report;

      if (values.reportType === ReportType.MONTHLY_FREE) {
        const period = values.period
          ? { start: values.period[0].toDate(), end: values.period[1].toDate() }
          : {
              start: dayjs().subtract(1, 'month').toDate(),
              end: new Date(),
            };
        report = dataManager.generateMonthlyReport(values.userId, period);
      } else {
        const period = values.period
          ? { start: values.period[0].toDate(), end: values.period[1].toDate() }
          : undefined;
        report = dataManager.generateOnDemandReport(values.userId, values.animalId, period);
      }

      message.success(translate('报告生成成功', 'Report generated'));
      setIsGenerateModalVisible(false);
      updateReports();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const columns = [
    {
      title: translate('类型', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          每月免费报告: 'blue',
          按需付费报告: 'green',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: translate('标题', 'Title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: translate('用户', 'User'),
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => {
        const user = users.find((u) => u.id === userId);
        return user?.username || userId;
      },
    },
    {
      title: translate('生成时间', 'Generated At'),
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: Report) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleView(record)}
          >
            {translate('查看', 'View')}
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            {translate('下载', 'Download')}
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: reports.length,
    monthly: reports.filter((r) => r.type === ReportType.MONTHLY_FREE).length,
    onDemand: reports.filter((r) => r.type === ReportType.ON_DEMAND_PAID).length,
    paid: reports.filter((r) => r.isPaid).length,
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('报告管理', 'Reports')}</h2>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleGenerateMonthly}>
            {translate('生成月度报告', 'Generate Monthly Report')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleGenerateOnDemand}>
            {translate('生成按需报告', 'Generate On-Demand Report')}
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('总报告数', 'Total Reports')} value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('月度报告', 'Monthly Reports')} value={stats.monthly} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('按需报告', 'On-Demand Reports')} value={stats.onDemand} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('已付费', 'Paid')} value={stats.paid} />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={reports}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={translate('生成报告', 'Generate Report')}
        open={isGenerateModalVisible}
        onOk={handleGenerate}
        onCancel={() => setIsGenerateModalVisible(false)}
        okText={translate('生成', 'Generate')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reportType"
            label={translate('报告类型', 'Report Type')}
            rules={[{ required: true }]}
          >
            <Select disabled>
              <Select.Option value={ReportType.MONTHLY_FREE}>{ReportType.MONTHLY_FREE}</Select.Option>
              <Select.Option value={ReportType.ON_DEMAND_PAID}>{ReportType.ON_DEMAND_PAID}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="userId"
            label={translate('用户', 'User')}
            rules={[{ required: true, message: translate('请选择用户', 'Please select user') }]}
          >
            <Select placeholder={translate('请选择用户', 'Please select user')}>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.reportType !== currentValues.reportType}
          >
            {({ getFieldValue }) =>
              getFieldValue('reportType') === ReportType.ON_DEMAND_PAID ? (
                <Form.Item
                  name="animalId"
                  label={translate('动物（可选）', 'Animal (optional)')}
                >
                  <Select placeholder={translate('请选择动物', 'Please select animal')} allowClear>
                    {animals
                      .filter((a) => a.userId === getFieldValue('userId'))
                      .map((animal) => (
                        <Select.Option key={animal.id} value={animal.id}>
                          {animal.name} ({animal.type})
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="period"
            label={translate('时间范围', 'Period')}
          >
            <RangePicker style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={viewingReport?.title}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => viewingReport && handleDownload(viewingReport)}>
            {translate('下载', 'Download')}
          </Button>,
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            {translate('关闭', 'Close')}
          </Button>,
        ]}
        width={800}
      >
        {viewingReport && (
          <div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{viewingReport.content}</pre>
            {viewingReport.period && (
              <div style={{ marginTop: 16, color: '#666' }}>
                {translate('时间范围', 'Period')}: {dayjs(viewingReport.period.start).format('YYYY-MM-DD')} - {dayjs(viewingReport.period.end).format('YYYY-MM-DD')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

