import { useState } from 'react';
import { Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BrandHeader } from './sellas/BrandHeader';
import { BrandFooter } from './sellas/BrandFooter';
import { DecoLine } from './sellas/DecoLine';

interface QuickPaymentSearchProps {
  onSearch: (awbNumber: string) => void;
  ghaName?: string;
  ghaLogo?: string;
}

export function QuickPaymentSearch({ onSearch, ghaName: _ghaName = "Sellas", ghaLogo: _ghaLogo }: QuickPaymentSearchProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const formatAwbNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 11);
    if (limitedDigits.length > 3) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    }
    return limitedDigits;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(formatAwbNumber(e.target.value));
  };

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader
        subtitle="Payment Portal"
        actions={
          <Button variant="ghost" onClick={() => navigate('/')} className="link-sellas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        }
      />

      <main className="mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-20" style={{ maxWidth: '1230px' }}>
        {/* Section title — eyebrow + H1 + yellow underline pill */}
        <div className="text-center mb-14">
          <span className="farthings-eyebrow">Look up your shipment</span>
          <h1
            className="mt-1"
            style={{ fontSize: 60, lineHeight: '70px', color: 'var(--sellas-fg-1)' }}
          >
            AWB Search
          </h1>
          <div className="flex justify-center mt-3"><DecoLine /></div>
          <p
            className="mt-6 mx-auto"
            style={{ fontSize: 18, lineHeight: '32px', color: 'var(--sellas-fg-3)', maxWidth: 560 }}
          >
            Enter your AWB or OBL number to view charges and complete payment.
          </p>
        </div>

        {/* Search card — yellow 5px border */}
        <div
          className="p-10 mx-auto"
          style={{
            background: 'var(--sellas-surface-0)',
            borderRadius: 30,
            border: '5px solid var(--sellas-yellow)',
            maxWidth: 820,
            boxShadow: 'var(--sellas-shadow-card)',
          }}
        >
          <div className="space-y-7">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter AWB number (e.g., 020-12345678)"
                  value={searchValue}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg"
                  style={{
                    height: 60,
                    borderRadius: 7,
                    borderColor: 'var(--sellas-border-soft)',
                    fontFamily: 'var(--sellas-font-heading)',
                  }}
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="px-10"
                style={{ height: 60, fontFamily: 'var(--sellas-font-heading)', fontSize: 16 }}
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>

            {/* Sample AWBs — dashed divider */}
            <div className="pt-5" style={{ borderTop: '2px dashed var(--sellas-fg-1)' }}>
              <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--sellas-fg-3)', fontSize: 14 }}>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: 'var(--sellas-yellow)',
                    color: 'var(--sellas-fg-1)',
                    fontFamily: 'var(--sellas-font-heading)',
                    fontSize: 12,
                    letterSpacing: '0.1em',
                  }}
                >
                  TEST
                </span>
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
                    className="px-4 py-2 transition-colors"
                    style={{
                      background: '#FFFFFF',
                      color: 'var(--sellas-red)',
                      fontFamily: 'var(--sellas-font-heading)',
                      fontSize: 14,
                      borderRadius: 7,
                      border: '2px solid var(--sellas-yellow)',
                    }}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Three-step explainer cards — center card vertically offset (Farthings feature-card pattern) */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 mx-auto items-start" style={{ maxWidth: 1080 }}>
          {[
            { title: 'Search', body: 'Enter your AWB number to retrieve shipment details.' },
            { title: 'Review', body: 'See a detailed breakdown of all charges and fees.' },
            { title: 'Pay', body: 'Complete secure payment and receive an instant receipt.' },
          ].map((c, i) => {
            const isMiddle = i === 1;
            return (
              <div
                key={c.title}
                className="relative px-7 pt-8 pb-12"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 30,
                  border: '5px solid var(--sellas-yellow)',
                  marginTop: isMiddle ? -40 : 0,
                  textAlign: 'center',
                }}
              >
                {/* Yellow numbered circle — hangover style */}
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 inline-flex items-center justify-center"
                  style={{
                    width: 64, height: 64, borderRadius: '9999px',
                    background: 'var(--sellas-red)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--sellas-font-heading)',
                    fontSize: 22,
                    border: '4px solid #FFFFFF',
                    boxShadow: '0 6px 16px rgba(243,39,76,0.3)',
                  }}
                >
                  0{i + 1}
                </div>
                <h3 className="mt-6" style={{ fontSize: 30, color: 'var(--sellas-fg-1)' }}>
                  {c.title}
                </h3>
                <p className="mt-3" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--sellas-fg-3)' }}>
                  {c.body}
                </p>
                {/* Yellow underline pill at the bottom */}
                <span
                  className="absolute bottom-7 left-1/2 -translate-x-1/2"
                  style={{
                    width: 56, height: 6, borderRadius: 30, background: 'var(--sellas-yellow)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Frequent customer banner — red panel, yellow accents */}
        <div
          className="p-10 mt-16 mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            background: 'var(--sellas-red)',
            borderRadius: 30,
            border: 0,
            maxWidth: 1080,
            color: '#FFFFFF',
            boxShadow: 'var(--sellas-shadow-card)',
          }}
        >
          <div>
            <span
              className="farthings-eyebrow"
              style={{ color: 'var(--sellas-yellow)' }}
            >
              For Forwarders
            </span>
            <h3
              className="mt-1"
              style={{ fontSize: 34, lineHeight: 1.15, color: '#FFFFFF', fontFamily: 'var(--sellas-font-heading)' }}
            >
              Frequent customer?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, marginTop: 8, maxWidth: 540 }}>
              Create an account for faster payments, bulk processing, and comprehensive reporting.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2"
            style={{
              background: 'var(--sellas-yellow)',
              color: 'var(--sellas-fg-1)',
              fontFamily: 'var(--sellas-font-heading)',
              fontSize: 16,
              padding: '14px 26px',
              borderRadius: 12,
              border: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
            }}
          >
            Create Account
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
