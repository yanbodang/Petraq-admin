import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Layout, Menu, Select, Space, theme } from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SyncOutlined,
  BankOutlined,
  SettingOutlined,
  MobileOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  FileOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { AppLanguage, useLocale } from '../../i18n';
import { useAuth } from '../../auth/AuthContext';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage, languageOptions } = useLocale();
  const { currentUser, logout } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = useMemo(
    () => [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: t('menu.dashboard'),
      },
      {
        key: '/users',
        icon: <UserOutlined />,
        label: t('menu.users'),
      },
      {
        key: '/user-animals',
        icon: <TeamOutlined />,
        label: t('menu.userAnimals'),
      },
      {
        key: '/devices',
        icon: <MobileOutlined />,
        label: '设备管理',
      },
      {
        key: '/subscriptions',
        icon: <CreditCardOutlined />,
        label: '订阅管理',
      },
      {
        key: '/medical-records',
        icon: <FileTextOutlined />,
        label: '医疗记录',
      },
      {
        key: '/reports',
        icon: <FileOutlined />,
        label: '报告',
      },
      {
        key: '/ai-tips',
        icon: <RobotOutlined />,
        label: 'AI文案库',
      },
      {
        key: '/sync',
        icon: <SyncOutlined />,
        label: t('menu.sync'),
      },
      {
        key: '/organizations',
        icon: <BankOutlined />,
        label: t('menu.organizations'),
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: t('menu.settings'),
      },
    ],
    [t]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={200}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1890ff',
          }}
        >
          {collapsed ? t('app.logo.short') : t('app.logo.full')}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>{t('app.title')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Select
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as AppLanguage)}
              options={languageOptions}
              style={{ width: 140 }}
              aria-label={t('header.language')}
            />
            <Space size={10}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name ?? 'Mock User'}</div>
                <div style={{ fontSize: 12, color: '#667085' }}>{currentUser?.role ?? '未登录'}</div>
              </div>
            </Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              退出
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
