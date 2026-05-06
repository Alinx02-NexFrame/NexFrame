import { CheckCircle, XCircle, Calendar, MapPin, DollarSign, ArrowLeft, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CargoInfo, BillingInfo } from '../types';
import { useNavigate } from 'react-router';
import { LoginModal } from './auth/LoginModal';
import { useState } from 'react';
import { toast } from 'sonner';
import { calculateBilling } from '../services/billingCalculator';
import { globalCartState } from '../data/cartState';
import { BrandHeader } from './sellas/BrandHeader';
import { BrandFooter } from './sellas/BrandFooter';
import { DecoLine } from './sellas/DecoLine';

interface CargoStatusProps {
  cargo: CargoInfo;
  billing: BillingInfo;
  onProceedToCheckout: () => void;
  onBack: () => void;
}

export function CargoStatus({ cargo, billing, onProceedToCheckout, onBack }: CargoStatusProps) {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    toast.success('Logged in successfully!');
    navigate(`/dashboard/awb/${cargo.awbNumber}`);

    const billing = calculateBilling(cargo);
    if (billing) {
      setTimeout(async () => {
        const success = await globalCartState.addToCart(cargo.awbNumber, billing.total);
        if (success) {
          toast.success(`AWB ${cargo.awbNumber} added to cart`, {
            description: `Amount: $${billing.total.toFixed(2)}`,
            action: { label: 'View Cart', onClick: () => navigate('/cart') },
          });
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader subtitle="Payment Portal" />

      <main className="mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-16" style={{ maxWidth: '1230px' }}>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 link-sellas"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        {/* Section title */}
        <div className="mb-10">
          <DecoLine />
          <h1 className="mt-5" style={{ fontSize: 40, lineHeight: '52px', fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
            Cargo Status & Billing
          </h1>
          <p className="mt-2" style={{ fontSize: 18, color: 'var(--sellas-fg-3)' }}>
            AWB: <span className="font-semibold" style={{ color: 'var(--sellas-fg-1)' }}>{cargo.awbNumber}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cargo Info card */}
          <div className="rounded-[10px] p-7" style={{ background: 'var(--sellas-surface-0)', boxShadow: 'var(--sellas-shadow-card)', border: '1px solid var(--sellas-border-soft)' }}>
            <div className="flex items-center gap-3 mb-5">
              <Package className="h-5 w-5" style={{ color: 'var(--sellas-purple)' }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
                Cargo Information
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="mb-3 flex items-center" style={{ fontWeight: 600, color: 'var(--sellas-fg-2)' }}>
                  <MapPin className="h-4 w-4 mr-2" style={{ color: 'var(--sellas-purple)' }} />
                  Route
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between" style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Origin</span>
                    <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{cargo.origin}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Destination</span>
                    <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{cargo.destination}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center" style={{ fontWeight: 600, color: 'var(--sellas-fg-2)' }}>
                  <Calendar className="h-4 w-4 mr-2" style={{ color: 'var(--sellas-purple)' }} />
                  Flight & Arrival
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between" style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Flight Date</span>
                    <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{cargo.flightDate}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Arrival Date</span>
                    <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>{cargo.arrivalDate}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'var(--sellas-surface-lilac)' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontWeight: 500, color: 'var(--sellas-fg-2)' }}>Pickup Status</span>
                  {cargo.readyToPickup ? (
                    <Badge className="sellas-badge-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready to Pickup
                    </Badge>
                  ) : (
                    <Badge className="sellas-badge-warning">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing card */}
          <div className="rounded-[10px] p-7" style={{ background: 'var(--sellas-surface-0)', boxShadow: 'var(--sellas-shadow-card)', border: '1px solid var(--sellas-border-soft)' }}>
            <div className="flex items-center gap-3 mb-5">
              <DollarSign className="h-5 w-5" style={{ color: 'var(--sellas-purple)' }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
                Billing Summary
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center" style={{ fontSize: 14 }}>
                <span style={{ color: 'var(--sellas-fg-4)' }}>Service Fee</span>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${billing.serviceFee.toFixed(2)}</span>
              </div>

              {billing.storageFee > 0 && (
                <div className="flex justify-between items-center" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--sellas-fg-4)' }}>Storage Fee</span>
                  <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${billing.storageFee.toFixed(2)}</span>
                </div>
              )}

              {billing.otherCharge > 0 && (
                <div className="flex justify-between items-center" style={{ fontSize: 14 }}>
                  <div>
                    <span style={{ color: 'var(--sellas-fg-4)' }}>Additional Charges</span>
                    <p style={{ fontSize: 12, color: 'var(--sellas-fg-5)' }}>Customs hold handling fee</p>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${billing.otherCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center" style={{ fontSize: 14 }}>
                <div>
                  <span style={{ color: 'var(--sellas-fg-4)' }}>Processing Fee (2.5%)</span>
                  <p style={{ fontSize: 12, color: 'var(--sellas-fg-5)' }}>Payment processing charge</p>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--sellas-fg-1)' }}>${billing.processingFee.toFixed(2)}</span>
              </div>

              <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--sellas-border-soft)' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>Total Amount</span>
                  <span style={{ fontSize: 28, fontWeight: 800 }} className="text-gradient">
                    ${billing.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg p-4 text-center" style={{ background: 'var(--sellas-surface-lilac)' }}>
                  <p style={{ fontSize: 13, color: 'var(--sellas-fg-3)', marginBottom: 12 }}>
                    <strong style={{ color: 'var(--sellas-fg-1)' }}>Sign in</strong> to access detailed
                    cargo tracking, manage multiple AWBs, and view full billing details.
                  </p>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Sign In & Pay
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: '1px solid var(--sellas-border-soft)' }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white" style={{ color: 'var(--sellas-fg-5)' }}>or</span>
                  </div>
                </div>

                <Button
                  onClick={onProceedToCheckout}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Pay as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Limited info banner */}
        <Card className="mt-8 p-7 sellas-card-showcase" style={{ background: 'var(--sellas-surface-butter)' }}>
          <DecoLine size="sm" />
          <h3 className="mt-3" style={{ fontSize: 20, fontWeight: 700, color: 'var(--sellas-fg-1)' }}>
            Limited information for guest access
          </h3>
          <p className="mt-2" style={{ fontSize: 14, color: 'var(--sellas-fg-2)' }}>
            You are viewing basic cargo information. Sign in to your account to access:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-1" style={{ fontSize: 14, color: 'var(--sellas-fg-2)' }}>
            <li>Full cargo tracking details including flight date and consignee information</li>
            <li>Real-time US Customs status updates</li>
            <li>Flexible pickup date selection with dynamic storage fee calculation</li>
            <li>Batch payment options for multiple AWBs</li>
            <li>Payment history and transaction reports</li>
          </ul>
        </Card>
      </main>

      <BrandFooter />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
