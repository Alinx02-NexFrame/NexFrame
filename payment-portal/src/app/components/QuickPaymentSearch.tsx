import { useState } from 'react';
import { Search, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface QuickPaymentSearchProps {
  onSearch: (awbNumber: string) => void;
  ghaName?: string;
  ghaLogo?: string;
}

export function QuickPaymentSearch({ onSearch, ghaName = "SELLAS", ghaLogo }: QuickPaymentSearchProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const formatAwbNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 11 digits (3 + 8)
    const limitedDigits = digits.slice(0, 11);

    // Add hyphen after 3rd digit
    if (limitedDigits.length > 3) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    }

    return limitedDigits;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAwbNumber(e.target.value);
    setSearchValue(formatted);
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
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AWB Search
          </h1>
          <p className="text-lg text-gray-600">
            Enter your AWB or OBL number to view charges and complete payment
          </p>
        </div>

        <Card className="p-8 shadow-xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter AWB number (e.g., 020-12345678)"
                  value={searchValue}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-16 text-xl font-medium border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-md"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="px-12 h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Search className="h-6 w-6 mr-2" />
                Search
              </Button>
            </div>

            {/* Test Samples */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">TEST</span>
                <span>Sample AWB numbers for testing:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['020-12345678', '020-87654321', '020-11223344'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setSearchValue(sample);
                      onSearch(sample);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-xl">Search</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Enter your AWB number to retrieve shipment details
            </p>
          </Card>

          <Card className="p-4 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-purple-50 border-purple-100">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-xl">Review</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              See detailed breakdown of all charges and fees
            </p>
          </Card>

          <Card className="p-4 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-green-50 border-green-100">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-xl">Pay</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Complete secure payment and receive instant receipt
            </p>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Frequent Customer?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create an account for faster payments, bulk processing, and comprehensive reporting
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Create Account
            </Button>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 {ghaName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
