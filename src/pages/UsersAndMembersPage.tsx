import { Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import { familyName, getScopedData, userName } from '../services/petraqAdminData';

const statusColor = {
  active: 'green',
  invited: 'gold',
  disabled: 'red',
};

export default function UsersAndMembersPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const role = currentUser?.role ?? 'family_admin';
  const data = getScopedData(role, currentUser?.familyId);

  const userStatusLabel = (status: keyof typeof statusColor) => {
    const labels: Record<keyof typeof statusColor, string> = {
      active: translate('已启用', 'Active'),
      invited: translate('已邀请', 'Invited'),
      disabled: translate('已停用', 'Disabled'),
    };
    return labels[status];
  };

  const memberRoleLabel = (memberRole: string) => {
    const labels: Record<string, string> = {
      owner: translate('所有者', 'Owner'),
      admin: translate('管理员', 'Admin'),
      member: translate('成员', 'Member'),
      viewer: translate('只读', 'Viewer'),
    };
    return labels[memberRole] ?? memberRole;
  };

  const invitationLabel = (state: string) => {
    const labels: Record<string, string> = {
      accepted: translate('已接受', 'Accepted'),
      pending: translate('待接受', 'Pending'),
    };
    return labels[state] ?? state;
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>
          {role === 'super_admin' ? translate('用户管理', 'Users') : translate('家庭成员', 'Family Members')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {role === 'super_admin'
            ? translate('查看所有家庭下的平台用户。', 'Platform users across all families.')
            : translate('查看当前家庭的受邀成员和成员角色。', 'Members invited into this family and their roles.')}
        </Typography.Text>
      </div>

      {role === 'super_admin' ? (
        <Card>
          <Table
            rowKey="id"
            dataSource={data.users}
            columns={[
              { title: translate('姓名', 'Name'), dataIndex: 'name' },
              { title: translate('邮箱', 'Email'), dataIndex: 'email' },
              { title: translate('手机号', 'Phone'), dataIndex: 'phone' },
              {
                title: translate('家庭', 'Families'),
                dataIndex: 'familyIds',
                render: (value: string[]) => value.map((id) => <Tag key={id}>{familyName(id)}</Tag>),
              },
              {
                title: translate('状态', 'Status'),
                dataIndex: 'status',
                render: (value: keyof typeof statusColor) => <Tag color={statusColor[value]}>{userStatusLabel(value)}</Tag>,
              },
              {
                title: translate('最后在线', 'Last seen'),
                dataIndex: 'lastSeenAt',
                render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
              },
            ]}
          />
        </Card>
      ) : (
        <Card>
          <Table
            rowKey="id"
            dataSource={data.members}
            columns={[
              {
                title: translate('成员', 'Member'),
                dataIndex: 'userId',
                render: (value: string) => userName(value),
              },
              {
                title: translate('角色', 'Role'),
                dataIndex: 'role',
                render: (value: string) => <Tag color={value === 'owner' ? 'green' : 'blue'}>{memberRoleLabel(value)}</Tag>,
              },
              {
                title: translate('邀请状态', 'Invitation'),
                dataIndex: 'invitationState',
                render: (value: string) => <Tag color={value === 'accepted' ? 'green' : 'gold'}>{invitationLabel(value)}</Tag>,
              },
              {
                title: translate('加入时间', 'Joined'),
                dataIndex: 'joinedAt',
                render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
              },
            ]}
          />
        </Card>
      )}
    </Space>
  );
}
