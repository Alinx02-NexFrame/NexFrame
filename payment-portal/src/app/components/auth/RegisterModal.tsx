import { useState } from 'react';
import { X, Mail, Lock, User, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { authApi, setAccessToken, setCurrentUser } from '../../services/apiClient';
import { globalCartState } from '../../data/cartState';
import { toast } from 'sonner';
import { DecoLine } from '../sellas/DecoLine';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.register({ username, email, password, fullName, companyName });
      setAccessToken(result.accessToken);
      setCurrentUser(result.user);
      globalCartState.reset();
      await globalCartState.load();
      toast.success(`Welcome, ${result.user.fullName}! Your account has been created.`);
      onRegisterSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error('Registration Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputIcon = (Icon: typeof User) => (
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--sellas-fg-5)' }} />
  );

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
                Create Account
              </h2>
              <p className="script mt-1" style={{ fontSize: 18 }}>Let's get started!</p>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--sellas-fg-5)' }}
              data-testid="register-modal-close"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sellas-fg-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sellas-fg-5)')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Username</label>
              <div className="relative">
                {inputIcon(User)}
                <Input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="register-username"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Full Name</label>
              <div className="relative">
                {inputIcon(User)}
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="register-fullname"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Email Address</label>
              <div className="relative">
                {inputIcon(Mail)}
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="register-email"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Company Name</label>
              <div className="relative">
                {inputIcon(Building2)}
                <Input
                  type="text"
                  placeholder="Your Company Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="register-company"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Password</label>
              <div className="relative">
                {inputIcon(Lock)}
                <Input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={4}
                  data-testid="register-password"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Confirm Password</label>
              <div className="relative">
                {inputIcon(Lock)}
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={4}
                  data-testid="register-confirm-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
              data-testid="register-submit"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
