import { Card, Form, Switch, Button, message, Divider, Space, Input, InputNumber, Tabs, Table, Tag, Modal, Select, DatePicker, Popconfirm } from 'antd';
import { SaveOutlined, DownloadOutlined, FileTextOutlined, CustomerServiceOutlined, DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocale } from '../i18n';
import { useState, useEffect } from 'react';
import { dataManager } from '../services/dataManager';
import { Invoice, InvoiceStatus, DataRequest, DataRequestType, DataRequestStatus, User, PaymentType } from '../types';
import dayjs from 'dayjs';

export default function Settings() {
  const { translate } = useLocale();
  const [form] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [requestForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('system');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [users] = useState<User[]>(dataManager.getUsers());

  useEffect(() => {
    updateInvoices();
    updateDataRequests();
  }, []);

  const updateInvoices = () => {
    setInvoices(dataManager.getInvoices());
  };

  const updateDataRequests = () => {
    setDataRequests(dataManager.getDataRequests());
  };

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

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    invoiceForm.resetFields();
    invoiceForm.setFieldsValue({
      issueDate: dayjs(),
      dueDate: dayjs().add(30, 'days'),
      status: InvoiceStatus.PENDING,
    });
    setIsInvoiceModalVisible(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    invoiceForm.setFieldsValue({
      userId: invoice.userId,
      amount: invoice.amount,
      type: invoice.type,
      status: invoice.status,
      issueDate: dayjs(invoice.issueDate),
      dueDate: dayjs(invoice.dueDate),
      description: invoice.description,
    });
    setIsInvoiceModalVisible(true);
  };

  const handleDeleteInvoice = (id: string) => {
    dataManager.removeInvoice(id);
    updateInvoices();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmitInvoice = async () => {
    try {
      const values = await invoiceForm.validateFields();
      if (editingInvoice) {
        const updated: Invoice = {
          ...editingInvoice,
          ...values,
          issueDate: values.issueDate.toDate(),
          dueDate: values.dueDate.toDate(),
        };
        dataManager.updateInvoice(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newInvoice: Invoice = {
          id: `invoice-${Date.now()}`,
          userId: values.userId,
          amount: values.amount,
          type: values.type,
          status: values.status || InvoiceStatus.PENDING,
          issueDate: values.issueDate.toDate(),
          dueDate: values.dueDate.toDate(),
          description: values.description,
          invoiceNumber: `INV-${Date.now()}`,
        };
        dataManager.addInvoice(newInvoice);
        message.success(translate('创建成功', 'Created'));
      }
      setIsInvoiceModalVisible(false);
      updateInvoices();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCreateRequest = (type: DataRequestType) => {
    requestForm.resetFields();
    requestForm.setFieldsValue({
      type,
      status: DataRequestStatus.PENDING,
    });
    setIsRequestModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    try {
      const values = await requestForm.validateFields();
      const newRequest: DataRequest = {
        id: `request-${Date.now()}`,
        userId: values.userId,
        type: values.type,
        status: DataRequestStatus.PENDING,
        requestDate: new Date(),
        description: values.description,
      };
      dataManager.addDataRequest(newRequest);
      message.success(translate('请求已提交', 'Request submitted'));
      setIsRequestModalVisible(false);
      updateDataRequests();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

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
                <Card 
                  title={
                    <Space>
                      <DollarOutlined />
                      {translate('付费管理', 'Payment Management')}
                    </Space>
                  } 
                  style={{ marginBottom: 16 }}
                >
                  <Table
                    dataSource={invoices}
                    rowKey="id"
                    columns={[
                      { title: translate('发票号', 'Invoice #'), dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
                      {
                        title: translate('用户', 'User'),
                        dataIndex: 'userId',
                        key: 'userId',
                        render: (userId: string) => {
                          const user = users.find((u) => u.id === userId);
                          return user?.username || userId;
                        },
                      },
                      { title: translate('类型', 'Type'), dataIndex: 'type', key: 'type' },
                      { title: translate('金额', 'Amount'), dataIndex: 'amount', key: 'amount', render: (amt) => `¥${amt}` },
                      { title: translate('开票日期', 'Issue Date'), dataIndex: 'issueDate', key: 'issueDate', render: (d) => dayjs(d).format('YYYY-MM-DD') },
                      { title: translate('到期日期', 'Due Date'), dataIndex: 'dueDate', key: 'dueDate', render: (d) => dayjs(d).format('YYYY-MM-DD') },
                      {
                        title: translate('状态', 'Status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: string) => {
                          const colorMap: Record<string, string> = {
                            待支付: 'orange',
                            已支付: 'green',
                            已逾期: 'red',
                            已取消: 'default',
                          };
                          return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
                        },
                      },
                      {
                        title: translate('操作', 'Actions'),
                        key: 'action',
                        render: (_: any, record: Invoice) => (
                          <Space>
                            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditInvoice(record)}>
                              {translate('编辑', 'Edit')}
                            </Button>
                            <Popconfirm
                              title={translate('确定要删除这张发票吗？', 'Delete this invoice?')}
                              onConfirm={() => handleDeleteInvoice(record.id)}
                              okText={translate('确定', 'Confirm')}
                              cancelText={translate('取消', 'Cancel')}
                            >
                              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                                {translate('删除', 'Delete')}
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                  <Space style={{ marginTop: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInvoice}>
                      {translate('创建发票', 'Create Invoice')}
                    </Button>
                  </Space>
                </Card>

                <Card 
                  title={
                    <Space>
                      <FileTextOutlined />
                      {translate('数据/报告请求', 'Data/Report Requests')}
                    </Space>
                  } 
                  style={{ marginBottom: 16 }}
                >
                  <Table
                    dataSource={dataRequests}
                    rowKey="id"
                    columns={[
                      {
                        title: translate('类型', 'Type'),
                        dataIndex: 'type',
                        key: 'type',
                        render: (type: string) => {
                          const colorMap: Record<string, string> = {
                            数据导出: 'blue',
                            报告生成: 'green',
                            数据分析: 'purple',
                          };
                          return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                        },
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
                      { title: translate('请求日期', 'Request Date'), dataIndex: 'requestDate', key: 'requestDate', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
                      {
                        title: translate('状态', 'Status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: string) => {
                          const colorMap: Record<string, string> = {
                            待处理: 'orange',
                            处理中: 'blue',
                            已完成: 'green',
                            失败: 'red',
                          };
                          return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
                        },
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                  <Space style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={() => handleCreateRequest(DataRequestType.DATA_EXPORT)}>
                      {translate('请求数据导出', 'Request Data Export')}
                    </Button>
                    <Button onClick={() => handleCreateRequest(DataRequestType.REPORT_GENERATION)}>
                      {translate('请求报告', 'Request Report')}
                    </Button>
                  </Space>
                </Card>

                <Card 
                  title={
                    <Space>
                      <CustomerServiceOutlined />
                      {translate('客户支持', 'Customer Support')}
                    </Space>
                  }
                >
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

      {/* 发票创建/编辑模态框 */}
      <Modal
        title={editingInvoice ? translate('编辑发票', 'Edit Invoice') : translate('创建发票', 'Create Invoice')}
        open={isInvoiceModalVisible}
        onOk={handleSubmitInvoice}
        onCancel={() => setIsInvoiceModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={invoiceForm} layout="vertical">
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
            name="type"
            label={translate('类型', 'Type')}
            rules={[{ required: true, message: translate('请输入类型', 'Please enter type') }]}
          >
            <Select placeholder={translate('请选择类型', 'Please select type')}>
              {Object.values(PaymentType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label={translate('金额', 'Amount')}
            rules={[{ required: true, message: translate('请输入金额', 'Please enter amount') }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item
            name="status"
            label={translate('状态', 'Status')}
          >
            <Select>
              {Object.values(InvoiceStatus).map((status) => (
                <Select.Option key={status} value={status}>
                  {status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="issueDate"
            label={translate('开票日期', 'Issue Date')}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="dueDate"
            label={translate('到期日期', 'Due Date')}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label={translate('描述', 'Description')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 数据请求模态框 */}
      <Modal
        title={translate('创建数据请求', 'Create Data Request')}
        open={isRequestModalVisible}
        onOk={handleSubmitRequest}
        onCancel={() => setIsRequestModalVisible(false)}
        okText={translate('提交', 'Submit')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={requestForm} layout="vertical">
          <Form.Item
            name="type"
            label={translate('类型', 'Type')}
            rules={[{ required: true }]}
          >
            <Select disabled>
              {Object.values(DataRequestType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
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
            name="description"
            label={translate('描述', 'Description')}
          >
            <Input.TextArea rows={4} placeholder={translate('请输入请求描述', 'Please enter request description')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
