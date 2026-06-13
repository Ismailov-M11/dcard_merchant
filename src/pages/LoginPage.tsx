import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ phone: phone || 'demo', password: password || 'demo' });
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="glass-orb w-96 h-96 bg-[#1A3F75]/40 -top-24 -left-24 absolute" />
      <div className="glass-orb w-80 h-80 bg-[#4EA4CC]/18 top-1/4 -right-20 absolute" />
      <div className="glass-orb w-72 h-72 bg-[#2B5BA8]/30 bottom-10 left-1/4 absolute" />

      {/* Card */}
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-[#1A3F75]/80 flex items-center justify-center shadow-xl shadow-[#1A3F75]/30 mb-4 border border-[#4EA4CC]/25">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DCard Merchant</h1>
          <p className="text-white/45 text-sm mt-1">Войдите в партнёрскую панель</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Номер телефона</Label>
            <Input
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Пароль</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full mt-2 h-11" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Войти
          </Button>
        </form>

        {/* Bottom shine */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#4EA4CC]/20 to-transparent rounded-full" />
      </div>
    </div>
  );
};

export default LoginPage;
