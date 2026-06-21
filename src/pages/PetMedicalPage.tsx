import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n';
import {
  familyName,
  getScopedData,
  petName,
  type PetMedicalRecordType,
  type PetMedicalReportStatus,
  type PetMedicalRiskLevel,
} from '../services/petraqAdminData';
import { localizeMockText } from '../services/textLocalization';

const recordColor: Record<PetMedicalRecordType, string> = {
  vaccination: 'green',
  checkup: 'blue',
  diagnosis: 'red',
  medication: 'gold',
  procedure: 'purple',
  lab_result: 'cyan',
};

const reportColor: Record<PetMedicalReportStatus, string> = {
  ready: 'green',
  processing: 'blue',
  needs_review: 'gold',
};

const riskColor: Record<PetMedicalRiskLevel, string> = {
  normal: 'green',
  watch: 'gold',
  urgent: 'red',
};

export default function PetMedicalPage() {
  const { currentUser } = useAuth();
  const { translate } = useLocale();
  const data = getScopedData(currentUser?.role ?? 'family_admin', currentUser?.familyId);

  const upcomingRecords = data.medicalRecords.filter((record) => {
    if (!record.nextDueAt) return false;
    const due = dayjs(record.nextDueAt);
    return due.isAfter(dayjs().subtract(1, 'day')) && due.isBefore(dayjs().add(30, 'day'));
  });
  const reviewReports = data.medicalReports.filter((report) => report.status === 'needs_review');

  const recordLabel = (type: PetMedicalRecordType) => {
    const labels: Record<PetMedicalRecordType, string> = {
      vaccination: translate('疫苗', 'Vaccine'),
      checkup: translate('体检', 'Checkup'),
      diagnosis: translate('诊断', 'Diagnosis'),
      medication: translate('用药', 'Medication'),
      procedure: translate('治疗', 'Procedure'),
      lab_result: translate('化验', 'Lab result'),
    };
    return labels[type];
  };

  const reportStatusLabel = (status: PetMedicalReportStatus) => {
    const labels: Record<PetMedicalReportStatus, string> = {
      ready: translate('已生成', 'Ready'),
      processing: translate('处理中', 'Processing'),
      needs_review: translate('需复核', 'Needs review'),
    };
    return labels[status];
  };

  const riskLabel = (risk: PetMedicalRiskLevel) => {
    const labels: Record<PetMedicalRiskLevel, string> = {
      normal: translate('正常', 'Normal'),
      watch: translate('关注', 'Watch'),
      urgent: translate('紧急', 'Urgent'),
    };
    return labels[risk];
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2}>{translate('宠物医疗', 'Pet Medical')}</Typography.Title>
        <Typography.Text type="secondary">
          {translate(
            '管理宠物医疗记录、兽医上传资料、后端生成的健康报告，以及即将到期的照护事项。',
            'Manage pet medical records, vet uploads, backend-generated health reports, and upcoming care.'
          )}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('医疗记录', 'Medical records')} value={data.medicalRecords.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('医疗报告', 'Medical reports')} value={data.medicalReports.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('30 天内到期', 'Due in 30 days')} value={upcomingRecords.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={translate('需要复核', 'Needs review')} value={reviewReports.length} />
          </Card>
        </Col>
      </Row>

      <Alert
        showIcon
        type="info"
        message={translate('医疗模块只针对宠物', 'Pet-only medical scope')}
        description={translate(
          '人的健康数据仍然只在授权后展示，不进入宠物医疗记录或宠物医疗报告。',
          'Human health data remains consent-gated and is not part of pet medical records or reports.'
        )}
      />

      <Card title={translate('医疗记录', 'Medical records')}>
        <Table
          rowKey="id"
          dataSource={data.medicalRecords}
          columns={[
            {
              title: translate('宠物', 'Pet'),
              dataIndex: 'petId',
              render: (value: string) => petName(value),
            },
            {
              title: translate('家庭', 'Family'),
              dataIndex: 'familyId',
              render: (value: string) => familyName(value),
            },
            {
              title: translate('类型', 'Type'),
              dataIndex: 'type',
              render: (value: PetMedicalRecordType) => <Tag color={recordColor[value]}>{recordLabel(value)}</Tag>,
            },
            { title: translate('标题', 'Title'), dataIndex: 'title', render: (value: string) => localizeMockText(value, translate) },
            { title: translate('机构', 'Clinic'), dataIndex: 'clinic' },
            { title: translate('兽医', 'Veterinarian'), dataIndex: 'veterinarian' },
            {
              title: translate('日期', 'Date'),
              dataIndex: 'occurredAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
            },
            {
              title: translate('下次到期', 'Next due'),
              dataIndex: 'nextDueAt',
              render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
            },
            {
              title: translate('可见范围', 'Visibility'),
              dataIndex: 'visibility',
              render: (value: string) => (
                <Tag color={value === 'family' ? 'green' : 'default'}>
                  {value === 'family' ? translate('家庭可见', 'Family') : translate('仅主人', 'Owner only')}
                </Tag>
              ),
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <Typography.Text type="secondary">{localizeMockText(record.summary, translate)}</Typography.Text>
            ),
          }}
        />
      </Card>

      <Card title={translate('医疗报告', 'Medical reports')}>
        <Table
          rowKey="id"
          dataSource={data.medicalReports}
          columns={[
            {
              title: translate('宠物', 'Pet'),
              dataIndex: 'petId',
              render: (value: string) => petName(value),
            },
            {
              title: translate('家庭', 'Family'),
              dataIndex: 'familyId',
              render: (value: string) => familyName(value),
            },
            { title: translate('标题', 'Title'), dataIndex: 'title', render: (value: string) => localizeMockText(value, translate) },
            {
              title: translate('风险', 'Risk'),
              dataIndex: 'riskLevel',
              render: (value: PetMedicalRiskLevel) => <Tag color={riskColor[value]}>{riskLabel(value)}</Tag>,
            },
            {
              title: translate('状态', 'Status'),
              dataIndex: 'status',
              render: (value: PetMedicalReportStatus) => <Tag color={reportColor[value]}>{reportStatusLabel(value)}</Tag>,
            },
            {
              title: translate('来源', 'Source'),
              dataIndex: 'source',
              render: (value: string) => (value === 'backend_algorithm' ? translate('后端算法', 'Backend') : translate('兽医上传', 'Vet upload')),
            },
            {
              title: translate('生成时间', 'Generated'),
              dataIndex: 'generatedAt',
              render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <Typography.Text type="secondary">{localizeMockText(record.summary, translate)}</Typography.Text>
            ),
          }}
        />
      </Card>
    </Space>
  );
}
