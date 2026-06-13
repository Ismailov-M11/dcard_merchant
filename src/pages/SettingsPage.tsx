import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { fetchPartners } from '../api/outlets';
import { fetchPartnerProfile, updatePartnerProfile } from '../api/partnerProfile';
import type { Partner } from '../types';

const SettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuFileName, setMenuFileName] = useState<string | null>(null);

  const resolveLogoUrl = (path?: string | null) => {
    if (!path) {
      return null;
    }
    if (path.startsWith('http')) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
    try {
      return new URL(path, apiBase).toString();
    } catch (error) {
      return path;
    }
  };

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const list = await fetchPartners();
        setPartners(list);
        if (list.length) {
          setActivePartnerId(list[0].id);
        }
      } catch (error) {
        message.error('Failed to load partner');
      }
    };
    loadPartners();
  }, []);

  useEffect(() => {
    if (!activePartnerId) {
      return;
    }
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await fetchPartnerProfile(activePartnerId);
        form.setFieldsValue({
          name: profile.name,
          description_uz: profile.description_uz ?? '',
          description_ru: profile.description_ru ?? '',
          contact_email: profile.contact_email ?? '',
          contact_phone: profile.contact_phone ?? '',
          address: profile.address ?? '',
          website: profile.website ?? '',
          instagram_url: profile.instagram_url ?? '',
          telegram_url: profile.telegram_url ?? '',
          youtube_url: profile.youtube_url ?? '',
          facebook_url: profile.facebook_url ?? ''
        });
        setLogoPreview(resolveLogoUrl(profile.logo));
        setLogoFile(null);
        setMenuFile(null);
        setMenuFileName(profile.menu ? profile.menu.split('/').pop() ?? 'menu.pdf' : null);
      } catch (error) {
        message.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [activePartnerId, form]);

  const handleLogoChange: UploadProps['beforeUpload'] = (file) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  const handleMenuChange: UploadProps['beforeUpload'] = (file) => {
    setMenuFile(file);
    setMenuFileName(file.name);
    return false;
  };

  const handleSubmit = async (values: any) => {
    if (!activePartnerId) {
      message.warning('Partner not selected');
      return;
    }
    setLoading(true);
    try {
      await updatePartnerProfile(values, { logo: logoFile, menu: menuFile, partnerId: activePartnerId });
      message.success('Profile updated');
      setLogoFile(null);
      setMenuFile(null);
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const logoUploadProps: UploadProps = useMemo(
    () => ({
      beforeUpload: handleLogoChange,
      showUploadList: false,
      maxCount: 1,
      accept: 'image/*'
    }),
    []
  );

  const menuUploadProps: UploadProps = useMemo(
    () => ({
      beforeUpload: handleMenuChange,
      showUploadList: false,
      maxCount: 1,
      accept: 'application/pdf'
    }),
    []
  );

  return (
    <div className="space-y-6">
      <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{ name: '' }}>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="Business profile" loading={loading}>
              <Form.Item label="Business name" name="name">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Logo">
                <Space direction="vertical">
                  {logoPreview && <img src={logoPreview} alt="Logo preview" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8 }} />}
                  <Upload {...logoUploadProps}>
                    <Button icon={<UploadOutlined />}>Upload new logo</Button>
                  </Upload>
                </Space>
              </Form.Item>
              <Form.Item label="Menu (PDF)">
                <Space direction="vertical">
                  {menuFileName && <span style={{ fontSize: 13, color: '#555' }}>Current: {menuFileName}</span>}
                  <Upload {...menuUploadProps}>
                    <Button icon={<UploadOutlined />}>Upload menu PDF</Button>
                  </Upload>
                </Space>
              </Form.Item>
              <Form.Item label="Website" name="website">
                <Input placeholder="https://yourbusiness.com" />
              </Form.Item>
              <Form.Item label="Description (Uzbek)" name="description_uz">
                <Input.TextArea rows={3} placeholder="Uzbek description" />
              </Form.Item>
              <Form.Item label="Description (Russian)" name="description_ru">
                <Input.TextArea rows={3} placeholder="Russian description" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Instagram" name="instagram_url">
                    <Input placeholder="https://instagram.com/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Telegram" name="telegram_url">
                    <Input placeholder="https://t.me/..." />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="YouTube" name="youtube_url">
                    <Input placeholder="https://youtube.com/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Facebook" name="facebook_url">
                    <Input placeholder="https://facebook.com/..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Contact information" loading={loading}>
              <Form.Item label="Support email" name="contact_email">
                <Input placeholder="support@example.com" type="email" />
              </Form.Item>
              <Form.Item label="Phone" name="contact_phone">
                <Input placeholder="+998..." />
              </Form.Item>
              <Form.Item label="Address" name="address">
                <Input placeholder="Business address" />
              </Form.Item>
            </Card>
              <Row className="mt-3" justify="end">
                  <Col>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Save changes
                    </Button>
                  </Col>
              </Row>
          </Col>
        </Row>

      </Form>
    </div>
  );
};

export default SettingsPage;
