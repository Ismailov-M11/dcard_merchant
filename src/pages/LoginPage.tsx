import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { startLoginTransition, endLoginTransition } from '@/lib/loginTransition';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Block App.tsx redirect guard BEFORE any await that triggers setUser —
    // this guarantees LoginPage stays mounted regardless of React's render timing.
    startLoginTransition();
    try {
      await login({ phone: phone || 'demo', password: password || 'demo' });
      // Hold spinner visible for 0.5s, then trigger the page lift.
      await new Promise<void>((r) => setTimeout(r, 500));
      setLeaving(true);
    } catch {
      // On failure, unblock the redirect guard and restore the form.
      endLoginTransition();
      setLoading(false);
    }
  };

  const handleAnimationEnd = () => {
    endLoginTransition();
    navigate('/', { replace: true });
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center px-4 overflow-hidden bg-background${leaving ? ' animate-curtain-up' : ''}`}
      onAnimationEnd={leaving ? handleAnimationEnd : undefined}
    >
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full orb-drift-1 w-[600px] h-[600px] -top-48 -left-48"
          style={{ background: 'rgba(26,63,117,0.55)', filter: 'blur(42px)', opacity: 0.85, animationDelay: '-7s' }}
        />
        <div
          className="absolute rounded-full orb-drift-2 w-[460px] h-[460px] -top-16 -right-32"
          style={{ background: 'rgba(78,164,204,0.48)', filter: 'blur(38px)', opacity: 0.80, animationDelay: '-6s' }}
        />
        <div
          className="absolute rounded-full orb-drift-3 w-[520px] h-[520px] -bottom-28 left-1/3"
          style={{ background: 'rgba(43,91,168,0.52)', filter: 'blur(44px)', opacity: 0.78, animationDelay: '-11s' }}
        />
        <div
          className="absolute rounded-full orb-drift-4 w-[360px] h-[360px] bottom-10 -right-20"
          style={{ background: 'rgba(78,164,204,0.44)', filter: 'blur(36px)', opacity: 0.82, animationDelay: '-4s' }}
        />
        <div
          className="absolute rounded-full orb-drift-1 w-[240px] h-[240px] top-1/2 left-1/2"
          style={{ background: 'rgba(26,63,117,0.38)', filter: 'blur(30px)', opacity: 0.70, animationDelay: '-14s' }}
        />
      </div>

      {/* ── Login card ── */}
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#1A3F75] flex items-center justify-center shadow-xl shadow-[#1A3F75]/25 mb-4">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">DCard Merchant</h1>
          <p className="text-muted-foreground text-sm mt-1">Войдите в партнёрскую панель</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground/75 text-sm">Номер телефона</Label>
            <Input
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || leaving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/75 text-sm">Пароль</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || leaving}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                disabled={loading || leaving}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors disabled:pointer-events-none"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full mt-2 h-11" disabled={loading || leaving}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Войти
          </Button>
        </form>

        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#1A3F75]/20 to-transparent rounded-full" />
      </div>
    </div>
  );
};

export default LoginPage;
