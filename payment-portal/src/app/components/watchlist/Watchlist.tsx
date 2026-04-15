import { ArrowLeft, Eye, X, Package, MapPin, Calendar, Weight, Box, Plane, Search, List, Grid3x3, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { globalWatchlistState } from '../../data/watchlistState';
import { useState, useEffect } from 'react';
import { cargoApi } from '../../services/apiClient';
import type { CargoInfo } from '../../types';
import { Input } from '../ui/input';

export function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(globalWatchlistState.getWatchlist());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterType, setFilterType] = useState<'none' | 'consignee' | 'origin' | 'destination' | 'flightDate'>('none');
  const [filterValue, setFilterValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [cargoMap, setCargoMap] = useState<Record<string, CargoInfo>>({});

  // Subscribe to watchlist changes
  useEffect(() => {
    const unsubscribe = globalWatchlistState.subscribe(() => {
      setWatchlist(globalWatchlistState.getWatchlist());
    });
    return unsubscribe;
  }, []);

  // Fetch cargo data for watchlist items from API
  useEffect(() => {
    const missing = watchlist.filter((awb) => !cargoMap[awb]);
    if (missing.length === 0) return;
    Promise.allSettled(missing.map((awb) => cargoApi.search(awb)))
      .then((results) => {
        const newMap: Record<string, CargoInfo> = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') newMap[missing[i]] = result.value;
        });
        setCargoMap((prev) => ({ ...prev, ...newMap }));
      });
  }, [watchlist.join(',')]);

  const handleRemoveFromWatchlist = (awb: string) => {
    globalWatchlistState.removeFromWatchlist(awb);
    toast.success('Removed from watchlist');
  };

  const handleClearWatchlist = () => {
    if (watchlist.length === 0) return;
    globalWatchlistState.clearWatchlist();
    toast.success('Watchlist cleared');
  };

  const handleViewDetails = (awb: string) => {
    navigate(`/dashboard/awb/${awb}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Limit to 11 digits (which becomes 12 characters with hyphen)
    const limitedDigits = digitsOnly.slice(0, 11);

    // Auto-format with hyphen after 3rd character
    let formatted = limitedDigits;
    if (limitedDigits.length > 3) {
      formatted = `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    }

    setSearchTerm(formatted);
  };

  const filteredWatchlist = watchlist.filter((awb) => {
    const cargo = cargoMap[awb];
    if (!cargo) return false;
    switch (filterType) {
      case 'consignee':
        return cargo.consignee.toLowerCase().includes(filterValue.toLowerCase());
      case 'origin':
        return cargo.origin.toLowerCase().includes(filterValue.toLowerCase());
      case 'destination':
        return cargo.destination.toLowerCase().includes(filterValue.toLowerCase());
      case 'flightDate':
        return cargo.flightDate.toLowerCase().includes(filterValue.toLowerCase());
      default:
        return true;
    }
  }).filter((awb) =>
    awb.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Eye className="h-6 w-6 mr-3 text-blue-600" />
                Your Watchlist
              </h1>
            </div>
            {watchlist.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearWatchlist}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {watchlist.length === 0 ? (
          <Card className="p-12 text-center">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Add AWB numbers to your watchlist to track them easily
            </p>
            <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Tracked Shipments
              </h2>
              <Badge className="bg-blue-600 text-white">{watchlist.length} AWB(s)</Badge>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search AWB number..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 h-12 border-2 border-gray-300 focus:border-blue-500 shadow-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 h-12 border-2 ${
                  showFilter || filterType !== 'none'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filter</span>
                {filterType !== 'none' && (
                  <Badge className="bg-blue-600 text-white ml-1">1</Badge>
                )}
              </Button>
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-lg p-1 bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span className="text-sm font-medium">List</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Grid</span>
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            {showFilter && (
              <div className="mb-6 bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Filter className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Filter by:</span>
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as any);
                      setFilterValue('');
                    }}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-sm font-medium"
                  >
                    <option value="none">No Filter</option>
                    <option value="consignee">Consignee</option>
                    <option value="origin">Origin</option>
                    <option value="destination">Destination</option>
                    <option value="flightDate">Flight Date</option>
                  </select>
                  {filterType !== 'none' && (
                    <>
                      <Input
                        type="text"
                        placeholder={`Enter ${filterType}...`}
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="flex-1 h-10 border-2 border-gray-300 focus:border-blue-500"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterType('none');
                          setFilterValue('');
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Filter
                      </Button>
                    </>
                  )}
                </div>
                {filterType !== 'none' && filterValue && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Active Filter:</span> {filterType.charAt(0).toUpperCase() + filterType.slice(1)} contains "{filterValue}"
                    {' '}• <span className="font-medium">{filteredWatchlist.length}</span> result(s) found
                  </div>
                )}
              </div>
            )}

            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'grid gap-4'}>
              {filteredWatchlist.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No AWB found matching "{searchTerm}"</p>
                </Card>
              ) : (
                filteredWatchlist.map((awb) => {
                  const cargo = cargoMap[awb];

                  return (
                    <Card key={awb} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4">
                        {/* Header with AWB and Status */}
                        <div className={`flex items-center mb-3 ${viewMode === 'grid' ? 'flex-col items-start gap-2' : 'justify-between'}`}>
                          <div className="flex items-center space-x-2">
                            <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <h3 className="font-bold text-gray-900 text-base">{awb}</h3>
                            {cargo && (
                              <span className="text-sm">
                                {cargo.readyToPickup ? (
                                    <span className="text-green-600 font-medium">✓ Ready</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">✗ Not Ready</span>
                                  )}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center space-x-2 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                            <Button
                              onClick={() => handleViewDetails(awb)}
                              size="sm"
                              className={`bg-blue-600 hover:bg-blue-700 ${viewMode === 'grid' ? 'flex-1 transition-none' : ''}`}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromWatchlist(awb)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {cargo ? (
                          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-4'} gap-x-6 gap-y-2 text-sm`}>
                            {viewMode === 'grid' ? (
                              <>
                                {/* Left Column */}
                                {/* Route */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">Route</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium text-gray-900">{cargo.origin.split('(')[0].trim()}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900">{cargo.destination.split('(')[0].trim()}</span>
                                  </div>
                                </div>

                                {/* Right Column */}
                                {/* Consignee */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Package className="h-3 w-3" />
                                    <span className="font-medium">Consignee</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.consignee}</div>
                                </div>

                                {/* Flight Date */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Plane className="h-3 w-3" />
                                    <span className="font-medium">Flight Date</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.flightDate}</div>
                                </div>

                                {/* Cargo Details */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Box className="h-3 w-3" />
                                    <span className="font-medium">Cargo</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-900">
                                    <span>{cargo.weight} kg</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{cargo.pieces} pcs</span>
                                  </div>
                                </div>

                                {/* Arrival Date */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium">Arrival Date</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.arrivalDate}</div>
                                </div>

                                {/* Description */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Package className="h-3 w-3" />
                                    <span className="font-medium">Description</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.description}</div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* List View - Original Layout */}
                                {/* Route */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">Route</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium text-gray-900">{cargo.origin.split('(')[0].trim()}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900">{cargo.destination.split('(')[0].trim()}</span>
                                  </div>
                                </div>

                                {/* Flight Date */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Plane className="h-3 w-3" />
                                    <span className="font-medium">Flight Date</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.flightDate}</div>
                                </div>

                                {/* Arrival Date */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium">Arrival Date</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.arrivalDate}</div>
                                </div>

                                {/* Cargo Details */}
                                <div>
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Box className="h-3 w-3" />
                                    <span className="font-medium">Cargo</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-900">
                                    <span>{cargo.weight} kg</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{cargo.pieces} pcs</span>
                                  </div>
                                </div>

                                {/* Description */}
                                <div className="col-span-2">
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Package className="h-3 w-3" />
                                    <span className="font-medium">Description</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.description}</div>
                                </div>

                                {/* Consignee */}
                                <div className="col-span-2">
                                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                    <Package className="h-3 w-3" />
                                    <span className="font-medium">Consignee</span>
                                  </div>
                                  <div className="text-gray-900">{cargo.consignee}</div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Cargo information not available
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
