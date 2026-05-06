import { useState } from 'react';
import { X, User, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { authApi, setAccessToken, setCurrentUser } from '../../services/apiClient';
import { globalCartState } from '../../data/cartState';
import { toast } from 'sonner';
import { DecoLine } from '../sellas/DecoLine';
import { Logo } from '../sellas/Logo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authApi.login(email, password);
      setAccessToken(result.accessToken);
      setCurrentUser(result.user);
      globalCartState.reset();
      await globalCartState.load();
      toast.success(`Welcome, ${result.user.fullName}`);
      onLoginSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error('Login failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-md rounded-[20px] overflow-hidden"
        style={{
          background: 'var(--sellas-surface-0)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        }}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <DecoLine size="sm" />
              <h2 className="mt-3" style={{ fontSize: 26, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
                Sign in to continue
              </h2>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--sellas-fg-5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sellas-fg-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sellas-fg-5)')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Info Message */}
          <div
            className="mb-5 p-4 rounded-lg"
            style={{ background: 'var(--sellas-surface-lilac)', border: '1px solid #D6D8FF' }}
          >
            <p style={{ fontSize: 13, color: 'var(--sellas-fg-2)', lineHeight: 1.6 }}>
              Sign in to your Forwarder Dashboard for AWB watchlist, bulk payment processing,
              and comprehensive reporting.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--sellas-fg-5)' }} />
                <Input
                  type="text"
                  placeholder="your.username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--sellas-fg-5)' }} />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center" style={{ color: 'var(--sellas-fg-4)', fontSize: 13 }}>
                <input type="checkbox" className="mr-2" />
                <span>Remember me</span>
              </label>
              <a href="#" className="link-sellas" style={{ fontSize: 13 }}>
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--sellas-border-soft)' }}>
            <div className="rounded-lg p-3" style={{ background: 'var(--sellas-surface-butter)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
                <span
                  className="px-1.5 py-0.5 rounded text-xs mr-1"
                  style={{ background: 'rgba(0,0,0,0.08)' }}
                >
                  TEST
                </span>
                Demo Credentials
              </p>
              <div className="space-y-1 mt-2" style={{ fontSize: 12, color: 'var(--sellas-fg-2)' }}>
                <p><strong>Username:</strong> playwrite</p>
                <p><strong>Password:</strong> 1234</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Logo size={20} showWordmark={false} />
            <p style={{ fontSize: 13, color: 'var(--sellas-fg-4)' }}>
              Don't have an account?{' '}
              <a href="#" className="link-sellas font-medium" style={{ color: 'var(--sellas-purple)' }}>
                Request Access
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
