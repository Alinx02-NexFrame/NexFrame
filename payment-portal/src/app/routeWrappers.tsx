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
import { cargoApi, billingApi, paymentApi, getCurrentUser } from './services/apiClient';
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

  const handleConfirmPayment = async (paymentInfo: { paymentMethod: string }) => {
    // ---- Account Credit: client-side only (backend has no credit ledger). ----
    if (paymentInfo.paymentMethod === 'Account Credit') {
      if (isCartCheckout) {
        const subtotal = globalState.cartBillingDetails.reduce((sum, b) => sum + b.subtotal, 0);
        const total = globalState.cartItems.reduce((sum, item) => sum + item.amount, 0);
        if (!globalAccountState.deductBalance(subtotal)) {
          toast.error('Insufficient account balance');
          return;
        }
        globalState.cartItems.forEach((item) => {
          globalWatchlistState.removeFromWatchlist(item.awbNumber);
        });
        globalState.confirmation = {
          confirmationNumber: `PMT-${Date.now()}`,
          awbNumber: `${globalState.cartItems.length} AWBs`,
          amount: total,
          paymentDate: new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }),
          paymentMethod: paymentInfo.paymentMethod,
        };
        globalState.cartItems = [];
        globalState.cartBillingDetails = [];
        globalCartState.clearCart();
      } else {
        if (!globalAccountState.deductBalance(globalState.billingInfo!.subtotal)) {
          toast.error('Insufficient account balance');
          return;
        }
        globalWatchlistState.removeFromWatchlist(globalState.billingInfo!.awbNumber);
        globalState.confirmation = {
          confirmationNumber: `PMT-${Date.now()}`,
          awbNumber: globalState.billingInfo!.awbNumber,
          amount: globalState.billingInfo!.total,
          paymentDate: new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }),
          paymentMethod: paymentInfo.paymentMethod,
        };
      }
      navigate('/dashboard/confirmation');
      toast.success('Payment completed successfully!');
      return;
    }

    // ---- Credit Card / ACH: backend handles persistence + receipt. ----
    const user = getCurrentUser();
    if (!user) {
      toast.error('You must be signed in to complete payment.');
      return;
    }

    try {
      if (isCartCheckout) {
        const awbNumbers = globalState.cartItems.map((i) => i.awbNumber);
        const results = await paymentApi.processBulk({
          awbNumbers,
          paymentMethod: paymentInfo.paymentMethod,
          email: user.email,
        });

        // Use the most recent confirmation as the "header" for the bulk
        // receipt. The list contains one entry per AWB; the wrapper currently
        // only displays one confirmation card on the screen.
        const total = results.reduce((sum, r) => sum + r.amount, 0);
        const last = results[results.length - 1];
        globalState.confirmation = {
          confirmationNumber: last?.confirmationNumber ?? `PMT-${Date.now()}`,
          awbNumber: `${results.length} AWBs`,
          amount: total,
          paymentDate: last?.paymentDate ?? new Date().toLocaleString('en-US'),
          paymentMethod: paymentInfo.paymentMethod,
        };

        awbNumbers.forEach((awb) => globalWatchlistState.removeFromWatchlist(awb));
        globalState.cartItems = [];
        globalState.cartBillingDetails = [];
        globalCartState.clearCart();
      } else {
        const confirmation = await paymentApi.processAuthenticated({
          awbNumber: globalState.billingInfo!.awbNumber,
          paymentMethod: paymentInfo.paymentMethod,
          email: user.email,
        });
        globalState.confirmation = confirmation;
        globalWatchlistState.removeFromWatchlist(globalState.billingInfo!.awbNumber);
      }

      navigate('/dashboard/confirmation');
      toast.success('Payment completed successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Payment failed', { description: message });
      // Stay on checkout — caller's `finally` resets the button.
    }
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
