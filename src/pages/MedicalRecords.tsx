import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, Tag, Popconfirm, message, DatePicker, Input as AntInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { dataManager } from '../services/dataManager';
import { MedicalRecord, MedicalRecordType, Animal, User } from '../types';
import dayjs from 'dayjs';
import { useLocale } from '../i18n';

const { Search, TextArea } = AntInput;

export default function MedicalRecords() {
  const { translate } = useLocale();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [form] = Form.useForm();
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
  const [animals] = useState<Animal[]>(dataManager.getAllAnimals());
  const [users] = useState<User[]>(dataManager.getUsers());

  useEffect(() => {
    updateRecords();
  }, [selectedAnimalId]);

  const updateRecords = () => {
    const allRecords = dataManager.getMedicalRecords(selectedAnimalId || undefined);
    setRecords(allRecords);
    setFilteredRecords(allRecords);
  };

  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredRecords(records);
      return;
    }
    const filtered = records.filter(
      (record) =>
        record.title.toLowerCase().includes(value.toLowerCase()) ||
        record.description?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRecords(filtered);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      animalId: record.animalId,
      type: record.type,
      title: record.title,
      description: record.description,
      date: dayjs(record.date),
      veterinarian: record.veterinarian,
      clinic: record.clinic,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    dataManager.removeMedicalRecord(id);
    updateRecords();
    message.success(translate('删除成功', 'Deleted'));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        const updated: MedicalRecord = {
          ...editingRecord,
          ...values,
          date: values.date.toDate(),
        };
        dataManager.updateMedicalRecord(updated);
        message.success(translate('更新成功', 'Updated'));
      } else {
        const newRecord: MedicalRecord = {
          id: `record-${Date.now()}`,
          animalId: values.animalId,
          type: values.type,
          title: values.title,
          description: values.description,
          date: values.date.toDate(),
          veterinarian: values.veterinarian,
          clinic: values.clinic,
          createdAt: new Date(),
        };
        dataManager.addMedicalRecord(newRecord);
        message.success(translate('添加成功', 'Added'));
      }
      setIsModalVisible(false);
      updateRecords();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: translate('动物', 'Animal'),
      dataIndex: 'animalId',
      key: 'animalId',
      render: (animalId: string) => {
        const animal = animals.find((a) => a.id === animalId);
        return animal ? `${animal.name} (${animal.type})` : animalId;
      },
    },
    {
      title: translate('类型', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          疫苗: 'green',
          体检: 'blue',
          血液检查: 'purple',
          诊断报告: 'red',
          治疗记录: 'orange',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: translate('标题', 'Title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: translate('日期', 'Date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: translate('兽医', 'Veterinarian'),
      dataIndex: 'veterinarian',
      key: 'veterinarian',
      render: (vet: string | undefined) => vet || '-',
    },
    {
      title: translate('诊所', 'Clinic'),
      dataIndex: 'clinic',
      key: 'clinic',
      render: (clinic: string | undefined) => clinic || '-',
    },
    {
      title: translate('操作', 'Actions'),
      key: 'action',
      render: (_: any, record: MedicalRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {translate('编辑', 'Edit')}
          </Button>
          <Popconfirm
            title={translate('确定要删除这条记录吗？', 'Delete this record?')}
            onConfirm={() => handleDelete(record.id)}
            okText={translate('确定', 'Confirm')}
            cancelText={translate('取消', 'Cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {translate('删除', 'Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{translate('医疗记录', 'Medical Records')}</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder={translate('筛选动物', 'Filter by animal')}
            allowClear
            value={selectedAnimalId || undefined}
            onChange={(value) => setSelectedAnimalId(value || '')}
          >
            {animals.map((animal) => {
              const user = users.find((u) => u.id === animal.userId);
              return (
                <Select.Option key={animal.id} value={animal.id}>
                  {user?.username} - {animal.name}
                </Select.Option>
              );
            })}
          </Select>
          <Search
            placeholder={translate('搜索记录', 'Search records')}
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {translate('添加记录', 'Add Record')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredRecords}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '8px 0' }}>
              <strong>{translate('描述', 'Description')}:</strong> {record.description || '-'}
            </div>
          ),
        }}
      />

      <Modal
        title={editingRecord ? translate('编辑医疗记录', 'Edit Medical Record') : translate('添加医疗记录', 'Add Medical Record')}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={translate('确定', 'Confirm')}
        cancelText={translate('取消', 'Cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="animalId"
            label={translate('动物', 'Animal')}
            rules={[{ required: true, message: translate('请选择动物', 'Please select animal') }]}
          >
            <Select placeholder={translate('请选择动物', 'Please select animal')}>
              {animals.map((animal) => {
                const user = users.find((u) => u.id === animal.userId);
                return (
                  <Select.Option key={animal.id} value={animal.id}>
                    {user?.username} - {animal.name} ({animal.type})
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label={translate('类型', 'Type')}
            rules={[{ required: true, message: translate('请选择类型', 'Please select type') }]}
          >
            <Select placeholder={translate('请选择类型', 'Please select type')}>
              {Object.values(MedicalRecordType).map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label={translate('标题', 'Title')}
            rules={[{ required: true, message: translate('请输入标题', 'Please enter title') }]}
          >
            <Input placeholder={translate('请输入标题', 'Please enter title')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={translate('描述', 'Description')}
          >
            <TextArea rows={4} placeholder={translate('请输入描述', 'Please enter description')} />
          </Form.Item>
          <Form.Item
            name="date"
            label={translate('日期', 'Date')}
            rules={[{ required: true, message: translate('请选择日期', 'Please select date') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="veterinarian"
            label={translate('兽医', 'Veterinarian')}
          >
            <Input placeholder={translate('请输入兽医姓名', 'Please enter veterinarian name')} />
          </Form.Item>
          <Form.Item
            name="clinic"
            label={translate('诊所', 'Clinic')}
          >
            <Input placeholder={translate('请输入诊所名称', 'Please enter clinic name')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

