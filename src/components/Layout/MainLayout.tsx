import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Layout, Menu, Select, Space, theme } from 'antd';
import {
  AuditOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  MobileOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { AppLanguage, useLocale } from '../../i18n';
import { useAuth } from '../../auth/AuthContext';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
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
          label: t('menu.petsDevices'),
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
      ];
      return baseItems;
    },
    [currentUser?.role, t]
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
          <h1 style={{ margin: 0, fontSize: 20 }}>{currentUser?.role === 'super_admin' ? t('app.title.super') : t('app.title.family')}</h1>
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
              <Avatar style={{ backgroundColor: '#0f7c6d' }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name ?? translate('模拟用户', 'Mock User')}</div>
                <div style={{ fontSize: 12, color: '#667085' }}>
                  {currentUser?.role === 'super_admin' ? translate('超级管理员', 'Super Admin') : translate('家庭管理员', 'Family Admin')}
                </div>
              </div>
            </Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              {translate('退出', 'Logout')}
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
