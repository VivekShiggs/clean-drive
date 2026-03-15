import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // role-based redirect happens via the token stored in useAuth
      const user = JSON.parse(localStorage.getItem('cd_user') || '{}');
      if (user.role === 'SUPER_ADMIN') navigate('/admin');
      else if (user.role === 'FLEET_OWNER') navigate('/fleet');
      else navigate('/driver');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-500 p-4 rounded-2xl mb-4 shadow-lg shadow-green-500/20">
            <Car size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Clean Drive</h1>
          <p className="text-gray-400 mt-1 text-sm">Fleet Management Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Clean Drive © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
