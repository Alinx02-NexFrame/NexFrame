import { useState, useEffect } from 'react';
import { Wallet, Package, Eye, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { globalCartState } from '../../data/cartState';
import { globalWatchlistState } from '../../data/watchlistState';
import { globalAccountState } from '../../data/accountState';

const INITIAL_WATCHLIST_DISPLAY = 20;
const ITEMS_PER_PAGE = 20;
const MAX_WATCHLIST_ITEMS = 100;

export function PendingPayments() {
  const [searchAwb, setSearchAwb] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showAllWatchlist, setShowAllWatchlist] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountBalance, setAccountBalance] = useState(globalAccountState.getBalance());
  const navigate = useNavigate();

  // Watchlist subscription for UI updates
  useEffect(() => {
    setWatchlist(globalWatchlistState.getWatchlist());
    const unsubscribe = globalWatchlistState.subscribe(() => {
      setWatchlist(globalWatchlistState.getWatchlist());
    });
    return unsubscribe;
  }, []);

  // Account balance subscription for UI updates
  useEffect(() => {
    const unsubscribe = globalAccountState.subscribe(() => {
      setAccountBalance(globalAccountState.getBalance());
    });
    return unsubscribe;
  }, []);

  const handleRemoveFromWatchlist = (awb: string) => {
    globalWatchlistState.removeFromWatchlist(awb);
    toast.success('Removed from watchlist');
  };

  const handleWatchlistClick = (awb: string) => {
    navigate(`/dashboard/awb/${awb}`);
  };

  const handleAccountCreditClick = () => {
    toast.info('Redirecting to Account Management...');
  };

  const handleSearch = () => {
    if (!searchAwb.trim()) {
      toast.error('Please enter an AWB number');
      return;
    }

    // Navigate to AWB detail page — API validation happens there
    navigate(`/dashboard/awb/${searchAwb.trim()}`);
  };

  const handleShowAll = () => {
    setShowAllWatchlist(true);
  };

  const hasMoreWatchlist = watchlist.length > INITIAL_WATCHLIST_DISPLAY;

  // Limit to 100 items maximum
  const limitedWatchlist = watchlist.slice(0, MAX_WATCHLIST_ITEMS);

  const displayedWatchlist = showAllWatchlist
    ? limitedWatchlist  // Show all AWBs when expanded
    : limitedWatchlist.slice(0, INITIAL_WATCHLIST_DISPLAY);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(limitedWatchlist.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* AWB Search Input - Now Full Width */}
      <Card className="p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-0.5 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            AWB Search
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Enter AWB or OBL number to view charges and make payment
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter AWB number (e.g., 020-12345678)"
              value={searchAwb}
              onChange={(e) => setSearchAwb(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSearch();
                }
              }}
              className="h-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Example AWB Numbers:</strong> 020-12345678, 020-98765432, 020-11223344, 020-55667788
          </p>
        </div>
      </Card>

      {/* Watchlist Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-semibold text-gray-900 flex items-center"
          >
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Your Watchlist
          </h3>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => navigate('/watchlist')}
          >
            {watchlist.length} AWB(s)
          </Badge>
        </div>

        {watchlist.length > 0 ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayedWatchlist.map((awb) => (
                <div
                  key={awb}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleWatchlistClick(awb)}
                >
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{awb}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWatchlist(awb);
                    }}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Show All button when not expanded */}
            {hasMoreWatchlist && !showAllWatchlist && (
              <Button
                onClick={handleShowAll}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show All ({watchlist.length} AWBs)
              </Button>
            )}

            {/* Show Less button */}
            {showAllWatchlist && (
              <Button
                onClick={() => {
                  setShowAllWatchlist(false);
                }}
                variant="outline"
                className="w-full"
              >
                Show Less
              </Button>
            )}

            {watchlist.length > MAX_WATCHLIST_ITEMS && (
              <p className="text-xs text-gray-500 text-center">
                Showing first {MAX_WATCHLIST_ITEMS} AWBs (Total: {watchlist.length})
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No AWBs in your watchlist. Search for an AWB and add it to your watchlist to track it.
          </p>
        )}
      </Card>
    </div>
  );
}
