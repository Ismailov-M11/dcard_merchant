import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { deleteOutletBanner, createOutletBanner, fetchOutletBanners, updateOutletBanner, type OutletBannerPayload } from '../api/outletBanners';
import { fetchOutlets, fetchPartners } from '../api/outlets';
import type { Outlet, OutletBanner, Partner } from '../types';

type BannerFormValues = {
  background_color?: string;
  is_active: boolean;
};

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const LIGHT_TEXT_COLOR = '#ffffff';
const DARK_TEXT_COLOR = '#111827';

const normalizeHexColor = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!HEX_COLOR_PATTERN.test(normalized)) {
    return null;
  }

  if (normalized.length === 4) {
    const [, red, green, blue] = normalized;
    return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
  }

  return normalized.toLowerCase();
};

const rgbToHex = (red: number, green: number, blue: number): string => (
  `#${[red, green, blue].map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`
);

const hexToRgb = (value: string): { red: number; green: number; blue: number } | null => {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
};

const resolveReadableTextColor = (backgroundColor?: string | null): string => {
  const backgroundRgb = hexToRgb(backgroundColor || '');
  if (!backgroundRgb) {
    return LIGHT_TEXT_COLOR;
  }

  const relativeLuminance = ({ red, green, blue }: { red: number; green: number; blue: number }) => {
    const linearize = (channel: number) => {
      const value = channel / 255;
      if (value <= 0.03928) {
        return value / 12.92;
      }
      return ((value + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
  };

  const contrastRatio = (leftHex: string, rightHex: string) => {
    const leftRgb = hexToRgb(leftHex);
    const rightRgb = hexToRgb(rightHex);
    if (!leftRgb || !rightRgb) {
      return 1;
    }
    const left = relativeLuminance(leftRgb);
    const right = relativeLuminance(rightRgb);
    const lighter = Math.max(left, right);
    const darker = Math.min(left, right);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const normalizedBackground = rgbToHex(backgroundRgb.red, backgroundRgb.green, backgroundRgb.blue);
  return contrastRatio(normalizedBackground, LIGHT_TEXT_COLOR) >= contrastRatio(normalizedBackground, DARK_TEXT_COLOR)
    ? LIGHT_TEXT_COLOR
    : DARK_TEXT_COLOR;
};

const withAlpha = (hexColor: string, alpha: number): string => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${Math.max(0, Math.min(1, alpha))})`;
};

const mixHexColors = (baseHex: string, mixHex: string, weight: number): string => {
  const parseHex = (value: string) => {
    const normalized = normalizeHexColor(value);
    if (!normalized) {
      return null;
    }
    return {
      red: Number.parseInt(normalized.slice(1, 3), 16),
      green: Number.parseInt(normalized.slice(3, 5), 16),
      blue: Number.parseInt(normalized.slice(5, 7), 16),
    };
  };

  const base = parseHex(baseHex);
  const mix = parseHex(mixHex);
  if (!base || !mix) {
    return normalizeHexColor(baseHex) || '#000000';
  }

  const safeWeight = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    base.red + (mix.red - base.red) * safeWeight,
    base.green + (mix.green - base.green) * safeWeight,
    base.blue + (mix.blue - base.blue) * safeWeight,
  );
};

const dedupeColors = (colors: Array<string | null | undefined>, limit = 6): string[] => {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const color of colors) {
    const normalized = normalizeHexColor(color);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
};

const extractSuggestedColorsFromFile = async (file: File): Promise<string[]> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Preview image could not be loaded'));
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return [];
    }

    const width = 72;
    const height = Math.max(1, Math.round((image.height / image.width) * width));
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    const counts = new Map<string, number>();

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3];
      if (alpha <= 32) {
        continue;
      }

      const red = Math.min(255, Math.round(pixels[index] / 32) * 32);
      const green = Math.min(255, Math.round(pixels[index + 1] / 32) * 32);
      const blue = Math.min(255, Math.round(pixels[index + 2] / 32) * 32);
      const key = rgbToHex(red, green, blue);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const sortedColors = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([color]) => color);

    const primaryColor = sortedColors[0] || null;
    return dedupeColors([
      primaryColor,
      ...sortedColors,
      primaryColor ? mixHexColors(primaryColor, '#ffffff', 0.18) : null,
      primaryColor ? mixHexColors(primaryColor, '#000000', 0.12) : null,
      primaryColor ? mixHexColors(primaryColor, '#ffffff', 0.3) : null,
      primaryColor ? mixHexColors(primaryColor, '#000000', 0.24) : null,
    ]);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const BannersPage = () => {
  const [form] = Form.useForm<BannerFormValues>();
  const queryClient = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [editingBanner, setEditingBanner] = useState<OutletBanner | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const watchedBackgroundColor = normalizeHexColor(Form.useWatch('background_color', form)) || '#d9a441';
  const previewTextColor = resolveReadableTextColor(watchedBackgroundColor);
  const previewMutedTextColor = withAlpha(previewTextColor, 0.82);

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: fetchPartners,
  });

  const { data: outlets = [], isFetching: outletsLoading } = useQuery<Outlet[]>({
    queryKey: ['outlets', selectedPartnerId],
    queryFn: () => fetchOutlets({ partnerId: selectedPartnerId as number }),
    enabled: selectedPartnerId !== null,
  });

  useEffect(() => {
    if (selectedPartnerId === null && partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);

  const anchorOutlet = outlets[0] ?? null;

  const { data: banners = [], isFetching: bannersLoading } = useQuery<OutletBanner[]>({
    queryKey: ['merchant-outlet-banners', anchorOutlet?.id],
    queryFn: () => fetchOutletBanners(anchorOutlet?.id as number),
    enabled: anchorOutlet !== null,
  });

  const currentBanner = useMemo(
    () => banners.find((banner) => banner.applies_to_all_outlets) ?? banners[0] ?? null,
    [banners],
  );

  useEffect(() => () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
  }, []);

  const closeModal = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setModalVisible(false);
    setEditingBanner(null);
    setFileList([]);
    setSuggestedColors([]);
    setPreviewImageUrl(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    if (!anchorOutlet) {
      message.warning('Avval partner tanlang');
      return;
    }
    setEditingBanner(null);
    setFileList([]);
    setSuggestedColors([]);
    setPreviewImageUrl(null);
    form.setFieldsValue({
      background_color: '',
      is_active: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (banner: OutletBanner) => {
    setEditingBanner(banner);
    setFileList(
      banner.image
        ? [{ uid: String(banner.id), name: 'banner', status: 'done', url: banner.image }]
        : [],
    );
    setPreviewImageUrl(banner.image || null);
    setSuggestedColors(dedupeColors([
      ...(banner.suggested_background_colors || []),
      banner.background_color,
    ]));
    form.setFieldsValue({
      background_color: banner.background_color || '',
      is_active: banner.is_active,
    });
    setModalVisible(true);
  };

  const mutation = useMutation({
    mutationFn: async (payload: OutletBannerPayload) => {
      if (!anchorOutlet) {
        throw new Error('Partner outlet missing');
      }

      if (editingBanner) {
        return updateOutletBanner(anchorOutlet.id, editingBanner.id, payload);
      }
      return createOutletBanner(anchorOutlet.id, payload);
    },
    onSuccess: () => {
      message.success(editingBanner ? 'Banner updated' : 'Banner created');
      queryClient.invalidateQueries({ queryKey: ['merchant-outlet-banners'] });
      closeModal();
    },
    onError: () => {
      message.error('Failed to save banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (banner: OutletBanner) => {
      await deleteOutletBanner(banner.outlet_id, banner.id, {
        apply_to_all_outlets: banner.applies_to_all_outlets,
      });
    },
    onSuccess: () => {
      message.success('Banner deleted');
      queryClient.invalidateQueries({ queryKey: ['merchant-outlet-banners'] });
    },
    onError: () => {
      message.error('Failed to delete banner');
    },
  });

  const handleUploadChange: UploadProps['onChange'] = async ({ fileList: nextFileList }) => {
    const latestFileList = nextFileList.slice(-1);
    setFileList(latestFileList);

    const file = latestFileList[0]?.originFileObj;
    if (!file) {
      setSuggestedColors(editingBanner ? dedupeColors(editingBanner.suggested_background_colors || [editingBanner.background_color]) : []);
      setPreviewImageUrl(editingBanner?.image || null);
      return;
    }

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewImageUrl(objectUrl);

    try {
      const colors = await extractSuggestedColorsFromFile(file);
      setSuggestedColors(colors);
      if (colors.length > 0) {
        form.setFieldValue('background_color', colors[0]);
      }
    } catch {
      message.warning('Banner ranglarini aniqlab bo‘lmadi');
      setSuggestedColors([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const imageFile = fileList[0]?.originFileObj ?? null;
      if (!editingBanner && !imageFile) {
        message.warning('Banner image yuklang');
        return;
      }
      const payload: OutletBannerPayload = {
        background_color: normalizeHexColor(values.background_color) || '',
        apply_to_all_outlets: true,
        is_active: values.is_active ?? true,
        image: imageFile,
      };
      mutation.mutate(payload);
    } catch {
      // antd validation handles feedback
    }
  };

  const partnerOptions = useMemo(
    () => partners.map((partner) => ({ value: partner.id, label: partner.name })),
    [partners],
  );
  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId) ?? null;
  const previewHeading = selectedPartner?.name || anchorOutlet?.partner?.name || 'Partner detail';
  const previewMeta = anchorOutlet ? `${anchorOutlet.city}, ${anchorOutlet.address}` : 'Outlet detail page';

  return (
    <div className="space-y-6">
      <Card>
        <Space size="large" wrap>
          <Select
            placeholder="Partnerni tanlang"
            style={{ minWidth: 280 }}
            loading={partnersLoading}
            value={selectedPartnerId ?? undefined}
            options={partnerOptions}
            onChange={(value) => setSelectedPartnerId(value)}
          />
          <Button
            type="primary"
            icon={<PictureOutlined />}
            onClick={currentBanner ? () => openEditModal(currentBanner) : openCreateModal}
            disabled={!anchorOutlet}
          >
            {currentBanner ? 'Banner tahrirlash' : 'Banner qo‘shish'}
          </Button>
        </Space>
      </Card>

      <Card title="Detail page banner">
        {selectedPartnerId === null ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : partnersLoading || outletsLoading || bannersLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : !anchorOutlet ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bu partnerga filial biriktirilmagan"
          />
        ) : !currentBanner ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bu partner uchun detail banner hali qo‘shilmagan"
          />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Card
                hoverable
                cover={
                  currentBanner.image ? (
                    <div style={{ aspectRatio: '16 / 9', overflow: 'hidden', background: currentBanner.background_color || '#f5f5f5' }}>
                      <img
                        src={currentBanner.image}
                        alt={previewHeading}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null
                }
                actions={[
                  <Button key="edit" type="link" onClick={() => openEditModal(currentBanner)}>Edit</Button>,
                  <Popconfirm
                    key="delete"
                    title="Bu banner barcha filiallardan o‘chirilsinmi?"
                    onConfirm={() => deleteMutation.mutate(currentBanner)}
                    okButtonProps={{ loading: deleteMutation.isPending }}
                  >
                    <Button type="link" danger>Delete</Button>
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Typography.Text strong>{previewHeading}</Typography.Text>
                      <div className="text-xs text-gray-500">{previewMeta}</div>
                    </div>
                    <Space size={6} wrap>
                      <Tag color="blue">{currentBanner.shared_outlet_count} filial</Tag>
                      <Tag color={currentBanner.is_active ? 'green' : 'default'}>
                        {currentBanner.is_active ? 'Active' : 'Inactive'}
                      </Tag>
                    </Space>
                  </div>
                  <Typography.Text type="secondary">
                    Bu banner shu partnerning barcha outlet detail page’larida ishlatiladi.
                  </Typography.Text>
                  <Space size={6} wrap>
                    {dedupeColors([currentBanner.background_color, ...(currentBanner.suggested_background_colors || [])], 5).map((color) => (
                      <button
                        key={color}
                        type="button"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          border: color === normalizeHexColor(currentBanner.background_color) ? '2px solid #111827' : '1px solid #d9d9d9',
                          background: color,
                          cursor: 'pointer',
                        }}
                        onClick={() => openEditModal(currentBanner)}
                        aria-label={`Banner color ${color}`}
                      />
                    ))}
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Modal
        title={editingBanner ? 'Bannerni tahrirlash' : 'Yangi banner'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={mutation.isPending}
        width={960}
        destroyOnClose
      >
        <Row gutter={24}>
          <Col xs={24} lg={14}>
            <Form form={form} layout="vertical">
              <Form.Item
                label="Qo‘llanish sohasi"
                extra="Bu banner avtomatik shu partnerning barcha filiallariga biriktiriladi."
              >
                <Tag color="blue">Barcha filiallar</Tag>
              </Form.Item>
              <Form.Item name="is_active" label="Active" valuePropName="checked" initialValue>
                <Switch />
              </Form.Item>
              <Form.Item label="Banner image" extra="PNG, JPG yoki SVG yuklash mumkin">
                <Upload
                  accept="image/*,.svg"
                  listType="picture-card"
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={(info) => void handleUploadChange(info)}
                  maxCount={1}
                >
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item name="background_color" label="Tanlangan rang">
                <Input
                  addonBefore={
                    <ColorPicker
                      value={watchedBackgroundColor}
                      onChangeComplete={(color) => form.setFieldValue('background_color', color.toHexString())}
                    />
                  }
                  placeholder="#aabbcc"
                />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small" title="Preview">
              <div
                style={{
                  background: watchedBackgroundColor,
                  borderRadius: 16,
                  overflow: 'hidden',
                  minHeight: 320,
                  color: previewTextColor,
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
                }}
              >
                <div style={{ aspectRatio: '16 / 9', background: 'rgba(255, 255, 255, 0.08)' }}>
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt={previewHeading}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: previewMutedTextColor,
                      }}
                    >
                      Banner preview
                    </div>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <Tag color="blue" style={{ marginBottom: 12 }}>
                    Barcha filiallar uchun
                  </Tag>
                  <Typography.Title level={4} style={{ margin: 0, color: previewTextColor }}>
                    {previewHeading}
                  </Typography.Title>
                  <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0, color: previewMutedTextColor }}>
                    {previewMeta}
                  </Typography.Paragraph>
                </div>
              </div>
            </Card>

            <Card size="small" title="Tavsiya ranglar" style={{ marginTop: 16 }}>
              {suggestedColors.length === 0 ? (
                <Typography.Text type="secondary">
                  Banner yuklanganda shu yerda rang tavsiyalari chiqadi.
                </Typography.Text>
              ) : (
                <Space size={10} wrap>
                  {suggestedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => form.setFieldValue('background_color', color)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        border: color === watchedBackgroundColor ? '3px solid #111827' : '1px solid #d9d9d9',
                        background: color,
                        cursor: 'pointer',
                      }}
                      aria-label={`Suggested color ${color}`}
                    />
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default BannersPage;
