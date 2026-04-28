import { useState } from 'react';
import { Search, Package, LogIn, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface SearchScreenProps {
  onSearch: (awbNumber: string) => void;
  onNavigateToDashboard?: (type: 'forwarder' | 'gha') => void;
  ghaName?: string;
  ghaLogo?: string;
}

export function SearchScreen({ onSearch, onNavigateToDashboard, ghaName = "SELLAS", ghaLogo }: SearchScreenProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {ghaLogo ? (
                <img src={ghaLogo} alt={ghaName} className="h-10" />
              ) : (
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{ghaName}</span>
                </div>
              )}
              <div className="h-8 w-px bg-gray-300"></div>
              <span className="text-xl font-semibold text-gray-700">Payment Portal</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sign In
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onNavigateToDashboard?.('forwarder')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Forwarder Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigateToDashboard?.('gha')}>
                  <Settings className="mr-2 h-4 w-4" />
                  GHA Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AWB Search
          </h1>
          <p className="text-gray-600 mb-8">
            Enter AWB or OBL number to view charges and make payment
          </p>

          <Card className="p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter AWB number (e.g., 020-12345678)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 text-base"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Test Samples */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">TEST</span>
                <span>Sample AWB numbers:</span>
              </div>
              <div className="flex gap-2">
                {['020-12345678', '020-87654321', '020-11223344'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setSearchValue(sample);
                      onSearch(sample);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Account Benefits Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* For Freight Forwarders */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Registered Customer
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Create an account to access additional payment management features
            </p>

            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Bulk payment processing for multiple AWBs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Payment history and receipt downloads</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Monthly transaction reports and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Multi-user account management</span>
              </li>
            </ul>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => onNavigateToDashboard?.('forwarder')}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="w-full"
              >
                Register Account
              </Button>
            </div>
          </Card>

          {/* Quick Payment Info */}
          <Card className="p-6 bg-gray-50 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Payment
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              No account needed for one-time payments
            </p>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">Search by tracking number</p>
                <p className="text-gray-600">Enter your AWB or OBL number above to view charges</p>
              </div>
              <div>
                <p className="font-medium mb-1">Review charges</p>
                <p className="text-gray-600">See detailed breakdown of storage and service fees</p>
              </div>
              <div>
                <p className="font-medium mb-1">Pay securely online</p>
                <p className="text-gray-600">Complete payment with credit card or ACH</p>
              </div>
              <div>
                <p className="font-medium mb-1">Get instant receipt</p>
                <p className="text-gray-600">Download confirmation and email receipt</p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2026 {ghaName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
