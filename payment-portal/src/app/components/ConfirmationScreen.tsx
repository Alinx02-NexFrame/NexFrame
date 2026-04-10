import { CheckCircle, Download, Package, Calendar, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { PaymentConfirmation } from '../types';

interface ConfirmationScreenProps {
  confirmation: PaymentConfirmation;
  onNewSearch: () => void;
}

export function ConfirmationScreen({ confirmation, onNewSearch }: ConfirmationScreenProps) {
  const handleDownloadReceipt = () => {
    // Mock PDF download
    alert('Receipt download feature (PDF will be generated in production environment)');
  };

  // Calculate fees (reverse calculation from total)
  // Total = Subtotal + Credit Card Fee (2.9%)
  // Total = Subtotal * 1.029
  const subtotal = confirmation.amount / 1.029;
  const creditCardFee = confirmation.amount - subtotal;

  // Calculate individual fees from subtotal
  // Subtotal = Base + Processing Fee (2.5%)
  // Subtotal = Base * 1.025
  const baseAmount = subtotal / 1.025;
  const processingFee = subtotal - baseAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Swissport</span>
            <span className="text-sm text-gray-500">Payment Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Completed Successfully!</h1>
          <p className="text-lg text-gray-600">Thank you for your payment</p>
        </div>

        {/* Confirmation Details */}
        <Card className="p-8 mb-6">
          <div className="space-y-6">
            {/* Confirmation Number */}
            <div className="text-center pb-6 border-b">
              <p className="text-sm text-gray-500 mb-2">Confirmation Number</p>
              <p className="text-2xl font-bold text-gray-900">{confirmation.confirmationNumber}</p>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">AWB Number</span>
                </div>
                <span className="font-semibold text-gray-900">{confirmation.awbNumber}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">Payment Date & Time</span>
                </div>
                <span className="font-semibold text-gray-900">{confirmation.paymentDate}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">Payment Method</span>
                </div>
                <span className="font-semibold text-gray-900">{confirmation.paymentMethod}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-semibold text-gray-900">${baseAmount.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Processing Fee (2.5%)</span>
                <span className="font-semibold text-gray-900">${processingFee.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Credit Card Fee (2.9%)</span>
                <span className="font-semibold text-gray-900">${creditCardFee.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-semibold text-gray-900">Payment Amount</span>
                <span className="text-2xl font-bold text-green-600">${confirmation.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadReceipt}
            className="w-full"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Receipt
          </Button>
          <Button
            size="lg"
            onClick={onNewSearch}
            className="w-full"
          >
            <Package className="h-5 w-5 mr-2" />
            New Search
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            A receipt has been sent to your registered email address.
          </p>
          <p className="text-sm text-gray-600">
            For any inquiries, please contact customer service: <a href="tel:+1-800-123-4567" className="text-blue-600 underline">+1-800-123-4567</a>
          </p>
        </div>
      </main>
    </div>
  );
}
