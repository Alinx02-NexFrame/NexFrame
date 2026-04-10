import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Package, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ghaApi } from '../../services/apiClient';
import { RevenueStats } from '../../types';

export function RevenueAnalytics() {
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ totalRevenue: 0, processingFeeRevenue: 0, storageFeeRevenue: 0, transactionCount: 0, period: '' });
  const [settlement, setSettlement] = useState<{ totalProcessingFees: number; settlementAmount: number }>({ totalProcessingFees: 0, settlementAmount: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number; transactions: number }[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; revenue: number; transactions: number }[]>([]);

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  useEffect(() => {
    ghaApi.getRevenue().then(setRevenueStats).catch(() => {});
    ghaApi.getSettlement().then(setSettlement).catch(() => {});
    ghaApi.getMonthlyTrend().then(setMonthlyRevenue).catch(() => {});
    ghaApi.getRevenueBreakdown().then(data =>
      setRevenueBreakdown(data.map((d, i) => ({ name: d.category, value: d.percentage, color: colors[i % colors.length] })))
    ).catch(() => {});
    ghaApi.getTopCustomers(4).then(data =>
      setTopCustomers(data.map(d => ({ name: d.companyName, revenue: d.totalSpent, transactions: d.transactionCount })))
    ).catch(() => {});
  }, []);

  const dailyTransactions = [
    { day: 'Mon', count: 18, amount: 5200 },
    { day: 'Tue', count: 22, amount: 6100 },
    { day: 'Wed', count: 19, amount: 5500 },
    { day: 'Thu', count: 25, amount: 7200 },
    { day: 'Fri', count: 28, amount: 8100 },
    { day: 'Sat', count: 8, amount: 2200 },
    { day: 'Sun', count: 7, amount: 1900 },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics Dashboard</h3>
            <p className="text-sm text-gray-500">Real-time revenue and settlement tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Period:</span>
            <Select defaultValue="current-month">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-10 w-10 text-blue-600" />
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${revenueStats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">↑ 15% from last month</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="h-10 w-10 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 mb-1">Processing Fee Revenue</p>
          <p className="text-3xl font-bold text-blue-900">${revenueStats.processingFeeRevenue.toLocaleString()}</p>
          <p className="text-xs text-blue-700 mt-1">Your platform revenue</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Storage Fee Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${revenueStats.storageFeeRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Storage revenue</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{revenueStats.transactionCount}</p>
          <p className="text-xs text-gray-600 mt-1">{revenueStats.period}</p>
        </Card>
      </div>

      {/* Processing Fee Settlement */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">Settlement Amount (This Month)</h3>
            <p className="text-sm text-green-700">GHA net revenue excluding platform fees</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-700 mb-1">GHA Receipt (75% of Processing Fee)</p>
            <p className="text-4xl font-bold text-green-900">${settlement.settlementAmount.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Revenue Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue ($)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={revenueBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                {revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="space-y-3">
          {topCustomers.map((customer, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{idx + 1}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.transactions} transaction(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${customer.revenue.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
