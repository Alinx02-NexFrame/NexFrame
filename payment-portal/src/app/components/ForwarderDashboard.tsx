import { useState, useEffect } from 'react';
import { Package, LayoutDashboard, History, FileText, Users, LogOut, Menu, ShoppingCart, Search, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PendingPayments } from './dashboard/PendingPayments';
import { TransactionReports } from './dashboard/TransactionReports';
import { UserManagement } from './dashboard/UserManagement';
import { Badge } from './ui/badge';
import { globalCartState } from '../data/cartState';
import { globalAccountState } from '../data/accountState';
import { getCurrentUser } from '../services/apiClient';
import { useNavigate } from 'react-router';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Global Freight Solutions</h1>
                <p className="text-xs text-gray-500">Forwarder Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <Wallet className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-green-700">Account Credit</span>
                  <span className="text-sm font-bold text-green-600">${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                  <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className={`grid w-full ${isCompanyAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-8`}>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
