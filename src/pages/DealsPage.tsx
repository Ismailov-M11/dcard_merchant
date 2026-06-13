import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Upload,
  Typography,
  message,
  Image
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchPartners } from '../api/outlets';
import type { Partner, MerchantDeal, DealStatus } from '../types';
import { createDeal, fetchMerchantDeals, updateDeal, updateDealStatus } from '../api/deals';
import { fetchSubscriptionPlans } from '../api/plans';

const statusOptions: (DealStatus | 'all')[] = ['all', 'pending', 'active', 'paused', 'rejected'];

const offerTypeOptions = [
  { value: 'one_plus_one', label: '1 + 1' },
  { value: 'exclusive', label: 'Exclusive' }
];

const languages = [
  { code: 'uz', label: 'Uzbek' },
  { code: 'ru', label: 'Russian' }
] as const;

type DealFormValues = {
  partner_id: number;
  subscription_plan: number;
  offer_type: string;
  price?: string;
  discount_percent?: number;
  dates?: [dayjs.Dayjs, dayjs.Dayjs];
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  terms_translations?: Record<string, string>;
};

const DealsPage = () => {
  const [form] = Form.useForm<DealFormValues>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<number | 'all'>('all');
  const [validityFilter, setValidityFilter] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingDeal, setEditingDeal] = useState<MerchantDeal | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: fetchPartners
  });
  const { data: plans = [] } = useQuery({
    queryKey: ['merchant-plans'],
    queryFn: fetchSubscriptionPlans
  });
  const validFrom = validityFilter ? validityFilter[0].toISOString() : undefined;
  const validTo = validityFilter ? validityFilter[1].toISOString() : undefined;

  const { data: deals = [], isFetching: dealsLoading } = useQuery<MerchantDeal[]>({
    queryKey: ['merchant-deals', statusFilter, searchTerm, planFilter, validFrom, validTo],
    queryFn: () =>
      fetchMerchantDeals({
        status: statusFilter,
        search: searchTerm.trim() || undefined,
        planId: planFilter === 'all' ? undefined : planFilter,
        validFrom,
        validTo
      })
  });

  useEffect(() => {
    if (editingDeal) {
      const start = editingDeal.start_at ? dayjs(editingDeal.start_at) : null;
      const end = editingDeal.end_at ? dayjs(editingDeal.end_at) : null;
      form.setFieldsValue({
        partner_id: editingDeal.partner,
        subscription_plan: editingDeal.subscription_plan,
        offer_type: editingDeal.offer_type,
        price: editingDeal.price,
        discount_percent: editingDeal.discount_percent,
        title_translations: editingDeal.title_translations,
        description_translations: editingDeal.description_translations,
        terms_translations: editingDeal.terms_translations,
        dates: start && end ? [start, end] : undefined
      });
      return;
    }
    if (partners.length === 1) {
      form.setFieldsValue({ partner_id: partners[0].id });
    }
  }, [partners, form, editingDeal]);

  const openCreateModal = () => {
    setEditingDeal(null);
    form.resetFields();
    setImageFile(null);
    if (partners.length === 1) {
      form.setFieldsValue({ partner_id: partners[0].id });
    }
    setModalVisible(true);
  };

  const handleValidityChange = (range: null | [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
    if (!range || !range[0] || !range[1]) {
      setValidityFilter(null);
      return;
    }
    setValidityFilter([range[0], range[1]]);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => createDeal(payload),
    onSuccess: () => {
      message.success('Deal submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['merchant-deals'] });
      form.resetFields();
      setImageFile(null);
      setModalVisible(false);
    },
    onError: () => message.error('Failed to create deal')
  });

  const updateMutation = useMutation({
    mutationFn: ({ partnerId, dealId, payload }: { partnerId: number; dealId: number; payload: any }) =>
      updateDeal(partnerId, dealId, payload),
    onSuccess: () => {
      message.success('Deal updated');
      queryClient.invalidateQueries({ queryKey: ['merchant-deals'] });
      setEditingDeal(null);
      form.resetFields();
      setImageFile(null);
      setModalVisible(false);
    },
    onError: () => message.error('Failed to update deal')
  });

  const statusMutation = useMutation({
    mutationFn: ({ dealId, status }: { dealId: number; status: DealStatus }) => updateDealStatus(dealId, status),
    onSuccess: () => {
      message.success('Deal status updated');
      queryClient.invalidateQueries({ queryKey: ['merchant-deals'] });
    },
    onError: () => message.error('Failed to update status')
  });

  const handleSubmit = (values: DealFormValues) => {
    const { partner_id, subscription_plan, offer_type, price, discount_percent, dates } = values;
    if (!partner_id) {
      message.warning('Select a partner');
      return;
    }
    const titleTranslations = values.title_translations || {};
    const descriptionTranslations = values.description_translations || {};
    const termsTranslations = values.terms_translations || {};
    const [start, end] = dates || [];
    const discountValue =
      values.discount_percent !== undefined && values.discount_percent !== null
        ? Number(values.discount_percent)
        : undefined;
    const payload = {
      partner_id,
      subscription_plan,
      offer_type,
      price,
      discount_percent: discountValue,
      title: titleTranslations.uz || titleTranslations.ru || '',
      description: descriptionTranslations.uz || descriptionTranslations.ru || '',
      terms: termsTranslations.uz || termsTranslations.ru || '',
      title_translations: titleTranslations,
      description_translations: descriptionTranslations,
      terms_translations: termsTranslations,
      start_at: start ? start.toISOString() : undefined,
      end_at: end ? end.toISOString() : undefined,
      image: imageFile ?? undefined
    };
    if (editingDeal) {
      updateMutation.mutate({ partnerId: partner_id, dealId: editingDeal.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEditing = (deal: MerchantDeal) => {
    setEditingDeal(deal);
    setImageFile(null);
    setModalVisible(true);
  };

  const cancelEdit = () => {
    setEditingDeal(null);
    form.resetFields();
    setImageFile(null);
    setModalVisible(false);
  };

  const columns: ColumnsType<MerchantDeal> = [
    {
      title: 'Deal',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.image && <Image width={64} height={40} src={record.image} alt={record.title} style={{ objectFit: 'cover' }} />}
          <div>
            <div className="font-semibold">{record.title}</div>
            <div className="text-xs text-gray-500">{record.offer_type}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Partner',
      dataIndex: 'partner_detail',
      key: 'partner_detail',
      render: (partner: MerchantDeal['partner_detail']) => partner?.name ?? '—'
    },
    {
      title: 'Plan',
      dataIndex: ['subscription_plan_detail', 'code'],
      key: 'subscription_plan_detail',
      render: (_: unknown, record) => record.subscription_plan_detail?.code ?? '—'
    },
    {
      title: 'Validity',
      key: 'dates',
      render: (_, record) => {
        if (!record.start_at && !record.end_at) {
          return 'No schedule';
        }
        const start = record.start_at ? dayjs(record.start_at).format('DD MMM') : 'Now';
        const end = record.end_at ? dayjs(record.end_at).format('DD MMM') : 'Open';
        return `${start} – ${end}`;
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: string, record) => (
        <div>
          <div>{price ? `${price}` : 'N/A'}</div>
          <div className="text-xs text-gray-500">{record.discount_percent}% off</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DealStatus) => {
        const colorMap: Record<DealStatus, string> = {
          pending: 'gold',
          active: 'green',
          paused: 'orange',
          rejected: 'red'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            disabled={!['pending', 'rejected'].includes(record.status)}
            onClick={() => startEditing(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            disabled={!['active', 'paused'].includes(record.status)}
            loading={statusMutation.isPending}
            onClick={() =>
              statusMutation.mutate({
                dealId: record.id,
                status: record.status === 'active' ? 'paused' : 'active'
              })
            }
          >
            {record.status === 'active' ? 'Pause' : 'Resume'}
          </Button>
        </Space>
      )
    }
  ];

  if (partnersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!partners.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <Typography.Text>No partner access configured. Please contact an administrator.</Typography.Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Space size="large" wrap>
          <Input.Search
            placeholder="Search deals"
            allowClear
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ minWidth: 200 }}
          />
          <Select
            style={{ minWidth: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions.map((status) => ({ label: status, value: status }))}
          />
          <Select
            placeholder="Plan"
            value={planFilter}
            onChange={(value) => setPlanFilter(value)}
            style={{ minWidth: 180 }}
            options={[
              { label: 'All plans', value: 'all' },
              ...plans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` }))
            ]}
          />
          <DatePicker.RangePicker
            value={validityFilter ?? null}
            onChange={(value) => handleValidityChange(value)}
            showTime
            allowClear
            style={{ minWidth: 260 }}
          />
          <Button type="primary" onClick={openCreateModal}>
            + New deal
          </Button>
        </Space>
      </Card>
      <Card title="Deals">
        <Table rowKey="id" columns={columns} dataSource={deals} loading={dealsLoading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal
        title={editingDeal ? 'Edit deal' : 'Create new deal'}
        open={isModalVisible}
        onCancel={cancelEdit}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{ offer_type: 'exclusive' }}>
          <Form.Item label="Partner" name="partner_id" rules={[{ required: true }]}>
            <Select placeholder="Select partner" options={partners.map((partner) => ({ value: partner.id, label: partner.name }))} />
          </Form.Item>
          <Form.Item label="Subscription plan" name="subscription_plan" rules={[{ required: true }]}>
            <Select placeholder="Select plan" options={plans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` }))} />
          </Form.Item>
          <Typography.Text strong>Titles</Typography.Text>
          {languages.map(({ code, label }) => (
            <Form.Item
              key={`title-${code}`}
              label={`Title (${label})`}
              name={['title_translations', code]}
              rules={code === 'uz' ? [{ required: true, message: 'Title in Uzbek is required' }] : []}
            >
              <Input placeholder={`Title (${label})`} />
            </Form.Item>
          ))}
          <Typography.Text strong>Descriptions</Typography.Text>
          {languages.map(({ code, label }) => (
            <Form.Item key={`description-${code}`} label={`Description (${label})`} name={['description_translations', code]}>
              <Input.TextArea rows={3} placeholder={`Description (${label})`} />
            </Form.Item>
          ))}
          <Typography.Text strong>Terms</Typography.Text>
          {languages.map(({ code, label }) => (
            <Form.Item key={`terms-${code}`} label={`Terms (${label})`} name={['terms_translations', code]}>
              <Input.TextArea rows={2} placeholder={`Terms (${label})`} />
            </Form.Item>
          ))}
          <Form.Item label="Offer type" name="offer_type">
            <Select options={offerTypeOptions} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Price" name="price">
                <Input placeholder="100.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Discount %" name="discount_percent">
                <Input type="number" placeholder="20" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Validity" name="dates">
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Hero image">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              onRemove={() => setImageFile(null)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select image</Button>
            </Upload>
          </Form.Item>
          <Space>
            <Button htmlType="reset" onClick={() => setImageFile(null)}>
              Reset
            </Button>
            {editingDeal && (
              <Button onClick={cancelEdit} disabled={createMutation.isPending || updateMutation.isPending}>
                Cancel edit
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={editingDeal ? updateMutation.isPending : createMutation.isPending}>
              {editingDeal ? 'Update deal' : 'Submit for approval'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default DealsPage;
