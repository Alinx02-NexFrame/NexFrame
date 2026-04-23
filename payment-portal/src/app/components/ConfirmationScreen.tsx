import { CheckCircle, Download, Package, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { PaymentConfirmation } from '../types';
import { paymentApi, downloadAuthenticatedPdf } from '../services/apiClient';

interface ConfirmationScreenProps {
  confirmation: PaymentConfirmation;
  /**
   * Per-AWB confirmations from a bulk payment. When present and length > 1,
   * the screen renders a bulk summary (list + combined-receipt download).
   * When undefined or empty, behaves as the original single-payment screen.
   */
  confirmations?: PaymentConfirmation[];
  onNewSearch: () => void;
}

export function ConfirmationScreen({ confirmation, confirmations, onNewSearch }: ConfirmationScreenProps) {
  const isBulk = (confirmations?.length ?? 0) > 1;

  const handleDownloadReceipt = async () => {
    if (isBulk && confirmations) {
      // Prefer the batchId route (single indexed lookup). Every row in a
      // bulk response carries the same batchId, so pick from the first.
      const batchId = confirmations.find((c) => c.batchId)?.batchId ?? null;
      const url = batchId
        ? paymentApi.getBulkReceiptUrlByBatch(batchId)
        : paymentApi.getBulkReceiptUrl(confirmations.map((c) => c.confirmationNumber));
      const filename = `BulkReceipt-${confirmation.confirmationNumber}.pdf`;
      const ok = await downloadAuthenticatedPdf(url, filename);
      if (!ok) {
        toast.error('Failed to download combined receipt');
      }
    } else {
      // Single-receipt endpoint is not [Authorize] — plain window.open is fine
      // and preserves the existing browser-handled download behavior.
      window.open(paymentApi.getReceiptUrl(confirmation.confirmationNumber), '_blank');
    }
  };

  // Credit Card adds a 2.9% surcharge on top; ACH and Account Credit do not.
  const isCreditCard = confirmation.paymentMethod?.toLowerCase().includes('credit') ?? false;

  // Subtotal (after Processing Fee, before Credit Card Fee)
  const subtotal = isCreditCard ? confirmation.amount / 1.029 : confirmation.amount;
  const creditCardFee = isCreditCard ? confirmation.amount - subtotal : 0;

  // Base (before Processing Fee 2.5%)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isBulk ? 'Bulk Payment Completed Successfully!' : 'Payment Completed Successfully!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isBulk
              ? `${confirmations!.length} payments processed — thank you`
              : 'Thank you for your payment'}
          </p>
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

              {isCreditCard && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Card Fee (2.9%)</span>
                    <span className="font-semibold text-gray-900">${creditCardFee.toFixed(2)}</span>
                  </div>

                  <Separator />
                </>
              )}

              <div className="flex items-center justify-between py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-semibold text-gray-900">Payment Amount</span>
                <span className="text-2xl font-bold text-green-600">${confirmation.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Per-AWB list (bulk only) */}
        {isBulk && confirmations && (
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Included Payments</h2>
            <div className="divide-y">
              {confirmations.map((c) => (
                <div key={c.confirmationNumber} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.awbNumber}</p>
                    <p className="text-xs text-gray-500">{c.confirmationNumber}</p>
                  </div>
                  <span className="font-semibold text-gray-900">${c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadReceipt}
            className="w-full"
          >
            <Download className="h-5 w-5 mr-2" />
            {isBulk ? 'Download Combined Receipt' : 'Download Receipt'}
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
