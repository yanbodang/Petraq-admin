import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Drawer, Grid, Layout, Menu, Select, Space, theme } from 'antd';
import {
  AuditOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  MobileOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  HeartOutlined,
  QrcodeOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { AppLanguage, useLocale } from '../../i18n';
import { useAuth } from '../../auth/AuthContext';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const navigate = useNavigate();
  const location = useLocation();
  const { t, translate, language, setLanguage, languageOptions } = useLocale();
  const { currentUser, logout } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = useMemo(
    () => {
      const baseItems = [
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: t('menu.dashboard'),
        },
        {
          key: '/families',
          icon: <HomeOutlined />,
          label: currentUser?.role === 'super_admin' ? t('menu.families') : t('menu.family'),
        },
        {
          key: '/users',
          icon: currentUser?.role === 'super_admin' ? <UserOutlined /> : <TeamOutlined />,
          label: currentUser?.role === 'super_admin' ? t('menu.users') : t('menu.members'),
        },
        {
          key: '/pets-devices',
          icon: <MobileOutlined />,
          label: t('menu.pets'),
        },
        {
          key: '/health',
          icon: <HeartOutlined />,
          label: t('menu.health'),
        },
        {
          key: '/invitations',
          icon: <QrcodeOutlined />,
          label: t('menu.invitations'),
        },
        {
          key: '/medical',
          icon: <MedicineBoxOutlined />,
          label: t('menu.medical'),
        },
        {
          key: '/consent',
          icon: <SafetyCertificateOutlined />,
          label: t('menu.consent'),
        },
        {
          key: '/operations',
          icon: <AuditOutlined />,
          label: currentUser?.role === 'super_admin' ? t('menu.operations') : t('menu.audit'),
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: t('menu.settings'),
        },
        {
          key: '/device-data',
          icon: <LineChartOutlined />,
          label: t('menu.deviceData'),
        },
      ];
      return baseItems;
    },
    [currentUser?.role, t]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <a className="skip-link" href="#main-content">{translate('跳到主要内容', 'Skip to main content')}</a>
      {!compact && <Sider
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
            color: '#0f7c6d',
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
      </Sider>}
      <Drawer
        title={t('app.logo.full')}
        placement="left"
        width={280}
        open={compact && mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: 16 }}>
          <Select
            value={language}
            onChange={(value) => setLanguage(value as AppLanguage)}
            options={languageOptions}
            style={{ width: '100%' }}
            aria-label={t('header.language')}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => { navigate(key); setMobileNavOpen(false); }}
        />
      </Drawer>
      <Layout>
        <Header
          style={{
            padding: compact ? '0 16px' : '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space size={8}>
            {compact && <Button type="text" icon={<MenuOutlined />} aria-label={translate('打开导航', 'Open navigation')} onClick={() => setMobileNavOpen(true)} />}
            <h1 className="admin-title">{currentUser?.role === 'super_admin' ? t('app.title.super') : t('app.title.family')}</h1>
          </Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!compact && <Select
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as AppLanguage)}
              options={languageOptions}
              style={{ width: 140 }}
              aria-label={t('header.language')}
            />}
            {!compact && <Space size={10}>
              <Avatar style={{ backgroundColor: '#0f7c6d' }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name ?? translate('用户', 'User')}</div>
                <div style={{ fontSize: 12, color: '#667085' }}>
                  {currentUser?.role === 'super_admin' ? translate('超级管理员', 'Super Admin') : translate('家庭管理员', 'Family Admin')}
                </div>
              </div>
            </Space>}
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              {compact ? null : translate('退出', 'Logout')}
            </Button>
          </div>
        </Header>
        <Content
          id="main-content"
          style={{
            margin: compact ? 0 : '24px 16px',
            padding: compact ? 16 : 24,
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
