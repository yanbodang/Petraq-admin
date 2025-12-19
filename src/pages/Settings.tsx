import { Card, Form, Switch, Button, message, Divider, Space, Input, InputNumber, Tabs, Select, DatePicker, Table, Tag } from 'antd';
import { SaveOutlined, DownloadOutlined, FileTextOutlined, CustomerServiceOutlined, DollarOutlined } from '@ant-design/icons';
import { useLocale } from '../i18n';
import { useState } from 'react';
import { dataManager } from '../services/dataManager';
import dayjs from 'dayjs';

export default function Settings() {
  const { translate } = useLocale();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('system');

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('Settings:', values);
      message.success(translate('设置已保存', 'Settings saved'));
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    const data = dataManager.exportData(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petraq-data-${dayjs().format('YYYY-MM-DD')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(translate('导出成功', 'Export successful'));
  };

  // 模拟数据请求记录
  const dataRequests = [
    { id: '1', type: '数据导出', user: 'farmer1', date: new Date(), status: '已完成' },
    { id: '2', type: '报告生成', user: 'vet1', date: new Date(), status: '处理中' },
  ];

  // 模拟发票记录
  const invoices = [
    { id: '1', amount: 299, type: '月费', date: new Date(), status: '已支付' },
    { id: '2', amount: 2999, type: '年费', date: new Date(), status: '待支付' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{translate('设置', 'Settings')}</h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'system',
            label: translate('系统设置', 'System Settings'),
            children: (
              <div>
                <Card title={translate('同步设置', 'Sync Settings')} style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" initialValues={{}}>
          <Form.Item
            name="autoSync"
            label={translate('自动同步', 'Auto Sync')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="syncInterval"
            label={translate('同步间隔（分钟）', 'Sync Interval (minutes)')}
          >
            <InputNumber min={1} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxRetryTimes"
            label={translate('最大重试次数', 'Max Retries')}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>

      <Card title={translate('通知设置', 'Notification Settings')} style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="emailNotifications"
            label={translate('邮件通知', 'Email Notifications')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="pushNotifications"
            label={translate('推送通知', 'Push Notifications')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="alertNotifications"
            label={translate('预警通知', 'Alert Notifications')}
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item
            name="notificationEmail"
            label={translate('通知邮箱', 'Notification Email')}
          >
            <Input type="email" placeholder="admin@petraq.com" />
          </Form.Item>
        </Form>
      </Card>

      <Card title={translate('数据管理', 'Data Management')} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" block>
            {translate('导出所有数据', 'Export all data')}
          </Button>
          <Button block>
            {translate('导入数据', 'Import data')}
          </Button>
          <Button block danger>
            {translate('清空测试数据', 'Clear test data')}
          </Button>
        </Space>
      </Card>

      <Card title={translate('系统信息', 'System Info')}>
        <Space direction="vertical">
          <div>{translate('系统版本', 'System Version')}：v1.0.0</div>
          <div>{translate('数据库版本', 'DB Version')}：v1.0.0</div>
          <div>{translate('最后更新', 'Last Update')}：2025-01-01</div>
        </Space>
      </Card>

                <Divider />

                <Space>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                    {translate('保存设置', 'Save')}
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    {translate('重置', 'Reset')}
                  </Button>
                </Space>
              </div>
            ),
          },
          {
            key: 'user',
            label: translate('用户设置', 'User Settings'),
            children: (
              <div>
                <Card title={translate('付费管理', 'Payment Management')} style={{ marginBottom: 16 }} icon={<DollarOutlined />}>
                  <Table
                    dataSource={invoices}
                    rowKey="id"
                    columns={[
                      { title: translate('类型', 'Type'), dataIndex: 'type', key: 'type' },
                      { title: translate('金额', 'Amount'), dataIndex: 'amount', key: 'amount', render: (amt) => `¥${amt}` },
                      { title: translate('日期', 'Date'), dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('YYYY-MM-DD') },
                      {
                        title: translate('状态', 'Status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === '已支付' ? 'green' : 'orange'}>{status}</Tag>
                        ),
                      },
                    ]}
                    pagination={false}
                  />
                  <Space style={{ marginTop: 16 }}>
                    <Button type="primary">{translate('创建发票', 'Create Invoice')}</Button>
                    <Button>{translate('查看历史', 'View History')}</Button>
                  </Space>
                </Card>

                <Card title={translate('数据/报告请求', 'Data/Report Requests')} style={{ marginBottom: 16 }} icon={<FileTextOutlined />}>
                  <Table
                    dataSource={dataRequests}
                    rowKey="id"
                    columns={[
                      { title: translate('类型', 'Type'), dataIndex: 'type', key: 'type' },
                      { title: translate('用户', 'User'), dataIndex: 'user', key: 'user' },
                      { title: translate('日期', 'Date'), dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
                      {
                        title: translate('状态', 'Status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === '已完成' ? 'green' : 'blue'}>{status}</Tag>
                        ),
                      },
                    ]}
                    pagination={false}
                  />
                  <Space style={{ marginTop: 16 }}>
                    <Button type="primary">{translate('请求数据导出', 'Request Data Export')}</Button>
                    <Button>{translate('请求报告', 'Request Report')}</Button>
                  </Space>
                </Card>

                <Card title={translate('客户支持', 'Customer Support')} icon={<CustomerServiceOutlined />}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button block>{translate('联系客服', 'Contact Support')}</Button>
                    <Button block>{translate('常见问题', 'FAQ')}</Button>
                    <Button block>{translate('提交反馈', 'Submit Feedback')}</Button>
                  </Space>
                </Card>
              </div>
            ),
          },
          {
            key: 'data',
            label: translate('数据管理', 'Data Management'),
            children: (
              <Card title={translate('数据导出分析', 'Data Export & Analysis')}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <h4>{translate('导出数据', 'Export Data')}</h4>
                    <Space>
                      <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExportData('json')}>
                        {translate('导出为JSON', 'Export as JSON')}
                      </Button>
                      <Button icon={<DownloadOutlined />} onClick={() => handleExportData('csv')}>
                        {translate('导出为CSV', 'Export as CSV')}
                      </Button>
                    </Space>
                  </div>
                  <Divider />
                  <div>
                    <h4>{translate('数据分析', 'Data Analysis')}</h4>
                    <p>{translate('数据导出功能允许您导出所有用户、动物、设备和健康数据，用于进一步分析。', 'Data export allows you to export all users, animals, devices, and health data for further analysis.')}</p>
                  </div>
                  <Divider />
                  <Button block danger>
                    {translate('清空测试数据', 'Clear test data')}
                  </Button>
                </Space>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
