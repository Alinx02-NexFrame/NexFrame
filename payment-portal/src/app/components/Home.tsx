import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { authApi, setAccessToken, setCurrentUser } from '../services/apiClient';
import { globalCartState } from '../data/cartState';
import { toast } from 'sonner';
import { RegisterModal } from './auth/RegisterModal';
import { BrandHeader } from './sellas/BrandHeader';
import { BrandFooter } from './sellas/BrandFooter';
import { DecoLine } from './sellas/DecoLine';

interface HomeProps {
  ghaName?: string;
  ghaLogo?: string;
}

export function Home({ ghaName: _ghaName = "Sellas", ghaLogo: _ghaLogo }: HomeProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    try {
      const result = await authApi.login(username, password);
      setAccessToken(result.accessToken);
      setCurrentUser(result.user);
      toast.success(`Welcome, ${result.user.fullName}`);
      if (result.user.role === 'gha_admin') {
        navigate('/gha-dashboard');
      } else {
        globalCartState.reset();
        await globalCartState.load();
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error('Login Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen sellas-bg" data-testid="home-page">
      <BrandHeader subtitle="Payment Portal" />

      {/* Hero — split: copy on left, login + quick-pay on right */}
      <main
        className="mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-20"
        style={{ maxWidth: '1230px' }}
        data-testid="main-content"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — narrative */}
          <div className="pt-6">
            <span className="farthings-eyebrow">Air Cargo Payments</span>
            <h1
              className="mt-2"
              style={{ fontSize: 60, lineHeight: '68px', color: 'var(--sellas-fg-1)' }}
              data-testid="hero-title"
            >
              Pay Your Air Cargo Bills <br />
              <span className="text-gradient">With Confidence</span>
            </h1>
            <DecoLine className="mt-6" />
            <p
              className="mt-6 lead"
              style={{ fontSize: 18, lineHeight: '32px', color: 'var(--sellas-fg-3)', maxWidth: 520 }}
              data-testid="hero-description"
            >
              Look up an AWB, review your charges, and settle the bill in under two minutes. Built
              for forwarders who need fast, secure payment processing — no enterprise paperwork.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3" data-testid="hero-features" style={{ maxWidth: 520 }}>
              {[
                '24/7 Access',
                'Secure Payments',
                'Instant Receipts',
                'Multiple Methods',
              ].map((label) => (
                <div
                  key={label}
                  className="px-5 py-4"
                  style={{
                    background: '#FFFFFF',
                    border: '3px solid var(--sellas-yellow)',
                    borderRadius: 20,
                  }}
                  data-testid={`feature-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span
                    style={{
                      fontFamily: 'var(--sellas-font-heading)',
                      fontWeight: 600,
                      color: 'var(--sellas-fg-1)',
                      fontSize: 17,
                      letterSpacing: 0,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-12 script" style={{ fontSize: 32 }}>Let's get started!</p>
          </div>

          {/* RIGHT — auth + quick pay */}
          <div className="space-y-6">
            {/* Sign In card — yellow 5px border */}
            <div
              className="p-8"
              style={{
                background: 'var(--sellas-surface-0)',
                borderRadius: 30,
                border: '5px solid var(--sellas-yellow)',
              }}
              data-testid="sign-in-card"
            >
              <span className="farthings-eyebrow" style={{ fontSize: 14 }}>Members</span>
              <h2
                className="mt-1"
                style={{ fontSize: 34, lineHeight: 1.15, color: 'var(--sellas-fg-1)' }}
                data-testid="sign-in-title"
              >
                Customer Sign In
              </h2>
              <p style={{ color: 'var(--sellas-fg-3)', fontSize: 15, marginTop: 6 }}>
                Access your account dashboard.
              </p>

              <form onSubmit={handleSignIn} className="mt-6 space-y-4" data-testid="sign-in-form">
                <div>
                  <Label
                    htmlFor="username"
                    style={{ color: 'var(--sellas-fg-1)', fontFamily: 'var(--sellas-font-heading)', fontSize: 14 }}
                  >
                    Username or Email
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-2"
                    data-testid="username-input"
                    aria-label="Username or Email"
                    style={{ borderRadius: 7, height: 46 }}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    style={{ color: 'var(--sellas-fg-1)', fontFamily: 'var(--sellas-font-heading)', fontSize: 14 }}
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2"
                    data-testid="password-input"
                    aria-label="Password"
                    style={{ borderRadius: 7, height: 46 }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      data-testid="remember-me-checkbox"
                    />
                    <Label htmlFor="remember" className="text-xs font-normal cursor-pointer" style={{ color: 'var(--sellas-fg-4)' }}>
                      Remember me
                    </Label>
                  </div>
                  <a href="#" className="link-sellas" style={{ fontSize: 13, fontWeight: 600 }} data-testid="forgot-password-link">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  size="lg"
                  disabled={isLoading}
                  data-testid="sign-in-button"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-7 pt-5" style={{ borderTop: '2px dashed var(--sellas-fg-1)' }}>
                <p className="text-center mb-3" style={{ color: 'var(--sellas-fg-4)', fontSize: 13 }}>
                  Don't have an account?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="create-account-button"
                  onClick={() => setShowRegister(true)}
                >
                  Create Account
                </Button>
              </div>
            </div>

            {/* Quick Payment showcase card — solid red, white text */}
            <div
              className="relative p-8 cursor-pointer transition-transform"
              style={{
                background: 'var(--sellas-red)',
                borderRadius: 30,
                border: 0,
                color: '#FFFFFF',
                boxShadow: 'var(--sellas-shadow-card)',
              }}
              onClick={() => navigate('/search')}
              data-testid="quick-payment-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/search');
                }
              }}
            >
              {/* Yellow circular INSTANT badge — hangover style */}
              <div
                className="absolute -top-4 -right-4 inline-flex items-center justify-center"
                style={{
                  background: 'var(--sellas-yellow)',
                  color: 'var(--sellas-fg-1)',
                  fontFamily: 'var(--sellas-font-heading)',
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  width: 88,
                  height: 88,
                  borderRadius: '9999px',
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                  flexDirection: 'column',
                  lineHeight: 1.05,
                  textAlign: 'center',
                }}
                data-testid="instant-badge"
              >
                <Zap className="h-4 w-4 mb-0.5" />
                INSTANT
              </div>

              <span
                className="farthings-eyebrow"
                style={{ color: 'var(--sellas-yellow)', fontSize: 14 }}
              >
                No Account Needed
              </span>
              <h3
                className="mt-1"
                style={{ fontSize: 34, lineHeight: 1.15, color: '#FFFFFF', fontFamily: 'var(--sellas-font-heading)' }}
                data-testid="quick-payment-title"
              >
                Quick Payment
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, marginTop: 6 }}>
                Pay without an account.
              </p>

              <ul
                className="mt-6 space-y-3"
                style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15 }}
                data-testid="quick-payment-features"
              >
                <li
                  className="flex items-center gap-3"
                  data-testid="feature-fast-payment"
                  style={{ borderBottom: '2px dashed rgba(255,255,255,0.35)', paddingBottom: 10 }}
                >
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%', background: 'var(--sellas-yellow)', flexShrink: 0,
                    }}
                  />
                  Pay in under 2 minutes
                </li>
                <li
                  className="flex items-center gap-3"
                  data-testid="feature-awb-entry"
                  style={{ borderBottom: '2px dashed rgba(255,255,255,0.35)', paddingBottom: 10 }}
                >
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%', background: 'var(--sellas-yellow)', flexShrink: 0,
                    }}
                  />
                  Just enter your AWB number
                </li>
                <li className="flex items-center gap-3" data-testid="feature-instant-receipt">
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%', background: 'var(--sellas-yellow)', flexShrink: 0,
                    }}
                  />
                  Instant receipt via email
                </li>
              </ul>

              <button
                type="button"
                className="mt-7 w-full inline-flex items-center justify-center gap-2"
                data-testid="start-quick-payment-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/search');
                }}
                style={{
                  background: 'var(--sellas-yellow)',
                  color: 'var(--sellas-fg-1)',
                  fontFamily: 'var(--sellas-font-heading)',
                  fontSize: 16,
                  letterSpacing: '0.02em',
                  padding: '14px 24px',
                  borderRadius: 12,
                  border: 0,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                }}
              >
                <span>Start Quick Payment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegisterSuccess={() => {
          setShowRegister(false);
          navigate('/dashboard');
        }}
      />

      <BrandFooter />
    </div>
  );
}
