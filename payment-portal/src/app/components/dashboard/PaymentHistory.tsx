import { useState, useEffect } from 'react';
import { Download, Search, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { forwarderApi, paymentApi } from '../../services/apiClient';
import { CompletedPayment } from '../../types';
import { toast } from 'sonner';

export function PaymentHistory() {
  const [completedPayments, setCompletedPayments] = useState<CompletedPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    forwarderApi.getPaymentHistory(1, 50)
      .then(data => setCompletedPayments(data.items))
      .catch(() => toast.error('Failed to load payment history'));
  }, []);

  const handleDownloadReceipt = (id: string, awbNumber: string) => {
    window.open(paymentApi.getReceiptUrl(id), '_blank');
    toast.success('Receipt Download', {
      description: `${awbNumber} receipt has been downloaded.`
    });
  };

  const filteredPayments = completedPayments.filter(payment => {
    const matchesSearch = !searchQuery || payment.awbNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || payment.paymentDate.includes(dateFilter);
    return matchesSearch && matchesDate;
  });

  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessingFees = completedPayments.reduce((sum, p) => sum + p.processingFee, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6">
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

      {/* Filters */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by AWB number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
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
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          <Button variant="outline" size="sm">
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
  );
}
