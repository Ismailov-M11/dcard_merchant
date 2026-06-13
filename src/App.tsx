import { ConfigProvider, Spin, theme, Typography } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import { PARTNER_ROLES, useAuth } from './features/auth/AuthContext';

const App = () => {
  const { user, loading } = useAuth();
  const isPartnerUser = user ? PARTNER_ROLES.includes(user.role as typeof PARTNER_ROLES[number]) : false;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8
        }
      }}
    >
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : user && !isPartnerUser ? (
        <div className="min-h-screen flex items-center justify-center">
          <Typography.Text>Siz partner paneliga kira olmaysiz.</Typography.Text>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" replace />} />
        </Routes>
      )}
    </ConfigProvider>
  );
};

export default App;
