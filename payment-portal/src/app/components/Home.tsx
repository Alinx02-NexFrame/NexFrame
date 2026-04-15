import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { authApi, setAccessToken } from '../services/apiClient';
import { toast } from 'sonner';
import { RegisterModal } from './auth/RegisterModal';

interface HomeProps {
  ghaName?: string;
  ghaLogo?: string;
}

export function Home({ ghaName = "Swissport", ghaLogo }: HomeProps) {
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
      toast.success(`Welcome, ${result.user.fullName}`);
      if (result.user.role === 'gha_admin') {
        navigate('/gha-dashboard');
      } else {
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
    <div className="min-h-screen bg-gray-50" data-testid="home-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-200" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            {ghaLogo ? (
              <img src={ghaLogo} alt={ghaName} className="h-10" data-testid="gha-logo" />
            ) : (
              <div className="flex items-center space-x-2" data-testid="gha-logo-text">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{ghaName}</span>
              </div>
            )}
            <div className="h-8 w-px bg-gray-300"></div>
            <span className="text-xl font-semibold text-gray-700" data-testid="portal-title">Payment Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="main-content">
        {/* Hero Banner - Full Width at Top */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-8 mb-8" data-testid="hero-banner">
          <h2 className="text-3xl font-bold mb-4 text-gray-900" data-testid="hero-title">
            Streamlined Cargo Payment Solutions
          </h2>
          <p className="text-gray-600 mb-6" data-testid="hero-description">
            Experience fast, secure payment processing for air cargo with real-time tracking and transparent billing.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" data-testid="hero-features">
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200" data-testid="feature-24-7-access">
              <span className="font-medium text-gray-700">24/7 Access</span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200" data-testid="feature-secure-payments">
              <span className="font-medium text-gray-700">Secure Payments</span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200" data-testid="feature-instant-receipts">
              <span className="font-medium text-gray-700">Instant Receipts</span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200" data-testid="feature-multiple-methods">
              <span className="font-medium text-gray-700">Multiple Methods</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Sign In */}
          <div data-testid="sign-in-section">
            <Card className="p-6 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50" data-testid="sign-in-card">
              <div className="mb-3">
                <h1 className="text-xl font-bold text-gray-900" data-testid="sign-in-title">
                  Customer Sign In
                </h1>
                <p className="text-xs text-gray-600">
                  Access your account dashboard
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3" data-testid="sign-in-form">
                <div>
                  <Label htmlFor="username" className="text-sm">Username or Email</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1.5"
                    data-testid="username-input"
                    aria-label="Username or Email"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    data-testid="password-input"
                    aria-label="Password"
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
                    <Label htmlFor="remember" className="text-xs font-normal cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800" data-testid="forgot-password-link">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full cursor-pointer hover:bg-blue-700 transition-colors"
                  size="lg"
                  disabled={isLoading}
                  data-testid="sign-in-button"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center mb-3">
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
            </Card>
          </div>

          {/* Right Side - Quick Payment */}
          <div data-testid="quick-payment-section">
            {/* Enhanced Quick Payment Section */}
            <Card
              className="p-8 cursor-pointer transition-all duration-300 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-blue-500 relative"
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
                {/* Premium badge */}
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center" data-testid="instant-badge">
                  <Zap className="h-3 w-3 mr-1" />
                  INSTANT
                </div>

                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-gray-900" data-testid="quick-payment-title">
                        Quick Payment
                      </h3>
                      <p className="text-xs text-gray-600">
                        Pay without an account
                      </p>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 py-2" data-testid="quick-payment-features">
                    <div className="text-sm text-gray-700" data-testid="feature-fast-payment">
                      <span>Pay in under 2 minutes</span>
                    </div>
                    <div className="text-sm text-gray-700" data-testid="feature-awb-entry">
                      <span>Just enter your AWB number</span>
                    </div>
                    <div className="text-sm text-gray-700" data-testid="feature-instant-receipt">
                      <span>Instant receipt via email</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2">
                    <div
                      className="flex items-center justify-center bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                      data-testid="start-quick-payment-button"
                    >
                      <span className="text-lg">Start Quick Payment</span>
                    </div>
                  </div>
                </div>
              </Card>
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

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p data-testid="copyright-text">© 2026 {ghaName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
