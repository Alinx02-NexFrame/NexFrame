import { Package, CheckCircle, XCircle, Calendar, Weight, Box, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
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

    // Navigate directly to AWB detail page after login
    navigate(`/dashboard/awb/${cargo.awbNumber}`);

    // Auto-add to cart
    const billing = calculateBilling(cargo);
    if (billing) {
      setTimeout(async () => {
        const success = await globalCartState.addToCart(cargo.awbNumber, billing.total);
        if (success) {
          toast.success(`AWB ${cargo.awbNumber} added to cart`, {
            description: `Amount: $${billing.total.toFixed(2)}`,
            action: {
              label: 'View Cart',
              onClick: () => {
                navigate('/cart');
              },
            },
          });
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SELLAS</span>
            <span className="text-sm text-gray-500">Payment Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-6 border-2 hover:bg-gray-50 cursor-pointer"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        {/* AWB Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cargo Status & Billing</h1>
          <p className="text-lg text-gray-600">AWB: {cargo.awbNumber}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Cargo Information - Limited for guest users */}
          <Card className="p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Cargo Information
            </h2>

            <div className="space-y-4">
              {/* Route */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  Route
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origin</span>
                    <span className="font-semibold text-gray-900">{cargo.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination</span>
                    <span className="font-semibold text-gray-900">{cargo.destination}</span>
                  </div>
                </div>
              </div>

              {/* Arrival Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  Flight & Arrival
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight Date</span>
                    <span className="font-semibold text-gray-900">{cargo.flightDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrival Date</span>
                    <span className="font-semibold text-gray-900">{cargo.arrivalDate}</span>
                  </div>
                </div>
              </div>

              {/* Ready to Pickup Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Pickup Status</span>
                  {cargo.readyToPickup ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready to Pickup
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Ready
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Billing Summary */}
          <Card className="p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Billing Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-semibold text-gray-900">${billing.serviceFee.toFixed(2)}</span>
              </div>

              {billing.storageFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Storage Fee</span>
                  <span className="font-semibold text-gray-900">${billing.storageFee.toFixed(2)}</span>
                </div>
              )}

              {billing.otherCharge > 0 && (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">Additional Charges</span>
                    <p className="text-xs text-gray-500">Customs hold handling fee</p>
                  </div>
                  <span className="font-semibold text-gray-900">${billing.otherCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-600">Processing Fee (2.5%)</span>
                  <p className="text-xs text-gray-500">Payment processing charge</p>
                </div>
                <span className="font-semibold text-gray-900">${billing.processingFee.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${billing.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="mt-6 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Sign in</strong> to access detailed cargo tracking, manage multiple AWBs, and view full billing details
                  </p>
                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={() => setIsLoginModalOpen(true)}
                  >
                    Sign In & Pay
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
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
          </Card>
        </div>

        {/* Additional Info for Guest Users */}
        <Card className="mt-6 p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-2">Limited Information for Guest Access</h3>
          <p className="text-sm text-gray-700">
            You are viewing basic cargo information. Sign in to your account to access:
          </p>
          <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
            <li>Full cargo tracking details including flight date and consignee information</li>
            <li>Real-time US Customs status updates</li>
            <li>Flexible pickup date selection with dynamic storage fee calculation</li>
            <li>Batch payment options for multiple AWBs</li>
            <li>Payment history and transaction reports</li>
          </ul>
        </Card>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
