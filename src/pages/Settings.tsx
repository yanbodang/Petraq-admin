import { Card, Form, Switch, Button, message, Divider, Space, Input, InputNumber } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export default function Settings() {
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('Settings:', values);
      message.success('设置已保存');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>

      <Card title="同步设置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" initialValues={{}}>
          <Form.Item
            name="autoSync"
            label="自动同步"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="syncInterval"
            label="同步间隔（分钟）"
          >
            <InputNumber min={1} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxRetryTimes"
            label="最大重试次数"
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>

      <Card title="通知设置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="emailNotifications"
            label="邮件通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="pushNotifications"
            label="推送通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="alertNotifications"
            label="预警通知"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item
            name="notificationEmail"
            label="通知邮箱"
          >
            <Input type="email" placeholder="admin@petraq.com" />
          </Form.Item>
        </Form>
      </Card>

      <Card title="数据管理" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" block>
            导出所有数据
          </Button>
          <Button block>
            导入数据
          </Button>
          <Button block danger>
            清空测试数据
          </Button>
        </Space>
      </Card>

      <Card title="系统信息">
        <Space direction="vertical">
          <div>系统版本：v1.0.0</div>
          <div>数据库版本：v1.0.0</div>
          <div>最后更新：2025-01-01</div>
        </Space>
      </Card>

      <Divider />

      <Space>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存设置
        </Button>
        <Button onClick={() => form.resetFields()}>
          重置
        </Button>
      </Space>
    </div>
  );
}
