import { Card, Descriptions, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { getScopedData, userName } from '../services/petraqAdminData';
import { localizeMockText } from '../services/textLocalization';

export default function FamiliesPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const role = currentUser?.role ?? 'family_admin';
  const data = getScopedData(role, currentUser?.familyId);

  if (role === 'family_admin') {
    const family = data.families[0];
    return (
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Typography.Title level={2}>{translate('我的家庭', 'My Family')}</Typography.Title>
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label={translate('家庭', 'Family')}>{family?.name}</Descriptions.Item>
            <Descriptions.Item label={translate('所有者', 'Owner')}>{family ? userName(family.ownerUserId) : '-'}</Descriptions.Item>
            <Descriptions.Item label={translate('套餐', 'Plan')}>{localizeMockText(family?.plan, translate)}</Descriptions.Item>
            <Descriptions.Item label={translate('地区', 'Region')}>{localizeMockText(family?.region, translate)}</Descriptions.Item>
            <Descriptions.Item label={translate('成员', 'Members')}>{family?.memberCount}</Descriptions.Item>
            <Descriptions.Item label={translate('宠物', 'Pets')}>{family?.petCount}</Descriptions.Item>
            <Descriptions.Item label={translate('设备', 'Devices')}>{family?.deviceCount}</Descriptions.Item>
            <Descriptions.Item label={translate('未处理告警', 'Open alerts')}>{family?.openAlerts}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>{translate('家庭管理', 'Family Management')}</Typography.Title>
        <Typography.Text type="secondary">
          {translate('超级管理员可以查看所有 PetraQ 家庭租户。', 'Super Admin can see every PetraQ family tenant.')}
        </Typography.Text>
      </div>
      <Card>
        <Table
          rowKey="id"
          dataSource={data.families}
          columns={[
            { title: translate('家庭', 'Family'), dataIndex: 'name' },
            {
              title: translate('所有者', 'Owner'),
              dataIndex: 'ownerUserId',
              render: (value: string) => userName(value),
            },
            { title: translate('地区', 'Region'), dataIndex: 'region', render: (value: string) => localizeMockText(value, translate) },
            {
              title: translate('套餐', 'Plan'),
              dataIndex: 'plan',
              render: (value: string) => <Tag color="green">{localizeMockText(value, translate)}</Tag>,
            },
            { title: translate('成员', 'Members'), dataIndex: 'memberCount' },
            { title: translate('宠物', 'Pets'), dataIndex: 'petCount' },
            { title: translate('设备', 'Devices'), dataIndex: 'deviceCount' },
            {
              title: translate('创建时间', 'Created'),
              dataIndex: 'createdAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
