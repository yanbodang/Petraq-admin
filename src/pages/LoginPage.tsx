import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Spin, Typography } from 'antd';
import { LockOutlined, LoginOutlined, UserOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { AdminLoginChallenge, adminAuthService } from '../services/adminAuth';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { translate } = useLocale();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<AdminLoginChallenge | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const redirectPath = (location.state as LocationState | null)?.from?.pathname || '/dashboard';

  const createQr = useCallback(async (signal?: AbortSignal) => {
    setQrError(null);
    setChallenge(null);
    try {
      setChallenge(await adminAuthService.createLoginChallenge(signal));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setQrError(translate('二维码暂时无法生成，请稍后重试。', 'The QR code is temporarily unavailable. Please try again.'));
    }
  }, [translate]);

  useEffect(() => {
    const controller = new AbortController();
    createQr(controller.signal);
    return () => controller.abort();
  }, [createQr]);

  useEffect(() => {
    if (!challenge) return;
    const controller = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        const session = await adminAuthService.checkLoginChallenge(challenge.id, controller.signal);
        if (session) window.location.reload();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        window.clearInterval(timer);
        setChallenge(null);
        setQrError(translate('二维码已过期，请刷新后重试。', 'The QR code expired. Refresh it to try again.'));
      }
    }, 1800);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [challenge, navigate, redirectPath, translate]);

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
              <Typography.Title level={2} style={{ marginBottom: 8 }}>
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

        <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}>
          <Space direction="vertical" size={18} align="center" style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <Typography.Title level={3} style={{ marginBottom: 8 }}>{translate('使用 PetraQ App 扫码', 'Scan with the PetraQ App')}</Typography.Title>
              <Typography.Paragraph type="secondary">{translate('在 App 设置中打开扫码登录，确认后此页面会自动进入。', 'Open Scan to sign in from App Settings. This page signs in automatically after you confirm.')}</Typography.Paragraph>
            </div>
            {qrError ? <Alert type="warning" showIcon message={qrError} action={<Button size="small" onClick={() => createQr()}>{translate('刷新', 'Refresh')}</Button>} /> : challenge ? (
              <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e9e5', borderRadius: 16 }}>
                <QRCodeSVG value={challenge.qrPayload} size={214} level="M" aria-label={translate('App 登录二维码', 'App sign-in QR code')} />
              </div>
            ) : <Spin size="large" />}
            <Typography.Text type="secondary">{translate('二维码两分钟内有效，且只能使用一次。', 'The QR code expires in two minutes and can only be used once.')}</Typography.Text>
          </Space>
        </Card>

      </div>
    </div>
  );
}
