import { useState } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Settings, BarChart3, Database, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RevenueAnalytics } from './gha/RevenueAnalytics';
import { CustomerManagement } from './gha/CustomerManagement';
import { DataIntegration } from './gha/DataIntegration';
import { ReportsManagement } from './gha/ReportsManagement';

interface GHADashboardProps {
  onBackToPortal: () => void;
}

export function GHADashboard({ onBackToPortal }: GHADashboardProps) {
  const [currentTab, setCurrentTab] = useState('revenue');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Swissport GHA</h1>
                <p className="text-xs text-blue-100">Admin Dashboard - Payment Portal Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right mr-4 hidden md:block">
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-blue-100">admin@swissport.com</p>
              </div>
              <Button variant="secondary" size="sm" onClick={onBackToPortal}>
                Public Portal
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-blue-700">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">GHA Management Center</h2>
          <p className="text-gray-600">Revenue analytics, customer management, and AI data integration in one place</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
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
