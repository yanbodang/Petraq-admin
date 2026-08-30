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
    <main className="login-page">
      <Card bordered={false} className="login-panel">
        <div className="login-panel__grid">
          <section className="login-panel__qr" aria-labelledby="qr-login-title">
            <Space direction="vertical" size={20} align="center" style={{ width: '100%', textAlign: 'center' }}>
              <Typography.Title id="qr-login-title" level={2}>{translate('使用 App 扫码登录', 'Scan with the App')}</Typography.Title>
              <Typography.Paragraph type="secondary">{translate('打开 PetraQ App，在设置中选择“扫描 Admin 登录二维码”。', 'Open PetraQ App and choose “Scan Admin login QR code” in Settings.')}</Typography.Paragraph>
              {qrError ? <Alert type="warning" showIcon message={qrError} action={<Button size="small" onClick={() => createQr()}>{translate('刷新', 'Refresh')}</Button>} /> : challenge ? (
                <div className="login-panel__qr-code">
                  <QRCodeSVG value={challenge.qrPayload} size={236} level="M" aria-label={translate('App 登录二维码', 'App sign-in QR code')} />
                </div>
              ) : <Spin size="large" />}
              <Typography.Text type="secondary">{translate('在 App 中确认后，此页面会自动登录。二维码两分钟内有效。', 'Confirm in the App and this page will sign in automatically. The QR code expires in two minutes.')}</Typography.Text>
            </Space>
          </section>

          <section className="login-panel__form" aria-labelledby="email-login-title">
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div>
              <Typography.Title id="email-login-title" level={2} style={{ marginBottom: 8 }}>{translate('邮箱登录', 'Email sign in')}</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{translate('使用你在 PetraQ App 注册的邮箱和密码。', 'Use the email and password registered in the PetraQ App.')}</Typography.Paragraph>
            </div>
              {errorMessage && <Alert type="error" showIcon message={errorMessage} />}
              <Form form={form} layout="vertical" size="large" onFinish={handleSubmit}>
                <Form.Item name="identifier" label={translate('邮箱', 'Email')} rules={[{ required: true, type: 'email', message: translate('请输入有效邮箱', 'Enter a valid email') }]}>
                  <Input name="email" type="email" autoComplete="email" spellCheck={false} prefix={<UserOutlined />} placeholder={translate('请输入邮箱', 'name@example.com')} />
                </Form.Item>
                <Form.Item name="password" label={translate('密码', 'Password')} rules={[{ required: true, message: translate('请输入密码', 'Please enter password') }]}>
                  <Input.Password name="password" autoComplete="current-password" prefix={<LockOutlined />} placeholder={translate('请输入密码', 'Enter password…')} />
                </Form.Item>
                <Button type="primary" icon={<LoginOutlined />} htmlType="submit" loading={submitting} block>{translate('登录', 'Sign in')}</Button>
              </Form>
            </Space>
          </section>
        </div>
      </Card>
    </main>
  );
}
