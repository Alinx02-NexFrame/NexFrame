import { ArrowLeft, Eye, X, Package, MapPin, Calendar, Plane, Search, Filter, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { globalWatchlistState } from '../../data/watchlistState';
import { useState, useEffect, useMemo } from 'react';
import { cargoApi } from '../../services/apiClient';
import type { CargoInfo } from '../../types';
import { BrandHeader } from '../sellas/BrandHeader';

type FilterType = 'all' | 'ready' | 'notReady' | 'released' | 'hold';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All Tracked' },
  { id: 'ready', label: 'Ready to Pickup' },
  { id: 'notReady', label: 'Not Ready' },
  { id: 'released', label: 'Customs Released' },
  { id: 'hold', label: 'On Hold' },
];

type SortMode = 'recent' | 'origin' | 'destination' | 'flightDate';

function statusBadge(cargo: CargoInfo | undefined) {
  if (!cargo) return null;
  if (cargo.customsStatus === 'Hold') {
    return { label: 'Hold', color: 'var(--nm-hot)' };
  }
  if (cargo.customsStatus === 'PNF') {
    return { label: 'PNF', color: 'var(--nm-discount)' };
  }
  if (cargo.readyToPickup) {
    return { label: 'Ready', color: 'var(--nm-new)' };
  }
  return { label: 'Pending', color: 'var(--nm-sale)' };
}

export function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(globalWatchlistState.getWatchlist());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [cargoMap, setCargoMap] = useState<Record<string, CargoInfo>>({});

  useEffect(() => {
    const unsubscribe = globalWatchlistState.subscribe(() => {
      setWatchlist(globalWatchlistState.getWatchlist());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const missing = watchlist.filter((awb) => !cargoMap[awb]);
    if (missing.length === 0) return;
    Promise.allSettled(missing.map((awb) => cargoApi.search(awb))).then((results) => {
      const newMap: Record<string, CargoInfo> = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') newMap[missing[i]] = result.value;
      });
      setCargoMap((prev) => ({ ...prev, ...newMap }));
    });
  }, [watchlist.join(',')]);

  const handleRemove = (awb: string) => {
    globalWatchlistState.removeFromWatchlist(awb);
    toast.success('Removed from watchlist');
  };

  const handleClearAll = () => {
    if (watchlist.length === 0) return;
    globalWatchlistState.clearWatchlist();
    toast.success('Watchlist cleared');
  };

  const handleViewDetails = (awb: string) => {
    navigate(`/dashboard/awb/${awb}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
    let formatted = digitsOnly;
    if (digitsOnly.length > 3) {
      formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    }
    setSearchTerm(formatted);
  };

  const counts = useMemo(() => {
    const c = { all: 0, ready: 0, notReady: 0, released: 0, hold: 0 };
    watchlist.forEach((awb) => {
      const cargo = cargoMap[awb];
      c.all += 1;
      if (!cargo) return;
      if (cargo.readyToPickup) c.ready += 1;
      else c.notReady += 1;
      if (cargo.customsStatus === 'Released') c.released += 1;
      if (cargo.customsStatus === 'Hold') c.hold += 1;
    });
    return c;
  }, [watchlist, cargoMap]);

  const filtered = useMemo(() => {
    const list = watchlist.filter((awb) => {
      const cargo = cargoMap[awb];
      if (searchTerm && !awb.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (!cargo) return activeFilter === 'all';
      switch (activeFilter) {
        case 'ready': return cargo.readyToPickup;
        case 'notReady': return !cargo.readyToPickup;
        case 'released': return cargo.customsStatus === 'Released';
        case 'hold': return cargo.customsStatus === 'Hold';
        default: return true;
      }
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      const ca = cargoMap[a];
      const cb = cargoMap[b];
      if (!ca || !cb) return 0;
      switch (sortMode) {
        case 'origin': return ca.origin.localeCompare(cb.origin);
        case 'destination': return ca.destination.localeCompare(cb.destination);
        case 'flightDate': return (ca.flightDate || '').localeCompare(cb.flightDate || '');
        default: return 0;
      }
    });
    return sorted;
  }, [watchlist, cargoMap, activeFilter, searchTerm, sortMode]);

  return (
    <div className="min-h-screen sellas-bg">
      <BrandHeader
        subtitle="Watchlist"
        actions={
          <>
            <button
              onClick={() => navigate('/dashboard')}
              className="link-sellas inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            {watchlist.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center text-sm font-medium px-3 py-2 rounded-md text-red-600 hover:bg-red-50 border border-red-200"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </button>
            )}
          </>
        }
      />

      <div className="nestmart-page">
        <div className="mx-auto px-6 sm:px-8 lg:px-12 py-8" style={{ maxWidth: '1320px' }}>
          {/* Hero strip */}
          <section className="nm-hero">
            <span className="nm-hero__sub">YOUR WATCHLIST · {watchlist.length} TRACKED</span>
            <h1 className="nm-hero__h">
              Stay home &amp; track your<br />daily shipments.
            </h1>
            <p className="nm-hero__p">
              Keep an eye on every AWB you care about. Filter by status, jump straight to details, or clear the slate when you&apos;re done.
            </p>
          </section>

          {watchlist.length === 0 ? (
            <div className="nm-empty">
              <Eye className="h-14 w-14 mx-auto mb-4" style={{ color: 'var(--nm-green)' }} />
              <h3>Your Watchlist Is Empty</h3>
              <p>Add AWB numbers from any cargo detail page to start tracking them here.</p>
              <button onClick={() => navigate('/dashboard')} className="nm-btn">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="nm-shop">
              {/* ── Sidebar: filter widgets ─────────────────────────── */}
              <aside className="nm-side">
                <div className="nm-panel">
                  <h3 className="nm-panel__head">Filter By Status</h3>
                  {FILTERS.map((f) => (
                    <div
                      key={f.id}
                      className={`nm-filter-row${activeFilter === f.id ? ' is-active' : ''}`}
                      onClick={() => setActiveFilter(f.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveFilter(f.id); }}
                    >
                      <span className="nm-filter-row__lbl">{f.label}</span>
                      <span className="nm-filter-row__count">{counts[f.id]}</span>
                    </div>
                  ))}
                </div>

                <div className="nm-panel">
                  <h3 className="nm-panel__head">Sort By</h3>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      border: '1px solid var(--nm-border-soft)',
                      borderRadius: 'var(--nm-radius-sm)',
                      fontFamily: 'var(--nm-font-body)',
                      fontSize: 14,
                      color: 'var(--nm-ink)',
                      background: '#fff',
                      marginTop: 8,
                    }}
                  >
                    <option value="recent">Recently Added</option>
                    <option value="origin">Origin</option>
                    <option value="destination">Destination</option>
                    <option value="flightDate">Flight Date</option>
                  </select>
                </div>

                <div className="nm-banner-side">
                  <Headphones className="h-8 w-8 mb-2" style={{ color: 'var(--nm-green)' }} />
                  <h3>Need help?<br />Call our support.</h3>
                  <p>24/7 Support Center · 1900 - 8888</p>
                  <button
                    type="button"
                    className="nm-btn"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => navigate('/dashboard')}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </aside>

              {/* ── Main column: search + grid ──────────────────────── */}
              <div className="nm-shop-main">
                <div className="nm-shop-head">
                  <div>
                    <h1>Tracked Shipments</h1>
                    <p>We found {filtered.length} of {watchlist.length} AWB(s) for you.</p>
                  </div>
                  <div className="nm-shop-tools">
                    <div className="nm-search" style={{ minWidth: 300 }}>
                      <Search className="h-4 w-4" style={{ color: 'var(--nm-text-faint)' }} />
                      <input
                        type="text"
                        placeholder="Search AWB number..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                </div>

                <ul className="nm-pillrow">
                  {FILTERS.map((f) => (
                    <li
                      key={f.id}
                      className={activeFilter === f.id ? 'is-active' : ''}
                      onClick={() => setActiveFilter(f.id)}
                    >
                      <Filter className="h-3 w-3" />
                      {f.label}
                      <span style={{ opacity: 0.6, fontWeight: 400 }}>({counts[f.id]})</span>
                    </li>
                  ))}
                </ul>

                {filtered.length === 0 ? (
                  <div className="nm-empty">
                    <Search className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--nm-text-faint)' }} />
                    <h3>No matches found</h3>
                    <p>
                      {searchTerm
                        ? `No AWB matches "${searchTerm}".`
                        : 'No AWBs match the current filter. Try a different status.'}
                    </p>
                  </div>
                ) : (
                  <div className="nm-grid">
                    {filtered.map((awb) => {
                      const cargo = cargoMap[awb];
                      const badge = statusBadge(cargo);

                      return (
                        <article key={awb} className="nm-card">
                          {badge && (
                            <span
                              className="nm-card__badge"
                              style={{ background: badge.color }}
                            >
                              {badge.label}
                            </span>
                          )}

                          <div className="nm-card__head" style={{ paddingTop: 36 }}>
                            <span className="nm-card__cat">
                              <Package className="inline h-3 w-3 mr-1" />AWB
                            </span>
                            <h3 className="nm-card__title">
                              <a
                                href={`/dashboard/awb/${awb}`}
                                onClick={(e) => { e.preventDefault(); handleViewDetails(awb); }}
                              >
                                {awb}
                              </a>
                            </h3>
                            {cargo && (
                              <div className="nm-card__route" style={{ marginTop: 8 }}>
                                <span>{cargo.origin.split('(')[0].trim()}</span>
                                <span className="arrow">→</span>
                                <span>{cargo.destination.split('(')[0].trim()}</span>
                              </div>
                            )}
                          </div>

                          {cargo ? (
                            <div className="nm-card__body">
                              <div>
                                <div className="nm-card__field-lbl">
                                  <Plane className="h-3 w-3" />
                                  Flight Date
                                </div>
                                <div className="nm-card__field-val">{cargo.flightDate}</div>
                              </div>
                              <div>
                                <div className="nm-card__field-lbl">
                                  <Calendar className="h-3 w-3" />
                                  Arrival
                                </div>
                                <div className="nm-card__field-val">{cargo.arrivalDate}</div>
                              </div>
                              <div>
                                <div className="nm-card__field-lbl">
                                  <Package className="h-3 w-3" />
                                  Cargo
                                </div>
                                <div className="nm-card__field-val">
                                  {cargo.weight} kg · {cargo.pieces} pcs
                                </div>
                              </div>
                              <div>
                                <div className="nm-card__field-lbl">
                                  <MapPin className="h-3 w-3" />
                                  Consignee
                                </div>
                                <div
                                  className="nm-card__field-val"
                                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                  title={cargo.consignee}
                                >
                                  {cargo.consignee}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="nm-card__body"
                              style={{
                                gridTemplateColumns: '1fr',
                                color: 'var(--nm-text-muted)',
                                fontStyle: 'italic',
                                fontSize: 13,
                              }}
                            >
                              Loading cargo information…
                            </div>
                          )}

                          <div className="nm-card__foot">
                            <button className="nm-card__add" onClick={() => handleViewDetails(awb)}>
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              className="nm-card__remove"
                              onClick={() => handleRemove(awb)}
                              aria-label={`Remove ${awb}`}
                              title="Remove from watchlist"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Newsletter-style strip at bottom */}
                <section className="nm-news">
                  <h2>Stay home &amp; get your daily<br />shipment updates.</h2>
                  <p>
                    Subscribe to alerts for the AWBs in your watchlist — we&apos;ll ping you the moment they&apos;re ready.
                  </p>
                  <form className="nm-news__form" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed to alerts'); }}>
                    <input placeholder="Your email address" type="email" required />
                    <button type="submit">Subscribe</button>
                  </form>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
