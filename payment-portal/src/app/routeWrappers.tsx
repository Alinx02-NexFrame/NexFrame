/**
 * Route wrapper components with API integration.
 * LOCAL-ONLY — Figma Make does not generate this file.
 *
 * These wrappers contain the data-fetching logic that connects
 * Figma-generated UI components to the real backend API.
 */
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QuickPaymentSearch } from './components/QuickPaymentSearch';
import { CargoStatus } from './components/CargoStatus';
import { CheckoutScreen } from './components/CheckoutScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { ForwarderDashboard } from './components/ForwarderDashboard';
import { GHADashboard } from './components/GHADashboard';
import { DashboardCheckout } from './components/dashboard/DashboardCheckout';
import { cargoApi, billingApi, paymentApi } from './services/apiClient';
import { globalCartState } from './data/cartState';
import { globalAccountState } from './data/accountState';
import { globalWatchlistState } from './data/watchlistState';
import type { CargoInfo, BillingInfo, PaymentInfo, PaymentConfirmation } from './types';

// ---------------------------------------------------------------------------
// Shared global state for routing (same as before, but local-only)
// ---------------------------------------------------------------------------

let globalState = {
  selectedCargo: null as CargoInfo | null,
  billingInfo: null as BillingInfo | null,
  confirmation: null as PaymentConfirmation | null,
  cartItems: [] as Array<{ awbNumber: string; amount: number }>,
  cartBillingDetails: [] as Array<BillingInfo>,
  previousRoute: null as string | null,
  loginRedirectAwb: null as string | null,
};

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

export const getLoginRedirectAwb = (): string | null => {
  const awb = globalState.loginRedirectAwb;
  globalState.loginRedirectAwb = null;
  return awb;
};

// ---------------------------------------------------------------------------
// Route wrapper components (API-integrated)
// ---------------------------------------------------------------------------

export function SearchWrapper() {
  const navigate = useNavigate();

  const handleSearch = async (awbNumber: string) => {
    try {
      const [cargo, billing] = await Promise.all([
        cargoApi.search(awbNumber),
        billingApi.getByAwb(awbNumber),
      ]);
      globalState.selectedCargo = cargo;
      globalState.billingInfo = billing;
      navigate('/cargo-status');
      toast.success('Cargo information found!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Cargo Not Found', {
        description: `No cargo found for AWB number "${awbNumber}". (${message})`,
      });
    }
  };

  return <QuickPaymentSearch onSearch={handleSearch} />;
}

export function CargoStatusWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!globalState.selectedCargo || !globalState.billingInfo) {
      navigate('/search');
    }
  }, [navigate]);

  if (!globalState.selectedCargo || !globalState.billingInfo) return null;

  return (
    <CargoStatus
      cargo={globalState.selectedCargo}
      billing={globalState.billingInfo}
      onProceedToCheckout={() => navigate('/checkout')}
      onBack={() => navigate('/search')}
    />
  );
}

export function CheckoutWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!globalState.billingInfo) {
      navigate('/search');
    }
  }, [navigate]);

  if (!globalState.billingInfo) return null;

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

  return (
    <CheckoutScreen
      billing={globalState.billingInfo}
      onConfirmPayment={handleConfirmPayment}
      onBack={() => navigate('/cargo-status')}
    />
  );
}

export function ConfirmationWrapper({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!globalState.confirmation) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);

  if (!globalState.confirmation) return null;

  const handleNewSearch = () => {
    globalState.selectedCargo = null;
    globalState.billingInfo = null;
    globalState.confirmation = null;
    navigate(redirectTo);
  };

  return (
    <ConfirmationScreen
      confirmation={globalState.confirmation}
      onNewSearch={handleNewSearch}
    />
  );
}

export function ForwarderDashboardWrapper() {
  const navigate = useNavigate();
  return <ForwarderDashboard onBackToPortal={() => navigate('/')} />;
}

export function DashboardCheckoutWrapper() {
  const navigate = useNavigate();
  const isCartCheckout = globalState.cartItems.length > 0;

  useEffect(() => {
    if (!isCartCheckout && !globalState.billingInfo) {
      navigate('/dashboard');
    }
  }, [navigate, isCartCheckout]);

  if (!isCartCheckout && !globalState.billingInfo) return null;

  const handleConfirmPayment = (paymentInfo: { paymentMethod: string }) => {
    setTimeout(() => {
      if (isCartCheckout) {
        const total = globalState.cartItems.reduce((sum, item) => sum + item.amount, 0);

        if (paymentInfo.paymentMethod === 'Account Credit') {
          const subtotal = globalState.cartBillingDetails.reduce((sum, b) => sum + b.subtotal, 0);
          const success = globalAccountState.deductBalance(subtotal);
          if (!success) {
            toast.error('Insufficient account balance');
            return;
          }
        }

        globalState.cartItems.forEach((item) => {
          globalWatchlistState.removeFromWatchlist(item.awbNumber);
        });

        const confirmationData: PaymentConfirmation = {
          confirmationNumber: `PMT-${Date.now()}`,
          awbNumber: `${globalState.cartItems.length} AWBs`,
          amount: total,
          paymentDate: new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }),
          paymentMethod: paymentInfo.paymentMethod,
        };
        globalState.confirmation = confirmationData;
        globalState.cartItems = [];
        globalState.cartBillingDetails = [];
        globalCartState.clearCart();
      } else {
        if (paymentInfo.paymentMethod === 'Account Credit') {
          const success = globalAccountState.deductBalance(globalState.billingInfo!.subtotal);
          if (!success) {
            toast.error('Insufficient account balance');
            return;
          }
        }

        globalWatchlistState.removeFromWatchlist(globalState.billingInfo!.awbNumber);

        const confirmationData: PaymentConfirmation = {
          confirmationNumber: `PMT-${Date.now()}`,
          awbNumber: globalState.billingInfo!.awbNumber,
          amount: globalState.billingInfo!.total,
          paymentDate: new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }),
          paymentMethod: paymentInfo.paymentMethod,
        };
        globalState.confirmation = confirmationData;
      }

      navigate('/dashboard/confirmation');
      toast.success('Payment completed successfully!');
    }, 1000);
  };

  const billingInfo = isCartCheckout
    ? (() => {
        const totalServiceFee = globalState.cartBillingDetails.reduce((sum, b) => sum + b.serviceFee, 0);
        const totalStorageFee = globalState.cartBillingDetails.reduce((sum, b) => sum + b.storageFee, 0);
        const totalOtherCharge = globalState.cartBillingDetails.reduce((sum, b) => sum + b.otherCharge, 0);
        const subtotal = totalServiceFee + totalStorageFee + totalOtherCharge;
        return {
          awbNumber: `${globalState.cartItems.length} AWBs`,
          serviceFee: totalServiceFee,
          storageFee: totalStorageFee,
          otherCharge: totalOtherCharge,
          subtotal,
          processingFee: 0,
          total: subtotal,
        };
      })()
    : globalState.billingInfo!;

  return (
    <DashboardCheckout
      billing={billingInfo}
      onConfirmPayment={handleConfirmPayment}
      onBack={() => navigate(isCartCheckout ? '/cart' : '/dashboard')}
    />
  );
}

export function GHADashboardWrapper() {
  const navigate = useNavigate();
  return <GHADashboard onBackToPortal={() => navigate('/')} />;
}

export function CatchAllWrapper() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/'); }, [navigate]);
  return null;
}
