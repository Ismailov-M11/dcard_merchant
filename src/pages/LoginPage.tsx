import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { useCurtain } from '@/providers/CurtainProvider';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { launch } = useCurtain();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ phone: phone || 'demo', password: password || 'demo' });
      // Launch the global curtain; navigate fires after animation ends.
      // The curtain lives outside the route tree so it survives the redirect.
      launch(() => navigate('/', { replace: true }));
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 overflow-hidden bg-background">
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full orb-drift-1 w-[580px] h-[580px] -top-48 -left-48"
          style={{ background: 'rgba(26,63,117,0.55)', filter: 'blur(42px)', opacity: 0.85 }}
        />
        <div
          className="absolute rounded-full orb-drift-2 w-[440px] h-[440px] -top-16 -right-32"
          style={{ background: 'rgba(78,164,204,0.48)', filter: 'blur(38px)', opacity: 0.80, animationDelay: '-5s' }}
        />
        <div
          className="absolute rounded-full orb-drift-3 w-[500px] h-[500px] -bottom-28 left-1/3"
          style={{ background: 'rgba(43,91,168,0.52)', filter: 'blur(44px)', opacity: 0.78, animationDelay: '-2s' }}
        />
        <div
          className="absolute rounded-full orb-drift-4 w-[340px] h-[340px] bottom-10 -right-20"
          style={{ background: 'rgba(78,164,204,0.42)', filter: 'blur(36px)', opacity: 0.82, animationDelay: '-9s' }}
        />
        {/* Extra small accent */}
        <div
          className="absolute rounded-full orb-drift-1 w-[220px] h-[220px] top-1/2 left-1/2"
          style={{ background: 'rgba(26,63,117,0.38)', filter: 'blur(30px)', opacity: 0.70, animationDelay: '-13s' }}
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
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/75 text-sm">Пароль</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full mt-2 h-11" disabled={loading}>
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
