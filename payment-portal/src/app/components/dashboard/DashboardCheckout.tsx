import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Building2, Wallet, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { BillingInfo } from '../../types';
import { globalAccountState } from '../../data/accountState';

interface DashboardCheckoutProps {
  billing: BillingInfo;
  onConfirmPayment: (paymentInfo: { paymentMethod: string }) => void;
  onBack: () => void;
}

export function DashboardCheckout({ billing, onConfirmPayment, onBack }: DashboardCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'ach' | 'account'>('credit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(globalAccountState.getBalance());

  // Subscribe to account balance changes
  useEffect(() => {
    const unsubscribe = globalAccountState.subscribe(() => {
      setCurrentBalance(globalAccountState.getBalance());
    });
    return unsubscribe;
  }, []);

  const balanceAfterPayment = currentBalance - billing.subtotal;

  // Credit Card Fee - 2.9% only if credit card is selected
  const creditCardFee = paymentMethod === 'credit' ? billing.subtotal * 0.029 : 0;
  const finalTotal = billing.subtotal + creditCardFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const methodName = paymentMethod === 'credit' ? 'Credit Card'
                     : paymentMethod === 'ach' ? 'ACH Transfer'
                     : 'Account Credit';

    setTimeout(() => {
      onConfirmPayment({ paymentMethod: methodName });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isProcessing}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pay</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Payment Method */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>

                <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'credit' | 'ach' | 'account')}>
                  {/* Credit Card */}
                  <div className="flex items-start space-x-3 mb-4">
                    <RadioGroupItem value="credit" id="credit" className="mt-1" />
                    <Label htmlFor="credit" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2 mb-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Credit Card</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        2.9% processing fee applied
                      </p>
                    </Label>
                  </div>

                  {/* ACH Transfer */}
                  <div className="flex items-start space-x-3 mb-4">
                    <RadioGroupItem value="ach" id="ach" className="mt-1" />
                    <Label htmlFor="ach" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2 mb-1">
                        <Building2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-900">ACH Transfer</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        No additional fees • 2-3 business days
                      </p>
                    </Label>
                  </div>

                  {/* Account Credit */}
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="account" id="account" className="mt-1" />
                    <Label htmlFor="account" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2 mb-1">
                        <Wallet className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">Account Credit</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Available: ${currentBalance.toFixed(2)} • Instant processing
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              {/* Payment Details - Only show for Credit Card */}
              {paymentMethod === 'credit' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* ACH Details */}
              {paymentMethod === 'ach' && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="000123456789"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        type="text"
                        placeholder="110000000"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountName">Account Holder Name</Label>
                      <Input
                        id="accountName"
                        type="text"
                        placeholder="Your Company Name"
                        required
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Account Credit Balance Info */}
              {paymentMethod === 'account' && (
                <Card className="p-6 bg-purple-50 border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-purple-600" />
                    Account Balance
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Current Balance</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${currentBalance.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="text-gray-700">Payment Amount</span>
                      <span className="text-lg font-semibold text-red-600">
                        -${billing.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 border-t-2 border-purple-200">
                      <span className="font-semibold text-gray-900">Balance After Payment</span>
                      <span className="text-xl font-bold text-purple-600">
                        ${balanceAfterPayment.toFixed(2)}
                      </span>
                    </div>

                    {balanceAfterPayment < 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          Insufficient balance. Please add funds or choose another payment method.
                        </p>
                      </div>
                    )}

                    {balanceAfterPayment >= 0 && balanceAfterPayment < 10000 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          Low balance warning. Consider adding funds to your account.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Order Summary */}
            <div>
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>AWB Number</span>
                    <span className="font-semibold">{billing.awbNumber}</span>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fee</span>
                      <span className="font-medium">${billing.serviceFee.toFixed(2)}</span>
                    </div>

                    {billing.storageFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Storage Fee</span>
                        <span className="font-medium">${billing.storageFee.toFixed(2)}</span>
                      </div>
                    )}

                    {billing.otherCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Other Charges</span>
                        <span className="font-medium">${billing.otherCharge.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-semibold text-gray-900">Subtotal</span>
                      <span className="font-semibold">${billing.subtotal.toFixed(2)}</span>
                    </div>

                    {/* Credit Card Fee - Only show if credit card selected */}
                    {paymentMethod === 'credit' && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Credit Card Fee (2.9%)</span>
                        <span className="font-medium">${creditCardFee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing || (paymentMethod === 'account' && balanceAfterPayment < 0)}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
