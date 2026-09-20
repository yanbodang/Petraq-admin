import { Card, Descriptions, Space, Typography } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';

export default function PetraQSettingsPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>{translate('系统设置', 'Settings')}</Typography.Title>
        <Typography.Text type="secondary">
          {translate(
            '生产认证、租户策略和数据留存策略的配置占位。',
            'Configuration placeholders for production authentication, tenant policy, and data retention.'
          )}
        </Typography.Text>
      </div>

      <Card title={isSuperAdmin ? translate('平台设置', 'Platform settings') : translate('家庭设置', 'Family settings')}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label={translate('当前角色', 'Current role')}>
            {isSuperAdmin ? translate('超级管理员', 'Super Admin') : translate('家庭管理员', 'Family Admin')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('数据边界', 'Data boundary')}>
            {isSuperAdmin ? translate('所有家庭和设备', 'All families and devices') : translate('仅当前家庭', 'Current family only')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('原始 BLE 数据', 'Raw BLE data')}>
            {translate(
              '由后端存储和处理，App 与管理后台只读取计算后的快照。',
              'Stored and processed by backend. App and admin read computed snapshots.'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={translate('人的健康数据', 'Human health data')}>
            {translate(
              '必须获得用户明确授权，仅加入家庭并不足以共享。',
              'Requires explicit user consent; family membership alone is not enough.'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
