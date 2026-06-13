import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  Upload
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { createOutlet, deleteOutlet, fetchOutletTypes, fetchOutlets, fetchPartners, updateOutlet, OutletPayload } from '../api/outlets';
import type { Outlet, OutletType, Partner, OutletLocation } from '../types';
import LocationPicker from '../components/LocationPicker';

type OutletFormValues = {
  name: string;
  city: string;
  address: string;
  slug: string;
  partner_id?: number;
  phone?: string;
  outlet_type_id?: number | null;
  is_approved?: boolean;
};

const BranchesPage = () => {
  const [form] = Form.useForm<OutletFormValues>();
  const queryClient = useQueryClient();
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [locationPoint, setLocationPoint] = useState<OutletLocation | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuFileName, setMenuFileName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: fetchPartners
  });
  const { data: outletTypes = [] } = useQuery<OutletType[]>({
    queryKey: ['outlet-types'],
    queryFn: fetchOutletTypes
  });
  const { data: outlets = [], isFetching: outletsFetching } = useQuery<Outlet[]>({
    queryKey: ['outlets', searchTerm, typeFilter],
    queryFn: () =>
      fetchOutlets({
        search: searchTerm.trim() || undefined,
        outletTypeId: typeFilter
      }),
    enabled: partners.length > 0
  });

  useEffect(() => {
    if (partners.length === 1) {
      form.setFieldsValue({ partner_id: partners[0].id });
    }
  }, [partners, form]);

  const resetForm = () => {
    form.resetFields();
    setEditingOutlet(null);
    setLocationPoint(null);
    setMenuFile(null);
    setMenuFileName(null);
    if (partners.length === 1) {
      form.setFieldsValue({ partner_id: partners[0].id });
    }
    form.setFieldsValue({ phone: '' });
  };

  const openCreateModal = () => {
    if (noPartnersAssigned) {
      return;
    }
    resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    resetForm();
    setModalVisible(false);
  };

  const createMutation = useMutation({
    mutationFn: (values: OutletPayload) => createOutlet(values, null, menuFile),
    onSuccess: () => {
      message.success('Branch created');
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      closeModal();
    },
    onError: () => message.error('Failed to create branch')
  });

  const updateMutation = useMutation({
    mutationFn: (values: OutletPayload & { id: number }) => updateOutlet(values.id, values, null, menuFile),
    onSuccess: () => {
      message.success('Branch updated');
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      closeModal();
    },
    onError: () => message.error('Failed to update branch')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOutlet(id),
    onSuccess: (_, id) => {
      message.success('Branch deleted');
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      if (editingOutlet?.id === id) {
        closeModal();
      }
    },
    onError: () => message.error('Failed to delete branch')
  });

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    form.setFieldsValue({
      name: outlet.name,
      city: outlet.city,
      address: outlet.address,
      slug: outlet.slug,
      phone: outlet.phone ?? '',
      outlet_type_id: outlet.outlet_type?.id,
      is_approved: outlet.is_approved,
      partner_id: outlet.partner.id
    });
    setLocationPoint(outlet.location ?? null);
    setMenuFile(null);
    setMenuFileName(outlet.menu ? outlet.menu.split('/').pop() ?? 'menu.pdf' : null);
    setModalVisible(true);
  };

  const handleSubmit = (values: OutletFormValues) => {
    if (!values.partner_id) {
      message.warning('Select a partner first');
      return;
    }
    const payload: OutletPayload = {
      ...values,
      partner_id: values.partner_id,
      phone: values.phone,
      outlet_type_id: values.outlet_type_id ?? undefined,
      location: locationPoint ?? undefined
    };
    if (editingOutlet) {
      updateMutation.mutate({ ...payload, id: editingOutlet.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: ColumnsType<Outlet> = useMemo(
    () => [
      { title: 'Branch', dataIndex: 'name', key: 'name' },
      { title: 'City', dataIndex: 'city', key: 'city' },
      { title: 'Address', dataIndex: 'address', key: 'address' },
      {
        title: 'Status',
        key: 'is_approved',
        render: (_, record) => <Tag color={record.is_approved ? 'green' : 'gold'}>{record.is_approved ? 'Approved' : 'Pending'}</Tag>
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        render: (value: string | undefined) => value || '—'
      },
      {
        title: 'Type',
        dataIndex: ['outlet_type', 'name'],
        key: 'outlet_type',
        render: (_, record) => record.outlet_type?.name ?? '—'
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => handleEdit(record)}>
              Edit
            </Button>
            <Popconfirm title="Delete branch?" onConfirm={() => deleteMutation.mutate(record.id)} okButtonProps={{ loading: deleteMutation.isPending }}>
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [deleteMutation.isPending]
  );

  const noPartnersAssigned = !partnersLoading && partners.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        {noPartnersAssigned ? (
          <Typography.Text>No partner assigned. Please contact an administrator.</Typography.Text>
        ) : (
          <Space size="large" wrap>
            <Input.Search
              placeholder="Search branches"
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Outlet type"
              allowClear
              value={typeFilter}
              onChange={(value) => setTypeFilter(value ?? 'all')}
              style={{ minWidth: 180 }}
              options={[
                { label: 'All types', value: 'all' },
                ...outletTypes.map((type) => ({
                  value: type.id,
                  label: type.name
                }))
              ]}
            />
            <Button type="primary" onClick={openCreateModal} disabled={partnersLoading || noPartnersAssigned}>
              + New branch
            </Button>
          </Space>
        )}
      </Card>

      {!noPartnersAssigned && (
        <Card title="Branches">
          {outletsFetching ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : (
            <Table columns={columns} dataSource={outlets} rowKey="id" pagination={{ pageSize: 6 }} />
          )}
        </Card>
      )}

      <Modal
        title={editingOutlet ? `Edit branch: ${editingOutlet.name}` : 'Add new branch'}
        open={isModalVisible && !noPartnersAssigned}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        forceRender
        width={720}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item label="Partner" name="partner_id" rules={[{ required: true }]}>
            <Select placeholder="Select partner" options={partners.map((partner) => ({ value: partner.id, label: partner.name }))} />
          </Form.Item>
          <Form.Item label="Branch name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Downtown Hub" />
          </Form.Item>
          <Form.Item label="City" name="city" rules={[{ required: true }]}>
            <Input placeholder="Tashkent" />
          </Form.Item>
          <Form.Item label="Address" name="address" rules={[{ required: true }]}>
            <Input placeholder="Street and building info" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="+998 90 123 45 67" />
          </Form.Item>
          <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
            <Input placeholder="downtown-hub" />
          </Form.Item>
          <Form.Item label="Outlet type" name="outlet_type_id">
            <Select
              allowClear
              placeholder="Select type"
              options={outletTypes.map((type) => ({
                value: type.id,
                label: type.name
              }))}
            />
          </Form.Item>
          <Form.Item label="Approved" name="is_approved" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Map location">
            <LocationPicker
              value={locationPoint}
              onChange={setLocationPoint}
              onAddressChange={(data) => {
                if (data?.address) {
                  form.setFieldsValue({ address: data.address });
                }
                if (data?.city) {
                  form.setFieldsValue({ city: data.city });
                }
              }}
            />
            {locationPoint ? (
              <Typography.Text type="secondary">
                Selected: {locationPoint.lat.toFixed(5)}, {locationPoint.lng.toFixed(5)}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">Optional: tap on the map to pin a branch.</Typography.Text>
            )}
          </Form.Item>
          <Form.Item label="Menu (PDF)">
            <Space direction="vertical">
              {menuFileName && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Current: {menuFileName}</Typography.Text>}
              <Upload
                beforeUpload={(file) => { setMenuFile(file); setMenuFileName(file.name); return false; }}
                showUploadList={false}
                maxCount={1}
                accept="application/pdf"
              >
                <Button icon={<UploadOutlined />}>Upload menu PDF</Button>
              </Upload>
            </Space>
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {editingOutlet && (
              <Button onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
                Cancel edit
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingOutlet ? 'Update branch' : 'Create branch'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchesPage;
