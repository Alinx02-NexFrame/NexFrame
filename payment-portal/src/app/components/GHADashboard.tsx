import { useState } from 'react';
import { DollarSign, Users, BarChart3, Database, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RevenueAnalytics } from './gha/RevenueAnalytics';
import { CustomerManagement } from './gha/CustomerManagement';
import { DataIntegration } from './gha/DataIntegration';
import { ReportsManagement } from './gha/ReportsManagement';
import { useNavigate } from 'react-router';
import { BrandHeader } from './sellas/BrandHeader';
import { DecoLine } from './sellas/DecoLine';

interface GHADashboardProps {
  onBackToPortal: () => void;
}

export function GHADashboard({ onBackToPortal }: GHADashboardProps) {
  const [currentTab, setCurrentTab] = useState('revenue');
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader
        variant="gradient"
        subtitle="GHA Admin"
        actions={
          <>
            <div className="text-right mr-2 hidden md:block">
              <p style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Admin User</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>admin@sellas.com</p>
            </div>
            <button
              onClick={onBackToPortal}
              className="px-4 py-2 rounded-md text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}
            >
              Public Portal
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium"
              style={{ color: '#FFFFFF' }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto px-6 sm:px-8 lg:px-12 py-10" style={{ maxWidth: '1230px' }}>
        <div className="mb-8">
          <DecoLine />
          <h2 className="mt-5" style={{ fontSize: 35, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
            Management Center
          </h2>
          <p className="mt-2" style={{ fontSize: 16, color: 'var(--sellas-fg-3)' }}>
            Revenue analytics, customer management, and AI data integration in one place.
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList
            className="grid w-full grid-cols-4 mb-8 p-1"
            style={{ background: 'var(--sellas-surface-lilac)', border: '1px solid var(--sellas-border-soft)' }}
          >
            <TabsTrigger value="revenue" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customer Management</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">AI Data</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="data">
            <DataIntegration />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
