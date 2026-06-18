import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { startLoginTransition, endLoginTransition, isLogoutTransition, endLogoutTransition } from '@/lib/loginTransition';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [entering, setEntering] = useState(() => isLogoutTransition());
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    startLoginTransition();
    try {
      await login({ phone: phone || 'demo', password: password || 'demo' });
      await new Promise<void>((r) => setTimeout(r, 500));
      setLeaving(true);
    } catch {
      endLoginTransition();
      setLoading(false);
    }
  };

  const handleAnimationEnd = () => {
    if (leaving) {
      endLoginTransition();
      navigate('/', { replace: true });
    } else if (entering) {
      endLogoutTransition();
      setEntering(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center px-4 overflow-hidden${leaving ? ' animate-curtain-up' : entering ? ' animate-curtain-down' : ''}`}
      style={{ background: 'var(--ios-bg)' }}
      onAnimationEnd={(leaving || entering) ? handleAnimationEnd : undefined}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1 — top right, large blue */}
        <div
          className="login-blob-1 absolute rounded-full"
          style={{
            top: '-18%', right: '-14%',
            width: '58vw', height: '58vw',
            background: 'rgba(0,122,255,0.14)',
            filter: 'blur(80px)',
          }}
        />
        {/* Blob 2 — bottom left, cyan */}
        <div
          className="login-blob-2 absolute rounded-full"
          style={{
            bottom: '-22%', left: '-18%',
            width: '62vw', height: '62vw',
            background: 'rgba(0,173,255,0.11)',
            filter: 'blur(90px)',
          }}
        />
        {/* Blob 3 — mid left, soft indigo */}
        <div
          className="login-blob-3 absolute rounded-full"
          style={{
            top: '22%', left: '8%',
            width: '34vw', height: '34vw',
            background: 'rgba(88,86,214,0.07)',
            filter: 'blur(70px)',
          }}
        />
        {/* Blob 4 — bottom right, soft blue */}
        <div
          className="login-blob-4 absolute rounded-full"
          style={{
            bottom: '-8%', right: '-4%',
            width: '44vw', height: '44vw',
            background: 'rgba(0,122,255,0.08)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Login card */}
      <div
        className="w-full max-w-sm relative z-10"
        style={{
          background: 'var(--ios-card)',
          borderRadius: '28px',
          padding: '36px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid var(--ios-border)',
        }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="mb-4"
            style={{
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,122,255,0.28)',
            }}
          >
            <img src="/logo.png" alt="Dcard" className="h-16 w-16 object-cover" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--ios-text-primary)' }}
          >
            Dcard Merchant
          </h1>
          <p
            className="text-sm mt-1 text-center"
            style={{ color: 'var(--ios-text-secondary)' }}
          >
            Войдите в партнёрскую панель
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--ios-text-primary)' }}
            >
              Номер телефона
            </label>
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || leaving}
              className="ios-input w-full"
              style={{ display: 'block', boxSizing: 'border-box' }}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--ios-text-primary)' }}
            >
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || leaving}
                className="ios-input w-full"
                style={{ display: 'block', boxSizing: 'border-box', paddingRight: '44px' }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                disabled={loading || leaving}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:pointer-events-none"
                style={{ color: 'var(--ios-text-secondary)' }}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || leaving}
            className="ios-btn-primary w-full mt-2 flex items-center justify-center gap-2"
            style={{ height: '50px' }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Войти
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
