import { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Calendar, BarChart3, FileText, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { forwarderApi } from '../../services/apiClient';
import type { CompletedPayment } from '../../types';
import { toast } from 'sonner';

export function TransactionReports() {
  const [reportType, setReportType] = useState('monthly');
  const [reportPeriod, setReportPeriod] = useState('2026-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [completedPayments, setCompletedPayments] = useState<CompletedPayment[]>([]);

  // Fetch payment history from API
  useEffect(() => {
    forwarderApi.getPaymentHistory(1, 100)
      .then((result) => setCompletedPayments(result.items))
      .catch(() => setCompletedPayments([]));
  }, []);

  // Mock chart data
  const monthlyData = [
    { month: 'Jul', amount: 12500, transactions: 42 },
    { month: 'Aug', amount: 15800, transactions: 51 },
    { month: 'Sep', amount: 14200, transactions: 48 },
    { month: 'Oct', amount: 18900, transactions: 63 },
    { month: 'Nov', amount: 21300, transactions: 71 },
    { month: 'Dec', amount: 19700, transactions: 65 },
  ];

  const categoryData = [
    { name: 'Service Fee', value: 8500 },
    { name: 'Storage Fee', value: 12300 },
    { name: 'Processing Fee', value: 3200 },
    { name: 'Other Charges', value: 2100 },
  ];

  const handleExportExcel = () => {
    toast.success('Report Download', {
      description: 'Excel file has been downloaded.'
    });
  };

  const handleExportPDF = () => {
    toast.success('Report Download', {
      description: 'PDF file has been downloaded.'
    });
  };

  const handleDownloadReceipt = (id: string, awbNumber: string) => {
    toast.success('Receipt Download', {
      description: `${awbNumber} receipt has been downloaded.`
    });
  };

  const handleWidgetClick = (type: string) => {
    switch (type) {
      case 'monthly':
        toast.info('Monthly Total Details', {
          description: 'Showing detailed breakdown for current month'
        });
        break;
      case 'transactions':
        toast.info('Transaction Details', {
          description: 'View all transactions for this period'
        });
        break;
      case 'average':
        toast.info('Average Transaction Analysis', {
          description: 'Statistical analysis of transaction amounts'
        });
        break;
      case 'period':
        toast.info('Report Period Settings', {
          description: 'Click to change reporting period'
        });
        break;
    }
  };

  const filteredPayments = completedPayments.filter(payment => {
    const matchesSearch = !searchQuery ||
      payment.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.replace('PMT-', '').includes(searchQuery);
    const matchesDate = !dateFilter || payment.paymentDate.includes(dateFilter);
    return matchesSearch && matchesDate;
  });

  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessingFees = completedPayments.reduce((sum, p) => sum + p.processingFee, 0);

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Transaction Reports</h3>
            <p className="text-sm text-gray-500">Export payment records for accounting documentation</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="quarterly">Quarterly Report</SelectItem>
                <SelectItem value="yearly">Yearly Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Period Selection</label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-01">January 2026</SelectItem>
                <SelectItem value="2025-12">December 2025</SelectItem>
                <SelectItem value="2025-11">November 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics - Now Clickable */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleWidgetClick('monthly')}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Monthly Total</p>
          <p className="text-2xl font-bold text-gray-900">$26,100</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleWidgetClick('transactions')}
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">89</p>
          <p className="text-xs text-green-600 mt-1">↑ 8% from last month</p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleWidgetClick('average')}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Average Transaction</p>
          <p className="text-2xl font-bold text-gray-900">$293</p>
          <p className="text-xs text-gray-600 mt-1">per transaction</p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleWidgetClick('period')}
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Report Period</p>
          <p className="text-2xl font-bold text-gray-900">6 months</p>
          <p className="text-xs text-gray-600 mt-1">Jul - Dec 2025</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Amount ($)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Count */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Transaction Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#10b981" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Category Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={130} />
            <Tooltip />
            <Bar dataKey="value" name="Amount ($)">
              {categoryData.map((entry, index) => {
                const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
                return <Cell key={`bar-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Payment History Section - Integrated from PaymentHistory.tsx */}
      <div className="border-t-4 border-blue-100 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>

        {/* Payment History Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900">{completedPayments.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount Paid</p>
                <p className="text-3xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Processing Fees</p>
                <p className="text-3xl font-bold text-gray-900">${totalProcessingFees.toFixed(2)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Payment History Filters */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by AWB number or Payment ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and hyphens for AWB format
                    if (value === '' || /^[0-9-]*$/.test(value)) {
                      setSearchQuery(value);
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Payment History Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Download All Records
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b font-semibold text-sm text-gray-600">
              <span>Payment ID</span>
              <span>AWB Number</span>
              <span>Payment Date</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Processing Fee</span>
              <span className="text-center">Action</span>
            </div>

            {/* Payment Items */}
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-6 gap-4 py-3 items-center hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <span className="text-sm text-gray-600">{payment.id}</span>
                  <span className="font-semibold text-gray-900">{payment.awbNumber}</span>
                  <span className="text-sm text-gray-600">{payment.paymentDate}</span>
                  <span className="font-semibold text-gray-900 text-right">${payment.amount.toFixed(2)}</span>
                  <span className="text-sm text-gray-600 text-right">${payment.processingFee.toFixed(2)}</span>
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadReceipt(payment.id, payment.awbNumber)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No search results found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
