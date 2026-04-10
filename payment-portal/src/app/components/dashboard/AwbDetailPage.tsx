import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { AwbSearchResult } from './AwbSearchResult';
import { globalCartState } from '../../data/cartState';
import { globalWatchlistState } from '../../data/watchlistState';
import { toast } from 'sonner';
import { generateBillingInfo } from '../../data/mockData';

export function AwbDetailPage() {
  const { awbNumber } = useParams<{ awbNumber: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleAddToWatchlist = (awb: string) => {
    const isInWatchlist = globalWatchlistState.isInWatchlist(awb);

    if (isInWatchlist) {
      // Remove from watchlist
      globalWatchlistState.removeFromWatchlist(awb);
      toast.success(`Removed ${awb} from watchlist`);
    } else {
      // Add to watchlist
      const success = globalWatchlistState.addToWatchlist(awb);

      if (!success) {
        toast.error('This AWB is already in your watchlist');
        return;
      }

      toast.success(`Added ${awb} to watchlist`, {
        action: {
          label: 'View Watchlist',
          onClick: () => {
            navigate('/watchlist');
          },
        },
      });
    }
  };

  const handleAddToCart = (awb: string, amount: number) => {
    const success = globalCartState.addToCart(awb, amount);

    if (!success) {
      toast.error('This AWB is already in your cart');
      return;
    }

    toast.success(`Added ${awb} to cart`, {
      description: `Amount: $${amount.toFixed(2)}`,
      action: {
        label: 'View Cart',
        onClick: () => {
          navigate('/cart');
        },
      },
    });
  };

  if (!awbNumber) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AwbSearchResult
          awbNumber={awbNumber}
          onBack={handleBack}
          onAddToWatchlist={handleAddToWatchlist}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
