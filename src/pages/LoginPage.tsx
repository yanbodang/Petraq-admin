import { useState } from 'react';
import { Alert, Button, Card, Form, Input, List, Space, Tag, Typography } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoAccounts } = useAuth();
  const { translate } = useLocale();
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
        const translatedMessage: Record<string, string> = {
          请输入账号和密码: translate('请输入账号和密码', 'Please enter account and password'),
          账号或密码错误: translate('账号或密码错误', 'Invalid account or password'),
        };
        setErrorMessage(translatedMessage[error.message] ?? error.message);
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
          'radial-gradient(circle at top left, rgba(15, 124, 109, 0.16), transparent 30%), linear-gradient(135deg, #f7faf9 0%, #eef5f3 100%)',
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
              <Tag color="green">PetraQ Admin MVP</Tag>
              <Typography.Title level={2} style={{ marginTop: 12, marginBottom: 8 }}>
                {translate('PetraQ 管理平台登录', 'Sign in to PetraQ Admin')}
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {translate(
                  '根据新 App 的家庭、宠物设备、授权和平台运维模型重建。超级管理员查看全平台，家庭管理员只查看自己的家庭。',
                  'Rebuilt around the new App model for families, pet devices, consent, and platform operations. Super Admin sees the platform; Family Admin sees only their family.'
                )}
              </Typography.Paragraph>
            </div>

            {errorMessage && <Alert type="error" showIcon message={errorMessage} />}

            <Form form={form} layout="vertical" size="large" onFinish={handleSubmit}>
              <Form.Item
                name="identifier"
                label={translate('邮箱', 'Email')}
                rules={[{ required: true, type: 'email', message: translate('请输入有效邮箱', 'Enter a valid email') }]}
              >
                <Input name="email" type="email" autoComplete="email" spellCheck={false} prefix={<UserOutlined />} placeholder="name@example.com" />
              </Form.Item>
              <Form.Item
                name="password"
                label={translate('密码', 'Password')}
                rules={[{ required: true, message: translate('请输入密码', 'Please enter password') }]}
              >
                <Input.Password name="password" autoComplete="current-password" prefix={<LockOutlined />} placeholder={translate('输入密码…', 'Enter password…')} />
              </Form.Item>
              <Button type="primary" icon={<LoginOutlined />} htmlType="submit" loading={submitting} block>
                {translate('登录进入后台', 'Sign in')}
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
                {translate('Demo 账号', 'Demo accounts')}
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {translate('点击任意账号即可自动填充，默认密码统一为 PetraQ123。', 'Click an account to autofill. The demo password is PetraQ123.')}
              </Typography.Paragraph>
            </div>

            <List
              dataSource={demoAccounts}
              renderItem={(account) => (
                <List.Item
                  actions={[
                    <Button key="email" type="link" onClick={() => fillDemoAccount(account.email)}>
                      {translate('用邮箱登录', 'Use email')}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
                    title={
                      <Space>
                        <span>{account.name}</span>
                        <Tag color={account.role === 'super_admin' ? 'purple' : 'green'}>
                          {account.role === 'super_admin' ? translate('超级管理员', 'Super Admin') : translate('家庭管理员', 'Family Admin')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Space size={8}>
                          <MailOutlined />
                          <span>{account.email}</span>
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
