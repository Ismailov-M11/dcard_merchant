import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

interface LoginFormValues {
  phone: string;
  password: string;
}

const LoginPage = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);
    try {
      await login(values);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'not_partner') {
        setError('Siz partner paneliga kira olmaysiz. Partner owner yoki admin sifatida tasdiqlang.');
      } else {
        const message =
          (err as { response?: { data?: { error?: unknown } } }).response?.data?.error ??
          'Incorrect phone or password.';
        setError(typeof message === 'string' ? message : 'Login failed, please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <Typography.Title level={3} className="text-center mb-2">
          Partner Panel Login
        </Typography.Title>
        <Typography.Paragraph className="text-center text-gray-500">
          Use your partner phone number and password to continue.
        </Typography.Paragraph>
        {error && <Alert type="error" message={error} className="mb-4" />}
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item label="Phone number" name="phone" rules={[{ required: true, message: 'Phone is required' }]}>
            <Input placeholder="+998 90 123 45 67" size="large" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required' }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
