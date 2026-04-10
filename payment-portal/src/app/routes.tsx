import { createBrowserRouter, useNavigate } from 'react-router';
import { Home } from './components/Home';
import { QuickPaymentSearch } from './components/QuickPaymentSearch';
import { CargoStatus } from './components/CargoStatus';
import { CheckoutScreen } from './components/CheckoutScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { ForwarderDashboard } from './components/ForwarderDashboard';
import { GHADashboard } from './components/GHADashboard';
import { Cart } from './components/cart/Cart';
import { Watchlist } from './components/watchlist/Watchlist';
import { AwbDetailPage } from './components/dashboard/AwbDetailPage';
import { DashboardCheckout } from './components/dashboard/DashboardCheckout';
import { CargoInfo, BillingInfo, PaymentInfo, PaymentConfirmation } from './types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { globalCartState } from './data/cartState';
import { globalAccountState } from './data/accountState';
import { globalWatchlistState } from './data/watchlistState';
import { cargoApi, billingApi, paymentApi } from './services/apiClient';

// Store state globally for routing
let globalState = {
  selectedCargo: null as CargoInfo | null,
  billingInfo: null as BillingInfo | null,
  confirmation: null as PaymentConfirmation | null,
  cartItems: [] as Array<{ awbNumber: string; amount: number }>,
  cartBillingDetails: [] as Array<BillingInfo>,
  previousRoute: null as string | null,
  loginRedirectAwb: null as string | null
};

// Export function to set checkout data
export const setCheckoutData = (data: {
  cargo?: CargoInfo | null;
  billing?: BillingInfo | null;
  cartItems?: Array<{ awbNumber: string; amount: number }>;
  cartBillingDetails?: Array<BillingInfo>;
  previousRoute?: string | null;
  loginRedirectAwb?: string | null;
}) => {
  if (data.cargo !== undefined) globalState.selectedCargo = data.cargo;
  if (data.billing !== undefined) globalState.billingInfo = data.billing;
  if (data.cartItems !== undefined) globalState.cartItems = data.cartItems;
  if (data.cartBillingDetails !== undefined) globalState.cartBillingDetails = data.cartBillingDetails;
  if (data.previousRoute !== undefined) globalState.previousRoute = data.previousRoute;
  if (data.loginRedirectAwb !== undefined) globalState.loginRedirectAwb = data.loginRedirectAwb;
};

// Export function to get and clear login redirect AWB
export const getLoginRedirectAwb = (): string | null => {
  const awb = globalState.loginRedirectAwb;
  globalState.loginRedirectAwb = null; // Clear after reading
  return awb;
};

// Wrapper component for /search route (Quick Pay)
function SearchWrapper() {
  const navigate = useNavigate();

  const handleSearch = async (awbNumber: string) => {
    try {
      const cargo = await cargoApi.search(awbNumber);
      const billing = await billingApi.getByAwb(awbNumber);

      globalState.selectedCargo = cargo;
      globalState.billingInfo = billing;
      navigate('/cargo-status');
      toast.success('Cargo information found!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Cargo Not Found', {
        description: `No cargo found for AWB number "${awbNumber}". (${message})`
      });
    }
  };

  return <QuickPaymentSearch onSearch={handleSearch} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/search',
    Component: SearchWrapper
  },
  {
    path: '/cargo-status',
    Component: () => {
      const navigate = useNavigate();

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        if (!globalState.selectedCargo || !globalState.billingInfo) {
          navigate('/search');
        }
      }, [navigate]);

      if (!globalState.selectedCargo || !globalState.billingInfo) {
        return null;
      }

      const handleProceedToCheckout = () => {
        navigate('/checkout');
      };

      const handleBack = () => {
        navigate('/search');
      };

      return (
        <CargoStatus
          cargo={globalState.selectedCargo}
          billing={globalState.billingInfo}
          onProceedToCheckout={handleProceedToCheckout}
          onBack={handleBack}
        />
      );
    }
  },
  {
    path: '/checkout',
    Component: () => {
      const navigate = useNavigate();

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        if (!globalState.billingInfo) {
          navigate('/search');
        }
      }, [navigate]);

      // This is for Quick Pay (guest checkout) - only single AWB, Credit Card only
      if (!globalState.billingInfo) {
        return null;
      }

      const handleConfirmPayment = async (paymentInfo: PaymentInfo) => {
        try {
          const confirmationData = await paymentApi.process({
            awbNumber: globalState.billingInfo!.awbNumber,
            paymentMethod: paymentInfo.paymentMethod,
            email: paymentInfo.email,
            cardNumber: paymentInfo.cardNumber,
            cardExpiry: paymentInfo.cardExpiry,
            cardCVV: paymentInfo.cardCVV,
            accountNumber: paymentInfo.accountNumber,
            routingNumber: paymentInfo.routingNumber,
          });
          globalState.confirmation = confirmationData;
          navigate('/confirmation');
          toast.success('Payment completed successfully!');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.error('Payment failed', { description: message });
        }
      };

      const handleBack = () => {
        navigate('/cargo-status');
      };

      return (
        <CheckoutScreen
          billing={globalState.billingInfo}
          onConfirmPayment={handleConfirmPayment}
          onBack={handleBack}
        />
      );
    }
  },
  {
    path: '/confirmation',
    Component: () => {
      const navigate = useNavigate();

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        if (!globalState.confirmation) {
          navigate('/search');
        }
      }, [navigate]);

      if (!globalState.confirmation) {
        return null;
      }

      const handleNewSearch = () => {
        globalState.selectedCargo = null;
        globalState.billingInfo = null;
        globalState.confirmation = null;
        navigate('/search');
      };

      return (
        <ConfirmationScreen
          confirmation={globalState.confirmation}
          onNewSearch={handleNewSearch}
        />
      );
    }
  },
  {
    path: '/dashboard',
    Component: () => {
      const navigate = useNavigate();

      const handleBackToPortal = () => {
        navigate('/');
      };

      return <ForwarderDashboard onBackToPortal={handleBackToPortal} />;
    }
  },
  {
    path: '/dashboard/awb/:awbNumber',
    Component: AwbDetailPage
  },
  {
    path: '/dashboard/checkout',
    Component: () => {
      const navigate = useNavigate();

      // This is for logged-in users - supports cart items or single AWB
      const isCartCheckout = globalState.cartItems.length > 0;

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        if (!isCartCheckout && !globalState.billingInfo) {
          navigate('/dashboard');
        }
      }, [navigate, isCartCheckout]);

      if (!isCartCheckout && !globalState.billingInfo) {
        return null;
      }

      const handleConfirmPayment = (paymentInfo: { paymentMethod: string }) => {
        setTimeout(() => {
          if (isCartCheckout) {
            // Handle multiple AWB payment
            const total = globalState.cartItems.reduce((sum, item) => sum + item.amount, 0);

            // Deduct from account balance if paying with Account Credit
            if (paymentInfo.paymentMethod === 'Account Credit') {
              const subtotal = globalState.cartBillingDetails.reduce((sum, b) => sum + b.subtotal, 0);
              const success = globalAccountState.deductBalance(subtotal);
              if (!success) {
                toast.error('Insufficient account balance');
                return;
              }
            }

            // Remove all paid AWBs from watchlist
            globalState.cartItems.forEach(item => {
              globalWatchlistState.removeFromWatchlist(item.awbNumber);
            });

            const confirmationData: PaymentConfirmation = {
              confirmationNumber: `PMT-${Date.now()}`,
              awbNumber: `${globalState.cartItems.length} AWBs`,
              amount: total,
              paymentDate: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              paymentMethod: paymentInfo.paymentMethod
            };
            globalState.confirmation = confirmationData;
            globalState.cartItems = []; // Clear cart after payment
            globalState.cartBillingDetails = []; // Clear billing details
            globalCartState.clearCart(); // Clear the actual cart state
          } else {
            // Handle single AWB payment

            // Deduct from account balance if paying with Account Credit
            if (paymentInfo.paymentMethod === 'Account Credit') {
              const success = globalAccountState.deductBalance(globalState.billingInfo!.subtotal);
              if (!success) {
                toast.error('Insufficient account balance');
                return;
              }
            }

            // Remove paid AWB from watchlist
            globalWatchlistState.removeFromWatchlist(globalState.billingInfo!.awbNumber);

            const confirmationData: PaymentConfirmation = {
              confirmationNumber: `PMT-${Date.now()}`,
              awbNumber: globalState.billingInfo!.awbNumber,
              amount: globalState.billingInfo!.total,
              paymentDate: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              paymentMethod: paymentInfo.paymentMethod
            };
            globalState.confirmation = confirmationData;
          }

          navigate('/dashboard/confirmation');
          toast.success('Payment completed successfully!');
        }, 1000);
      };

      const handleBack = () => {
        if (isCartCheckout) {
          navigate('/cart');
        } else {
          navigate('/dashboard');
        }
      };

      // Create billing info for cart checkout
      const billingInfo = isCartCheckout
        ? (() => {
            // Calculate total billing details from cart
            const totalServiceFee = globalState.cartBillingDetails.reduce((sum, b) => sum + b.serviceFee, 0);
            const totalStorageFee = globalState.cartBillingDetails.reduce((sum, b) => sum + b.storageFee, 0);
            const totalOtherCharge = globalState.cartBillingDetails.reduce((sum, b) => sum + b.otherCharge, 0);
            const subtotal = totalServiceFee + totalStorageFee + totalOtherCharge;

            return {
              awbNumber: `${globalState.cartItems.length} AWBs`,
              serviceFee: totalServiceFee,
              storageFee: totalStorageFee,
              otherCharge: totalOtherCharge,
              subtotal: subtotal,
              processingFee: 0, // Will be calculated in DashboardCheckout based on payment method
              total: subtotal
            };
          })()
        : globalState.billingInfo!;

      return (
        <DashboardCheckout
          billing={billingInfo}
          onConfirmPayment={handleConfirmPayment}
          onBack={handleBack}
        />
      );
    }
  },
  {
    path: '/dashboard/confirmation',
    Component: () => {
      const navigate = useNavigate();

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        if (!globalState.confirmation) {
          navigate('/dashboard');
        }
      }, [navigate]);

      if (!globalState.confirmation) {
        return null;
      }

      const handleNewSearch = () => {
        globalState.selectedCargo = null;
        globalState.billingInfo = null;
        globalState.confirmation = null;
        navigate('/dashboard');
      };

      return (
        <ConfirmationScreen
          confirmation={globalState.confirmation}
          onNewSearch={handleNewSearch}
        />
      );
    }
  },
  {
    path: '/gha-dashboard',
    Component: () => {
      const navigate = useNavigate();

      const handleBackToPortal = () => {
        navigate('/');
      };

      return <GHADashboard onBackToPortal={handleBackToPortal} />;
    }
  },
  {
    path: '/cart',
    Component: Cart
  },
  {
    path: '/watchlist',
    Component: Watchlist
  },
  {
    path: '*',
    Component: () => {
      const navigate = useNavigate();

      // Use useEffect to prevent infinite loops
      useEffect(() => {
        navigate('/');
      }, [navigate]);

      return null;
    }
  }
]);
