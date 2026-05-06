import { CheckCircle, Download, Package, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { PaymentConfirmation } from '../types';
import { paymentApi, downloadAuthenticatedPdf } from '../services/apiClient';
import { BrandHeader } from './sellas/BrandHeader';
import { BrandFooter } from './sellas/BrandFooter';
import { DecoLine } from './sellas/DecoLine';

interface ConfirmationScreenProps {
  confirmation: PaymentConfirmation;
  confirmations?: PaymentConfirmation[];
  onNewSearch: () => void;
}

export function ConfirmationScreen({ confirmation, confirmations, onNewSearch }: ConfirmationScreenProps) {
  const isBulk = (confirmations?.length ?? 0) > 1;

  const handleDownloadReceipt = async () => {
    if (isBulk && confirmations) {
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
      window.open(paymentApi.getReceiptUrl(confirmation.confirmationNumber), '_blank');
    }
  };

  const isCreditCard = confirmation.paymentMethod?.toLowerCase().includes('credit') ?? false;
  const subtotal = isCreditCard ? confirmation.amount / 1.029 : confirmation.amount;
  const creditCardFee = isCreditCard ? confirmation.amount - subtotal : 0;
  const baseAmount = subtotal / 1.025;
  const processingFee = subtotal - baseAmount;

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader subtitle="Payment Portal" />

      <main className="mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-16" style={{ maxWidth: '880px' }}>
        {/* Success header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
            style={{ background: 'var(--sellas-surface-mint)' }}
          >
            <CheckCircle className="h-12 w-12" style={{ color: '#1F7A4D' }} />
          </div>
          <div className="flex justify-center"><DecoLine /></div>
          <h1
            className="mt-5"
            style={{ fontSize: 40, lineHeight: '52px', fontWeight: 700, color: 'var(--sellas-fg-1)' }}
          >
            {isBulk ? 'Bulk Payment Completed!' : 'Payment Completed!'}
          </h1>
          <p className="mt-3 script" style={{ fontSize: 28 }}>Thank you</p>
          <p className="mt-2" style={{ fontSize: 16, color: 'var(--sellas-fg-3)' }}>
            {isBulk
              ? `${confirmations!.length} payments processed successfully.`
              : 'Your transaction is confirmed.'}
          </p>
        </div>

        {/* Confirmation Details card */}
        <Card className="p-8 mb-6 sellas-card">
          <div className="space-y-6">
            <div className="text-center pb-6" style={{ borderBottom: '1px solid var(--sellas-border-soft)' }}>
              <p style={{ fontSize: 13, color: 'var(--sellas-fg-4)', marginBottom: 6 }}>Confirmation Number</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--sellas-fg-1)', letterSpacing: '-0.01em' }}>
                {confirmation.confirmationNumber}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5" style={{ color: 'var(--sellas-fg-4)' }} />
                  <span style={{ color: 'var(--sellas-fg-4)' }}>AWB Number</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{confirmation.awbNumber}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5" style={{ color: 'var(--sellas-fg-4)' }} />
                  <span style={{ color: 'var(--sellas-fg-4)' }}>Payment Date & Time</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{confirmation.paymentDate}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5" style={{ color: 'var(--sellas-fg-4)' }} />
                  <span style={{ color: 'var(--sellas-fg-4)' }}>Payment Method</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{confirmation.paymentMethod}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--sellas-fg-4)' }}>Base Amount</span>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${baseAmount.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--sellas-fg-4)' }}>Processing Fee (2.5%)</span>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${processingFee.toFixed(2)}</span>
              </div>

              <Separator />

              {isCreditCard && (
                <>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Credit Card Fee (2.9%)</span>
                    <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${creditCardFee.toFixed(2)}</span>
                  </div>

                  <Separator />
                </>
              )}

              <div
                className="flex items-center justify-between py-4 px-5 rounded-lg"
                style={{ background: 'var(--sellas-surface-lilac)' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--sellas-fg-1)' }}>Payment Amount</span>
                <span style={{ fontSize: 28, fontWeight: 800 }} className="text-gradient">
                  ${confirmation.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {isBulk && confirmations && (
          <Card className="p-6 mb-6 sellas-card">
            <DecoLine size="sm" />
            <h2 className="mt-3 mb-4" style={{ fontSize: 18, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
              Included Payments
            </h2>
            <div className="divide-y" style={{ borderColor: 'var(--sellas-border-soft)' }}>
              {confirmations.map((c) => (
                <div key={c.confirmationNumber} className="py-3 flex items-center justify-between">
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{c.awbNumber}</p>
                    <p style={{ fontSize: 12, color: 'var(--sellas-fg-5)' }}>{c.confirmationNumber}</p>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

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

        <div className="mt-10 text-center">
          <p style={{ fontSize: 14, color: 'var(--sellas-fg-3)' }}>
            A receipt has been sent to your registered email address.
          </p>
          <p className="mt-2" style={{ fontSize: 14, color: 'var(--sellas-fg-3)' }}>
            For any inquiries, please contact us:{' '}
            <a href="tel:+1-800-123-4567" className="link-sellas font-medium" style={{ color: 'var(--sellas-purple)' }}>
              +1-800-123-4567
            </a>
          </p>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
