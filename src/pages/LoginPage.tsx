import { useState } from 'react';
import { Alert, Button, Card, Form, Input, List, Space, Tag, Typography } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoAccounts } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = (location.state as LocationState | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const values = await form.validateFields();
      await login(values.identifier, values.password);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (identifier: string) => {
    form.setFieldsValue({
      identifier,
      password: 'PetraQ123',
    });
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at top left, rgba(24, 144, 255, 0.18), transparent 30%), linear-gradient(135deg, #f6fbff 0%, #eef4ff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div>
              <Tag color="blue">Mock Auth</Tag>
              <Typography.Title level={2} style={{ marginTop: 12, marginBottom: 8 }}>
                PetraQ 管理后台登录
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                这是前端本地 mock 登录，不依赖真实服务端。登录状态会保存在浏览器本地存储中，刷新页面后依然有效。
              </Typography.Paragraph>
            </div>

            {errorMessage && <Alert type="error" showIcon message={errorMessage} />}

            <Form form={form} layout="vertical" size="large" onFinish={handleSubmit}>
              <Form.Item
                name="identifier"
                label="邮箱或手机号"
                rules={[{ required: true, message: '请输入邮箱或手机号' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="admin@petraq.mock / 13800138000" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="PetraQ123" />
              </Form.Item>
              <Button type="primary" icon={<LoginOutlined />} htmlType="submit" loading={submitting} block>
                登录进入后台
              </Button>
            </Form>
          </Space>
        </Card>

        <Card
          bordered={false}
          style={{
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={4} style={{ marginBottom: 8 }}>
                Demo 账号
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                点击任意账号即可自动填充，默认密码统一为 `PetraQ123`。
              </Typography.Paragraph>
            </div>

            <List
              dataSource={demoAccounts}
              renderItem={(account) => (
                <List.Item
                  actions={[
                    <Button key="email" type="link" onClick={() => fillDemoAccount(account.email)}>
                      用邮箱登录
                    </Button>,
                    <Button key="phone" type="link" onClick={() => fillDemoAccount(account.phone)}>
                      用手机号登录
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
                    title={
                      <Space>
                        <span>{account.name}</span>
                        <Tag>{account.role}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Space size={8}>
                          <MailOutlined />
                          <span>{account.email}</span>
                        </Space>
                        <Space size={8}>
                          <MobileOutlined />
                          <span>{account.phone}</span>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Space>
        </Card>
      </div>
    </div>
  );
}
