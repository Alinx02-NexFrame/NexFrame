import { createBrowserRouter } from 'react-router';
import { Home } from './components/Home';
import { AwbDetailPage } from './components/dashboard/AwbDetailPage';
import { Cart } from './components/cart/Cart';
import { Watchlist } from './components/watchlist/Watchlist';
import {
  SearchWrapper,
  CargoStatusWrapper,
  CheckoutWrapper,
  ConfirmationWrapper,
  ForwarderDashboardWrapper,
  DashboardCheckoutWrapper,
  GHADashboardWrapper,
  CatchAllWrapper,
} from './routeWrappers';

// Re-export state management from routeWrappers for backward compatibility
export { setCheckoutData, getLoginRedirectAwb } from './routeWrappers';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/search',
    Component: SearchWrapper,
  },
  {
    path: '/cargo-status',
    Component: CargoStatusWrapper,
  },
  {
    path: '/checkout',
    Component: CheckoutWrapper,
  },
  {
    path: '/confirmation',
    Component: () => <ConfirmationWrapper redirectTo="/search" />,
  },
  {
    path: '/dashboard',
    Component: ForwarderDashboardWrapper,
  },
  {
    path: '/dashboard/awb/:awbNumber',
    Component: AwbDetailPage,
  },
  {
    path: '/dashboard/checkout',
    Component: DashboardCheckoutWrapper,
  },
  {
    path: '/dashboard/confirmation',
    Component: () => <ConfirmationWrapper redirectTo="/dashboard" />,
  },
  {
    path: '/gha-dashboard',
    Component: GHADashboardWrapper,
  },
  {
    path: '/cart',
    Component: Cart,
  },
  {
    path: '/watchlist',
    Component: Watchlist,
  },
  {
    path: '*',
    Component: CatchAllWrapper,
  },
]);
