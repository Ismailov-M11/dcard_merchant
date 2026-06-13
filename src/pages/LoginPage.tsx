import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ phone: phone || 'demo', password: password || 'demo' });
      setLeaving(true); // triggers curtain-up animation
    } catch {
      setLoading(false);
    }
  };

  return (
    /* Curtain wrapper — covers full screen, lifts up on login */
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex items-center justify-center px-4 overflow-hidden',
        leaving && 'animate-curtain-up',
      )}
      onAnimationEnd={leaving ? () => navigate('/', { replace: true }) : undefined}
    >
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glass-orb orb-drift-1 w-[480px] h-[480px] bg-[#1A3F75]/30 -top-32 -left-32 absolute" />
        <div className="glass-orb orb-drift-2 w-[340px] h-[340px] bg-[#4EA4CC]/20 -top-16 -right-24 absolute" />
        <div className="glass-orb orb-drift-3 w-[400px] h-[400px] bg-[#2B5BA8]/25 -bottom-20 left-1/4 absolute" />
        <div className="glass-orb orb-drift-4 w-[280px] h-[280px] bg-[#4EA4CC]/14 bottom-16 -right-12 absolute" />
        {/* Extra smaller accents */}
        <div
          className="glass-orb orb-drift-2 w-[200px] h-[200px] bg-[#1A3F75]/18 top-1/2 left-1/2 absolute"
          style={{ animationDelay: '-10s' }}
        />
      </div>

      {/* ── Login card ── */}
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8 relative z-10">
        {/* Logo */}
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
              disabled={leaving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/75 text-sm">Пароль</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={leaving}
            />
          </div>
          <Button type="submit" className="w-full mt-2 h-11" disabled={loading || leaving}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {leaving ? 'Входим...' : 'Войти'}
          </Button>
        </form>

        {/* Bottom shine */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#1A3F75]/20 to-transparent rounded-full" />
      </div>
    </div>
  );
};

export default LoginPage;
