import { Card, Form, Switch, Button, message, Divider, Space, Input, InputNumber } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useLocale } from '../i18n';

export default function Settings() {
  const { translate } = useLocale();
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('Settings:', values);
      message.success(translate('设置已保存', 'Settings saved'));
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{translate('系统设置', 'System Settings')}</h2>

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
  );
}
