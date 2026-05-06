import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, LogOut, ShoppingCart, Wallet, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PendingPayments } from './dashboard/PendingPayments';
import { TransactionReports } from './dashboard/TransactionReports';
import { UserManagement } from './dashboard/UserManagement';
import { SavedCards } from './dashboard/SavedCards';
import { Badge } from './ui/badge';
import { globalCartState } from '../data/cartState';
import { globalAccountState } from '../data/accountState';
import { getCurrentUser } from '../services/apiClient';
import { useNavigate } from 'react-router';
import { BrandHeader } from './sellas/BrandHeader';

interface ForwarderDashboardProps {
  onBackToPortal: () => void;
}

export function ForwarderDashboard({ onBackToPortal }: ForwarderDashboardProps) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [cartCount, setCartCount] = useState(globalCartState.getCartCount());
  const [accountBalance, setAccountBalance] = useState(globalAccountState.getBalance());
  const navigate = useNavigate();
  const isCompanyAdmin = getCurrentUser()?.companyRole === 'Admin';

  // Subscribe to cart changes + fetch persisted cart on mount so a direct
  // URL load / refresh doesn't show a phantom-empty cart.
  useEffect(() => {
    const unsubscribe = globalCartState.subscribe(() => {
      setCartCount(globalCartState.getCartCount());
    });
    globalCartState.load();
    return unsubscribe;
  }, []);

  // Subscribe to account balance changes
  useEffect(() => {
    const unsubscribe = globalAccountState.subscribe(() => {
      setAccountBalance(globalAccountState.getBalance());
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    globalCartState.reset();
    navigate('/');
  };

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader
        subtitle="Forwarder Dashboard"
        actions={
          <>
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'var(--sellas-surface-mint)', border: '1px solid #B8E6CC' }}
            >
              <Wallet className="h-4 w-4" style={{ color: '#1F7A4D' }} />
              <div className="flex flex-col leading-tight">
                <span style={{ fontSize: 10, color: '#1F7A4D', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Account Credit
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1F7A4D' }}>
                  ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cart')}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  style={{ background: 'var(--sellas-purple)', color: '#FAFAFA' }}
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="link-sellas">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        }
      />

      <main className="mx-auto px-6 sm:px-8 lg:px-12 py-10" style={{ maxWidth: '1230px' }}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList
            className={`grid w-full ${isCompanyAdmin ? 'grid-cols-4' : 'grid-cols-2'} mb-8 p-1`}
            style={{ background: 'var(--sellas-surface-lilac)', border: '1px solid var(--sellas-border-soft)' }}
          >
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Saved Cards</span>
            </TabsTrigger>
            {isCompanyAdmin && (
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
            )}
            {isCompanyAdmin && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">User Management</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <PendingPayments />
          </TabsContent>

          <TabsContent value="cards">
            <SavedCards />
          </TabsContent>

          {isCompanyAdmin && (
            <TabsContent value="reports">
              <TransactionReports />
            </TabsContent>
          )}

          {isCompanyAdmin && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
