import { useState, useEffect } from 'react';
import { ArrowLeft, Package, DollarSign, Calendar, MapPin, Box, Weight, User, CheckCircle, XCircle, ShoppingCart, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { cargoApi, billingApi } from '../../services/apiClient';
import { calculateBilling } from '../../services/billingCalculator';
import { setCheckoutData } from '../../routeWrappers';
import { useNavigate } from 'react-router';
import { globalWatchlistState } from '../../data/watchlistState';

interface AwbSearchResultProps {
  awbNumber: string;
  onBack: () => void;
  onAddToWatchlist?: (awb: string) => void;
  onAddToCart?: (awb: string, amount: number) => void;
}

export function AwbSearchResult({ awbNumber, onBack, onAddToCart, onAddToWatchlist }: AwbSearchResultProps) {
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<import('../../types').CargoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Set default pickup date to today
  const today = new Date();
  const [pickupDate, setPickupDate] = useState<string>(today.toISOString().split('T')[0]);
  const [billing, setBilling] = useState<import('../../types').BillingInfo | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(globalWatchlistState.isInWatchlist(awbNumber));

  // Fetch cargo from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      cargoApi.search(awbNumber),
      billingApi.getByAwb(awbNumber),
    ]).then(([cargoResult, billingResult]) => {
      if (!cancelled) {
        setCargo(cargoResult);
        setBilling(billingResult);
      }
    }).catch(() => {
      if (!cancelled) setCargo(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [awbNumber]);

  // Subscribe to watchlist changes
  useEffect(() => {
    setIsInWatchlist(globalWatchlistState.isInWatchlist(awbNumber));
    const unsubscribe = globalWatchlistState.subscribe(() => {
      setIsInWatchlist(globalWatchlistState.isInWatchlist(awbNumber));
    });
    return unsubscribe;
  }, [awbNumber]);

  const handlePickupDateChange = (date: string) => {
    setPickupDate(date);
    if (cargo) {
      setBilling(calculateBilling(cargo, date));
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart && billing) {
      onAddToCart(awbNumber, billing.total);
    }
  };

  const handleAddToWatchlist = () => {
    if (onAddToWatchlist) {
      onAddToWatchlist(awbNumber);
    }
  };

  const handlePayNow = () => {
    if (billing && cargo) {
      setCheckoutData({ cargo, billing, cartItems: [], previousRoute: '/dashboard' });
      navigate('/dashboard/checkout');
    }
  };

  // Calculate storage charge details
  const calculateStorageDetails = () => {
    if (!cargo || !billing) return null;

    const arrivalDate = new Date(cargo.storageStartDate);
    const selectedDate = new Date(pickupDate);
    const totalDays = Math.floor((selectedDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    const chargeableDays = Math.max(0, totalDays - cargo.freeTimeDays);

    return {
      totalDays,
      chargeableDays,
      startDate: cargo.storageStartDate,
      pickupDate: pickupDate
    };
  };

  const storageDetails = calculateStorageDetails();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading cargo information...</p>
        </Card>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AWB Not Found
          </h3>
          <p className="text-gray-600">
            No cargo found with AWB number: <span className="font-semibold">{awbNumber}</span>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AWB Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AWB: {awbNumber}</h2>
              <p className="text-gray-600">{cargo.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {cargo.readyToPickup ? (
              <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-1" />
                Ready to Pickup
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 text-base px-4 py-2">
                <XCircle className="h-4 w-4 mr-1" />
                Not Ready
              </Badge>
            )}

            {onAddToWatchlist && (
              <Button
                onClick={handleAddToWatchlist}
                variant="outline"
                className={isInWatchlist ? 'border-gray-300 hover:bg-gray-100' : 'border-purple-300 hover:bg-purple-100'}
              >
                {isInWatchlist ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Remove from Watchlist
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Add to Watchlist
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Cargo Information Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Flight & Route Information */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Flight & Route Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Origin</span>
              <span className="font-semibold text-gray-900">{cargo.origin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination</span>
              <span className="font-semibold text-gray-900">{cargo.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Flight Date</span>
              <span className="font-semibold text-gray-900">{cargo.flightDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Arrival Date</span>
              <span className="font-semibold text-gray-900">{cargo.arrivalDate}</span>
            </div>
          </div>
        </Card>

        {/* Cargo Details */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Cargo Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Pieces</span>
              <span className="font-semibold text-gray-900">{cargo.pieces} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight</span>
              <span className="font-semibold text-gray-900">{cargo.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consignee</span>
              <span className="font-semibold text-gray-900">{cargo.consignee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commodity</span>
              <span className="font-semibold text-gray-900">{cargo.description}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600">US Customs Status</span>
              <div className="flex items-center space-x-2">
                {cargo.customsStatus === 'Released' && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">Released</Badge>
                )}
                {cargo.customsStatus === 'Hold' && (
                  <Badge className="bg-red-100 text-red-800 px-3 py-1">Hold</Badge>
                )}
                {cargo.customsStatus === 'PNF' && (
                  <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">PNF</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pickup Date and Fee Detail Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Select Pickup Date & Storage Charges */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Select Pickup Date
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date
              </label>
              <Input
                type="date"
                value={pickupDate}
                min={today.toISOString().split('T')[0]}
                onChange={(e) => handlePickupDateChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Select your planned pickup date to calculate storage charges
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Storage Charge Summary</h4>
              {storageDetails && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free Period</span>
                    <span className="font-semibold text-gray-900">{cargo.freeTimeDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Days</span>
                    <span className="font-semibold text-gray-900">{storageDetails.totalDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chargeable Days</span>
                    <span className="font-semibold text-gray-900">{storageDetails.chargeableDays} days</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Storage Fee</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${billing?.storageFee.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      As of {pickupDate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Fee Detail */}
        {billing && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Fee Detail
            </h3>

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

              <div className="border-t pt-3 mt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${billing.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button onClick={handlePayNow} size="lg" className="bg-green-600 hover:bg-green-700 w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
                <Button onClick={handleAddToCart} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
