import { Alert, Card, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';

export default function AppSsoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithAppCode } = useAuth();
  const { translate } = useLocale();
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const code = params.get('code');
    if (!code) {
      setError(translate('登录链接缺少授权码。', 'The sign-in link is missing its authorization code.'));
      return;
    }
    loginWithAppCode(code).then(() => navigate('/dashboard', { replace: true })).catch(() => {
      setError(translate('一键登录链接无效或已过期，请返回 App 重试。', 'This one-tap sign-in link is invalid or expired. Return to the App and try again.'));
    });
  }, [loginWithAppCode, navigate, params, translate]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f4f8f6' }}>
      <Card style={{ width: '100%', maxWidth: 460, borderRadius: 16, textAlign: 'center' }}>
        <Typography.Title level={3}>{translate('正在安全登录', 'Signing you in securely')}</Typography.Title>
        {error ? <Alert type="error" showIcon message={error} /> : <><Spin size="large" /><Typography.Paragraph type="secondary" style={{ marginTop: 20 }}>{translate('正在验证来自 PetraQ App 的一次性授权。', 'Verifying the one-time authorization from the PetraQ App.')}</Typography.Paragraph></>}
      </Card>
    </main>
  );
}
