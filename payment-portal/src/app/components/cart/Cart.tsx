import { ArrowLeft, ShoppingCart, X, Package, CreditCard, Trash2, MapPin, Calendar, Weight, Box } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { globalCartState } from '../../data/cartState';
import { useState, useEffect, useMemo } from 'react';
import { mockCargoData, generateBillingInfo } from '../../data/mockData';
import { setCheckoutData } from '../../routes';
import { Input } from '../ui/input';

export function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(globalCartState.getCart());
  const [pickupDates, setPickupDates] = useState<Record<string, string>>({});

  // Subscribe to cart changes
  useEffect(() => {
    const unsubscribe = globalCartState.subscribe(() => {
      setCart(globalCartState.getCart());
    });
    return unsubscribe;
  }, []);

  // Initialize pickup dates for cart items
  useEffect(() => {
    const initialDates: Record<string, string> = {};
    cart.forEach(item => {
      if (!pickupDates[item.awbNumber]) {
        // Default to today
        initialDates[item.awbNumber] = new Date().toISOString().split('T')[0];
      }
    });
    if (Object.keys(initialDates).length > 0) {
      setPickupDates(prev => ({ ...prev, ...initialDates }));
    }
  }, [cart]);

  const handlePickupDateChange = (awbNumber: string, date: string) => {
    setPickupDates(prev => ({ ...prev, [awbNumber]: date }));
  };

  const handleRemoveFromCart = (awb: string) => {
    globalCartState.removeFromCart(awb);
    toast.success('Removed from cart');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    globalCartState.clearCart();
    toast.success('Cart cleared');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Calculate updated cart items with current pickup dates
    const updatedCartItems = cart.map(item => {
      const pickupDate = pickupDates[item.awbNumber] || new Date().toISOString().split('T')[0];
      const billing = generateBillingInfo(item.awbNumber, pickupDate);
      return {
        awbNumber: item.awbNumber,
        amount: billing?.total || item.amount
      };
    });

    // Collect detailed billing information for each cart item
    const cartBillingDetails = cart.map(item => {
      const pickupDate = pickupDates[item.awbNumber] || new Date().toISOString().split('T')[0];
      const billing = generateBillingInfo(item.awbNumber, pickupDate);
      return billing!;
    }).filter(b => b !== null);

    // Set cart items for checkout
    setCheckoutData({
      cargo: null,
      billing: null,
      cartItems: updatedCartItems,
      cartBillingDetails: cartBillingDetails
    });

    navigate('/dashboard/checkout');
  };

  // Calculate total amount based on current pickup dates - using useMemo for proper reactivity
  const { totalAmount, processingFee, grandTotal } = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      const pickupDate = pickupDates[item.awbNumber] || new Date().toISOString().split('T')[0];
      const billing = generateBillingInfo(item.awbNumber, pickupDate);
      return sum + (billing?.subtotal || 0);
    }, 0);

    const procFee = total * 0.029;
    const grand = total + procFee;

    return {
      totalAmount: total,
      processingFee: procFee,
      grandTotal: grand
    };
  }, [cart, pickupDates]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-6 w-6 mr-3 text-blue-600" />
                Shopping Cart
              </h1>
            </div>
            {cart.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {cart.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Search for AWB numbers and add items to your cart
            </p>
            <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items
                </h2>
                <Badge className="bg-blue-600 text-white">{cart.length} item(s)</Badge>
              </div>

              <Card className="overflow-hidden">
                {/* Table Body */}
                <div className="divide-y">
                  {cart.map((item) => {
                    const cargo = mockCargoData[item.awbNumber];
                    const pickupDate = pickupDates[item.awbNumber] || new Date().toISOString().split('T')[0];
                    const billing = generateBillingInfo(item.awbNumber, pickupDate);

                    return (
                      <div key={item.awbNumber} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Main Row */}
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: AWB Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900 text-base">{item.awbNumber}</p>
                                {cargo && (
                                  <p className="text-xs text-gray-500">Arrived: {cargo.arrivalDate}</p>
                                )}
                              </div>
                            </div>

                            {cargo && (
                              <>
                                {/* Route */}
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">{cargo.origin.split('(')[0].trim()}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-medium">{cargo.destination.split('(')[0].trim()}</span>
                                </div>

                                {/* Weight & Pieces */}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Weight className="h-4 w-4" />
                                    <span>{cargo.weight} kg</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Box className="h-4 w-4" />
                                    <span>{cargo.pieces} pcs</span>
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600">
                                  {cargo.description}
                                </p>

                                {/* Pickup Date Selector */}
                                <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Pickup Date:
                                  </label>
                                  <Input
                                    type="date"
                                    value={pickupDate}
                                    onChange={(e) => handlePickupDateChange(item.awbNumber, e.target.value)}
                                    min={cargo.storageStartDate}
                                    className="h-8 text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-600 whitespace-nowrap">
                                    (Storage fee updates automatically)
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Right: Pricing & Actions */}
                          <div className="flex flex-col items-end space-y-3 min-w-[200px]">
                            {/* Fees Breakdown */}
                            {billing && (
                              <div className="text-right space-y-1">
                                <div className="text-xs text-gray-500 flex justify-between gap-3">
                                  <span>Service Fee:</span>
                                  <span className="font-medium text-gray-900">${billing.serviceFee.toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between gap-3">
                                  <span>Storage Fee:</span>
                                  <span className="font-medium text-gray-900">${billing.storageFee.toFixed(2)}</span>
                                </div>
                                {billing.otherCharge > 0 && (
                                  <div className="text-xs text-gray-500 flex justify-between gap-3">
                                    <span>Other Charges:</span>
                                    <span className="font-medium text-gray-900">${billing.otherCharge.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="border-t border-gray-200 pt-1 mt-1">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-sm font-semibold text-gray-900">Total:</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      ${billing.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Remove Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromCart(item.awbNumber)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.length})</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Processing Fee</span>
                    <span>${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    Processing fee (2.9%) will be added at checkout
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
