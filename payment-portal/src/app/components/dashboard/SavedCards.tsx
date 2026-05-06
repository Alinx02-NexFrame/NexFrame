import { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, Star, StarOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { savedCardApi, getCurrentUser, type SavedCard } from '../../services/apiClient';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other'];

export function SavedCards() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.companyRole === 'Admin';

  // Add card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState(String(new Date().getFullYear() + 1));
  const [isDefault, setIsDefault] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await savedCardApi.list();
      setCards(list);
    } catch (err) {
      toast.error('Failed to load saved cards', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!cardNumber || !cardHolderName) {
      toast.error('Please fill in all required fields');
      return;
    }
    const digits = cardNumber.replace(/\s+/g, '');
    if (digits.length < 4) {
      toast.error('Card number must have at least 4 digits');
      return;
    }
    setSubmitting(true);
    try {
      await savedCardApi.add({
        cardNumber: digits,
        cardBrand,
        cardHolderName,
        expiryMonth: parseInt(expiryMonth, 10),
        expiryYear: parseInt(expiryYear, 10),
        isDefault,
      });
      toast.success('Card saved', {
        description: `${cardBrand} ending in ${digits.slice(-4)}`,
      });
      setCardNumber('');
      setCardHolderName('');
      setIsDefault(false);
      setIsAddOpen(false);
      await load();
    } catch (err) {
      toast.error('Failed to save card', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (card: SavedCard) => {
    try {
      await savedCardApi.setDefault(card.id);
      toast.success(`${card.cardBrand} ****${card.cardLast4} is now the default`);
      await load();
    } catch (err) {
      toast.error('Failed to set default', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const handleRemove = async (card: SavedCard) => {
    try {
      await savedCardApi.remove(card.id);
      toast.success('Card removed');
      await load();
    } catch (err) {
      toast.error('Failed to remove card', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const years = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Saved Cards</h3>
            <p className="text-sm text-gray-500 mt-1">
              Cards saved here are shared across all users in your company.
              {!isAdmin && ' Only company admins can add or remove cards.'}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Saved Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="cn">Card Number</Label>
                    <Input
                      id="cn"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only the last 4 digits are stored. Full number is tokenized by the payment gateway.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="chn">Cardholder Name</Label>
                    <Input
                      id="chn"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={cardBrand} onValueChange={setCardBrand}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CARD_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="em">Expiry Month</Label>
                      <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ey">Expiry Year</Label>
                      <Select value={expiryYear} onValueChange={setExpiryYear}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Set as default for this company</span>
                  </label>
                  <Button onClick={handleAdd} className="w-full" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Card'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading && <div className="py-8 text-center text-gray-500">Loading saved cards…</div>}
        {!loading && cards.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No saved cards yet. {isAdmin && 'Click "Add Card" to save your first card.'}
          </div>
        )}

        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-[color:var(--sellas-surface-lilac)] rounded-full p-2">
                  <CreditCard className="h-6 w-6 text-[color:var(--sellas-purple)]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {card.cardBrand} •••• {card.cardLast4}
                    </span>
                    {card.isDefault && (
                      <Badge className="bg-green-100 text-green-800 flex items-center">
                        <Star className="h-3 w-3 mr-1" /> Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {card.cardHolderName} · Exp {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  {!card.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(card)}
                      title="Set as default"
                    >
                      <StarOff className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(card)}
                    title="Remove card"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
