import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Form, InputNumber, Modal, Select, Space, Table, Tag, Typography, message, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { fetchPartners } from '../api/outlets';
import { fetchSubscriptionPlans } from '../api/plans';
import { fetchPartnerDiscounts, requestPartnerDiscount, updatePartnerDiscount } from '../api/partnerDiscounts';
import type { Partner, PartnerSubscriptionDiscount, SubscriptionPlanSummary } from '../types';

const statusColors: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red'
};

const DiscountsPage = () => {
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: fetchPartners
  });
  const { data: plans = [] } = useQuery<SubscriptionPlanSummary[]>({
    queryKey: ['plans'],
    queryFn: fetchSubscriptionPlans
  });
  const {
    data: discounts = [],
    isFetching: discountsLoading
  } = useQuery<PartnerSubscriptionDiscount[]>({
    queryKey: ['partner-discounts', selectedPartner],
    queryFn: () => fetchPartnerDiscounts(selectedPartner as number),
    enabled: Boolean(selectedPartner)
  });
  const [form] = Form.useForm<{ subscription_plan: number; discount_percent: number }>();
  const [editForm] = Form.useForm<{ discount_percent: number }>();
  const [editingDiscount, setEditingDiscount] = useState<PartnerSubscriptionDiscount | null>(null);

  useEffect(() => {
    if (!selectedPartner && partners.length) {
      setSelectedPartner(partners[0].id);
    }
  }, [partners, selectedPartner]);

  const createMutation = useMutation({
    mutationFn: (values: { subscription_plan: number; discount_percent: number }) => {
      if (!selectedPartner) {
        return Promise.reject(new Error('Partner not selected'));
      }
      return requestPartnerDiscount(selectedPartner, values);
    },
    onSuccess: () => {
      message.success('Discount request submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['partner-discounts'] });
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to submit request');
    }
  });

  const planOptions = useMemo(
    () => plans.map((plan) => ({ value: plan.id, label: `${plan.code} (${plan.name})` })),
    [plans]
  );

  const updateMutation = useMutation({
    mutationFn: (values: { discount_percent: number }) => {
      if (!editingDiscount) {
        return Promise.reject(new Error('No discount selected'));
      }
      return updatePartnerDiscount(editingDiscount.partner, editingDiscount.id, values);
    },
    onSuccess: () => {
      message.success('Update request submitted for approval');
      setEditingDiscount(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['partner-discounts'] });
    },
    onError: (error: Error) => message.error(error.message || 'Failed to submit update request')
  });

  const columns: ColumnsType<PartnerSubscriptionDiscount> = [
    {
      title: 'Plan',
      dataIndex: ['subscription_plan_detail', 'code'],
      render: (_, record) =>
        record.subscription_plan_detail ? (
          <div>
            <div>{record.subscription_plan_detail.code}</div>
            <Typography.Text type="secondary">{record.subscription_plan_detail.name}</Typography.Text>
          </div>
        ) : (
          record.subscription_plan
        )
    },
    {
      title: 'Discount %',
      dataIndex: 'discount_percent',
      render: (value) => `${value}%`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => <Tag color={statusColors[status] ?? 'default'}>{status}</Tag>
    },
    {
      title: 'Requested by',
      dataIndex: 'requested_by_phone',
      render: (value) => value ?? '—'
    },
    {
      title: 'Approved by',
      dataIndex: 'approved_by_phone',
      render: (value) => value ?? '—'
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      render: (value: string) => (value ? dayjs(value).format('DD MMM YYYY HH:mm') : '—')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        record.status === 'pending' ? (
          'Awaiting approval'
        ) : (
          <Button
            type="link"
            onClick={() => {
              setEditingDiscount(record);
              editForm.setFieldsValue({ discount_percent: record.discount_percent });
            }}
          >
            Request update
          </Button>
        )
    }
  ];

  if (partnersLoading) {
    return <Card>Loading partners...</Card>;
  }

  if (!partners.length) {
    return (
      <Card>
        <Typography.Text>You are not assigned to any partner yet.</Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Request new subscription discount">
        <Form layout="inline" form={form} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item label="Partner">
            <Select
              value={selectedPartner ?? undefined}
              options={partners.map((partner) => ({ value: partner.id, label: partner.name }))}
              onChange={setSelectedPartner}
              style={{ minWidth: 200 }}
            />
          </Form.Item>
          <Form.Item
            label="Plan"
            name="subscription_plan"
            rules={[{ required: true, message: 'Select plan' }]}
            style={{ minWidth: 240 }}
          >
            <Select placeholder="Select plan" options={planOptions} />
          </Form.Item>
          <Form.Item
            label="Discount %"
            name="discount_percent"
            rules={[{ required: true, message: 'Enter discount percent' }]}
          >
            <InputNumber min={1} max={100} addonAfter="%" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType={"submit"}
              className="btn btn--primary"
              disabled={createMutation.isPending || !selectedPartner}
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit for approval'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Partner discounts">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={discounts}
          loading={discountsLoading}
          pagination={false}
        />
      </Card>
      <Modal
        title={`Update discount for ${editingDiscount?.subscription_plan_detail?.code ?? ''}`}
        open={Boolean(editingDiscount)}
        onCancel={() => {
          setEditingDiscount(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={(values) => updateMutation.mutate(values)}
        >
          <Form.Item
            label="Discount %"
            name="discount_percent"
            rules={[{ required: true, message: 'Enter discount percent' }]}
          >
            <InputNumber min={1} max={100} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>
          <Typography.Paragraph type="secondary">
            Updated values require admin approval. The discount will stay inactive until it is approved.
          </Typography.Paragraph>
        </Form>
      </Modal>
    </Space>
  );
};

export default DiscountsPage;
