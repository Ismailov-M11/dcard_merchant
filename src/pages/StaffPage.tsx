import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchOutlets } from '../api/outlets';
import type { Outlet } from '../types';
import { addStaffMember, deleteStaffMember, fetchStaff, updateStaffMember, updateStaffPassword, type StaffMember } from '../api/staff';

const staffRoleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'validator', label: 'Scanner' }
];

type StaffFormValues = {
  phone: string;
  full_name?: string;
  outlet_id: number;
  staff_roles: string[];
};

type StaffEditValues = {
  phone: string;
  full_name?: string;
  staff_roles: string[];
  outlet_id: number;
};

const StaffPage = () => {
  const [form] = Form.useForm<StaffFormValues>();
  const [passwordForm] = Form.useForm<{ password: string }>();
  const [editForm] = Form.useForm<StaffEditValues>();
  const queryClient = useQueryClient();
  const [outletFilter, setOutletFilter] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordModalStaff, setPasswordModalStaff] = useState<StaffMember | null>(null);
  const [editModalStaff, setEditModalStaff] = useState<StaffMember | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { data: outlets = [], isLoading: outletsLoading } = useQuery<Outlet[]>({
    queryKey: ['outlets'],
    queryFn: () => fetchOutlets()
  });
  const { data: staff = [], isFetching: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff', outletFilter, searchTerm],
    queryFn: () =>
      fetchStaff({
        outletId: outletFilter,
        search: searchTerm.trim() || undefined
      })
  });

  const branchOptions = useMemo(() => {
    const map = new Map<number, string>();
    outlets.forEach((outlet) => map.set(outlet.id, outlet.name));
    staff.forEach((member) => {
      if (!map.has(member.outlet_id)) {
        map.set(member.outlet_id, member.outlet_name);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [outlets, staff]);

  const createMutation = useMutation({
    mutationFn: (values: StaffFormValues) =>
      addStaffMember(values.outlet_id, {
        phone: values.phone,
        staff_roles: values.staff_roles,
        full_name: values.full_name
      }),
    onSuccess: () => {
      message.success('Staff member invited');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      form.resetFields(['phone', 'staff_roles', 'full_name']);
      setCreateModalVisible(false);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.data?.detail;
      message.error(detail || 'Failed to add staff member');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: ({ staffId, password }: { staffId: number; password: string }) => updateStaffPassword(staffId, password),
    onSuccess: () => {
      message.success('Password updated');
      setPasswordModalStaff(null);
      passwordForm.resetFields();
    },
    onError: () => message.error('Failed to update password')
  });

  const editMutation = useMutation({
    mutationFn: ({ staffId, payload }: { staffId: number; payload: { phone?: string; full_name?: string; staff_roles?: string[]; outlet_id?: number } }) =>
      updateStaffMember(staffId, payload),
    onSuccess: () => {
      message.success('Staff updated');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditModalStaff(null);
      editForm.resetFields();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.data?.detail;
      message.error(detail || 'Failed to update staff');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: number) => deleteStaffMember(staffId),
    onSuccess: () => {
      message.success('Staff member removed');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.data?.detail;
      message.error(detail || 'Failed to remove staff member');
    }
  });

  useEffect(() => {
    if (branchOptions.length === 1) {
      form.setFieldsValue({ outlet_id: branchOptions[0].value });
      if (outletFilter === 'all') {
        setOutletFilter(branchOptions[0].value);
      }
    }
  }, [branchOptions, form, outletFilter]);

  const noOutlets = !outletsLoading && branchOptions.length === 0;

  const handleCreateStaff = (values: StaffFormValues) => {
    if (!values.outlet_id) {
      message.warning('Select a branch to assign staff');
      return;
    }
    createMutation.mutate(values);
  };

  const columns: ColumnsType<StaffMember> = [
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Full name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (value: string | undefined) => value || '—'
    },
    { title: 'Branch', dataIndex: 'outlet_name', key: 'outlet_name' },
    { title: 'Partner', dataIndex: 'partner_name', key: 'partner_name' },
    {
      title: 'Roles',
      dataIndex: 'staff_roles',
      key: 'staff_roles',
      render: (roles: string[]) => roles.map((role) => <Tag key={role}>{role}</Tag>)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditModalStaff(record);
              editForm.setFieldsValue({
                phone: record.phone,
                full_name: record.full_name,
                staff_roles: record.staff_roles,
                outlet_id: record.outlet_id
              });
            }}
          >
            Edit
          </Button>
          <Button type="link" onClick={() => setPasswordModalStaff(record)}>
            Password
          </Button>
          <Popconfirm
            title="Remove staff member?"
            description={`Are you sure you want to remove ${record.full_name || record.phone}?`}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes, remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Space size="large" wrap>
          <Input.Search
            placeholder="Search by name or phone"
            allowClear
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ minWidth: 200 }}
          />
          <Select
            value={outletFilter}
            placeholder="Filter by branch"
            style={{ minWidth: 200 }}
            onChange={(value) => setOutletFilter(value)}
            options={[{ label: 'All branches', value: 'all' }, ...branchOptions]}
            loading={outletsLoading}
          />
          <Button type="primary" onClick={() => setCreateModalVisible(true)} disabled={noOutlets}>
            + Add staff
          </Button>
        </Space>
      </Card>

      <Card title="Staff directory">
        {noOutlets ? (
          <Typography.Text>No branches available. Please create a branch first.</Typography.Text>
        ) : (
          <Table rowKey="id" columns={columns} dataSource={staff} loading={staffLoading} pagination={{ pageSize: 8 }} />
        )}
      </Card>

      <Modal
        title="Add staff account"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={handleCreateStaff}>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input placeholder="+998..." />
          </Form.Item>
          <Form.Item label="Full name" name="full_name">
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item label="Branch" name="outlet_id" rules={[{ required: true }]}>
            <Select placeholder="Select branch" options={branchOptions} loading={outletsLoading} />
          </Form.Item>
          <Form.Item label="Permissions" name="staff_roles" rules={[{ required: true, message: 'Select at least one permission' }]}>
            <Select mode="multiple" options={staffRoleOptions} placeholder="Select permissions" />
          </Form.Item>
          <Space>
            <Button htmlType="reset">Reset</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Invite staff
            </Button>
          </Space>
        </Form>
      </Modal>
      <Modal
        title={`Change password: ${passwordModalStaff?.phone ?? ''}`}
        open={Boolean(passwordModalStaff)}
        onCancel={() => setPasswordModalStaff(null)}
        onOk={() => passwordForm.submit()}
        confirmLoading={passwordMutation.isPending}
        okText="Update password"
      >
        <Form
          layout="vertical"
          form={passwordForm}
          onFinish={(values) => {
            if (passwordModalStaff) {
              passwordMutation.mutate({ staffId: passwordModalStaff.id, password: values.password });
            }
          }}
        >
          <Form.Item
            label="New password"
            name="password"
            rules={[
              { required: true, message: 'Password required' },
              { min: 6, message: 'At least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`Edit staff: ${editModalStaff?.phone ?? ''}`}
        open={Boolean(editModalStaff)}
        onCancel={() => setEditModalStaff(null)}
        onOk={() => editForm.submit()}
        confirmLoading={editMutation.isPending}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => {
            if (editModalStaff) {
              editMutation.mutate({ staffId: editModalStaff.id, payload: values });
            }
          }}
        >
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input placeholder="+998..." />
          </Form.Item>
          <Form.Item label="Full name" name="full_name">
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item label="Branch" name="outlet_id" rules={[{ required: true }]}>
            <Select options={branchOptions} />
          </Form.Item>
          <Form.Item label="Permissions" name="staff_roles" rules={[{ required: true }]}>
            <Select mode="multiple" options={staffRoleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffPage;
