import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Package, ArrowLeft, CheckCircle, Check, ChevronsUpDown, User, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BillingInfo, PaymentInfo } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from './ui/utils';

interface CheckoutScreenProps {
  billing: BillingInfo;
  onConfirmPayment: (paymentInfo: PaymentInfo) => void;
  onBack: () => void;
}

// Country and State/Province data
const countries = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'au', label: 'Australia' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'in', label: 'India' },
];

const statesByCountry: Record<string, { value: string; label: string }[]> = {
  us: [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ],
  ca: [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'YT', label: 'Yukon' },
  ],
  mx: [
    { value: 'AG', label: 'Aguascalientes' },
    { value: 'BC', label: 'Baja California' },
    { value: 'BS', label: 'Baja California Sur' },
    { value: 'CM', label: 'Campeche' },
    { value: 'CS', label: 'Chiapas' },
    { value: 'CH', label: 'Chihuahua' },
    { value: 'CO', label: 'Coahuila' },
    { value: 'CL', label: 'Colima' },
    { value: 'DF', label: 'Mexico City' },
    { value: 'DG', label: 'Durango' },
    { value: 'GT', label: 'Guanajuato' },
    { value: 'GR', label: 'Guerrero' },
    { value: 'HG', label: 'Hidalgo' },
    { value: 'JA', label: 'Jalisco' },
    { value: 'ME', label: 'Mexico State' },
    { value: 'MI', label: 'Michoacán' },
    { value: 'MO', label: 'Morelos' },
    { value: 'NA', label: 'Nayarit' },
    { value: 'NL', label: 'Nuevo León' },
    { value: 'OA', label: 'Oaxaca' },
    { value: 'PU', label: 'Puebla' },
    { value: 'QE', label: 'Querétaro' },
    { value: 'QR', label: 'Quintana Roo' },
    { value: 'SL', label: 'San Luis Potosí' },
    { value: 'SI', label: 'Sinaloa' },
    { value: 'SO', label: 'Sonora' },
    { value: 'TB', label: 'Tabasco' },
    { value: 'TM', label: 'Tamaulipas' },
    { value: 'TL', label: 'Tlaxcala' },
    { value: 'VE', label: 'Veracruz' },
    { value: 'YU', label: 'Yucatán' },
    { value: 'ZA', label: 'Zacatecas' },
  ],
  uk: [
    { value: 'ENG', label: 'England' },
    { value: 'SCT', label: 'Scotland' },
    { value: 'WLS', label: 'Wales' },
    { value: 'NIR', label: 'Northern Ireland' },
  ],
  de: [
    { value: 'BW', label: 'Baden-Württemberg' },
    { value: 'BY', label: 'Bavaria' },
    { value: 'BE', label: 'Berlin' },
    { value: 'BB', label: 'Brandenburg' },
    { value: 'HB', label: 'Bremen' },
    { value: 'HH', label: 'Hamburg' },
    { value: 'HE', label: 'Hesse' },
    { value: 'MV', label: 'Mecklenburg-Vorpommern' },
    { value: 'NI', label: 'Lower Saxony' },
    { value: 'NW', label: 'North Rhine-Westphalia' },
    { value: 'RP', label: 'Rhineland-Palatinate' },
    { value: 'SL', label: 'Saarland' },
    { value: 'SN', label: 'Saxony' },
    { value: 'ST', label: 'Saxony-Anhalt' },
    { value: 'SH', label: 'Schleswig-Holstein' },
    { value: 'TH', label: 'Thuringia' },
  ],
  fr: [
    { value: 'ARA', label: 'Auvergne-Rhône-Alpes' },
    { value: 'BFC', label: 'Bourgogne-Franche-Comté' },
    { value: 'BRE', label: 'Brittany' },
    { value: 'CVL', label: 'Centre-Val de Loire' },
    { value: 'COR', label: 'Corsica' },
    { value: 'GES', label: 'Grand Est' },
    { value: 'HDF', label: 'Hauts-de-France' },
    { value: 'IDF', label: 'Île-de-France' },
    { value: 'NOR', label: 'Normandy' },
    { value: 'NAQ', label: 'Nouvelle-Aquitaine' },
    { value: 'OCC', label: 'Occitanie' },
    { value: 'PDL', label: 'Pays de la Loire' },
    { value: 'PAC', label: "Provence-Alpes-Côte d'Azur" },
  ],
  au: [
    { value: 'NSW', label: 'New South Wales' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'SA', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'ACT', label: 'Australian Capital Territory' },
    { value: 'NT', label: 'Northern Territory' },
  ],
  jp: [
    { value: 'HKD', label: 'Hokkaido' },
    { value: 'AOM', label: 'Aomori' },
    { value: 'IWT', label: 'Iwate' },
    { value: 'MYG', label: 'Miyagi' },
    { value: 'AKT', label: 'Akita' },
    { value: 'YGT', label: 'Yamagata' },
    { value: 'FKS', label: 'Fukushima' },
    { value: 'IBR', label: 'Ibaraki' },
    { value: 'TCG', label: 'Tochigi' },
    { value: 'GNM', label: 'Gunma' },
    { value: 'STM', label: 'Saitama' },
    { value: 'CHB', label: 'Chiba' },
    { value: 'TKY', label: 'Tokyo' },
    { value: 'KNG', label: 'Kanagawa' },
    { value: 'OSK', label: 'Osaka' },
  ],
  cn: [
    { value: 'BJ', label: 'Beijing' },
    { value: 'SH', label: 'Shanghai' },
    { value: 'GD', label: 'Guangdong' },
    { value: 'JS', label: 'Jiangsu' },
    { value: 'ZJ', label: 'Zhejiang' },
    { value: 'SD', label: 'Shandong' },
    { value: 'HN', label: 'Henan' },
    { value: 'SC', label: 'Sichuan' },
  ],
  in: [
    { value: 'AP', label: 'Andhra Pradesh' },
    { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' },
    { value: 'BR', label: 'Bihar' },
    { value: 'CT', label: 'Chhattisgarh' },
    { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JH', label: 'Jharkhand' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'DL', label: 'Delhi' },
  ],
};

export function CheckoutScreen({ billing, onConfirmPayment, onBack }: CheckoutScreenProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardCVVError, setCardCVVError] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNameError, setCardNameError] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [openCountry, setOpenCountry] = useState(false);
  const [openState, setOpenState] = useState(false);

  // Reset state when country changes
  const handleCountryChange = (value: string) => {
    setCountry(value);
    setState(''); // Reset state selection when country changes
    setOpenCountry(false);
  };

  // Get available states for selected country
  const availableStates = country ? statesByCountry[country] || [] : [];

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');

    // Limit to 10 digits
    const limitedNumber = phoneNumber.slice(0, 10);

    // Format as (XXX) XXX-XXXX
    if (limitedNumber.length <= 3) {
      return limitedNumber;
    } else if (limitedNumber.length <= 6) {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`;
    } else {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  // Card Number formatting and validation
  const formatCardNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = numbers.slice(0, 16);
    // Add space every 4 digits
    return limited.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (cardNumberError) {
      setCardNumberError('');
    }
  };

  const validateCardNumber = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (!digits) {
      setCardNumberError('Card number is required');
      return false;
    } else if (digits.length < 13 || digits.length > 16) {
      setCardNumberError('Please enter a valid card number');
      return false;
    } else {
      setCardNumberError('');
      return true;
    }
  };

  // Card Expiry formatting and validation
  const formatCardExpiry = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    // Limit to 4 digits (MMYY)
    const limited = numbers.slice(0, 4);

    // Add slash after MM
    if (limited.length >= 2) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    return limited;
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardExpiry(e.target.value);
    setCardExpiry(formatted);
    if (cardExpiryError) {
      setCardExpiryError('');
    }
  };

  const validateCardExpiry = () => {
    const digits = cardExpiry.replace(/\D/g, '');
    if (!digits) {
      setCardExpiryError('Expiry date is required');
      return false;
    } else if (digits.length !== 4) {
      setCardExpiryError('Please enter a valid expiry date (MM/YY)');
      return false;
    }

    const month = parseInt(digits.slice(0, 2));
    const year = parseInt(digits.slice(2, 4));
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      setCardExpiryError('Invalid month (01-12)');
      return false;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setCardExpiryError('Card has expired');
      return false;
    }

    setCardExpiryError('');
    return true;
  };

  // CVV validation
  const handleCardCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters and limit to 4 digits
    const numbers = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCVV(numbers);
    if (cardCVVError) {
      setCardCVVError('');
    }
  };

  const validateCardCVV = () => {
    if (!cardCVV) {
      setCardCVVError('CVV is required');
      return false;
    } else if (cardCVV.length < 3 || cardCVV.length > 4) {
      setCardCVVError('Please enter a valid CVV (3-4 digits)');
      return false;
    } else {
      setCardCVVError('');
      return true;
    }
  };

  // Cardholder Name validation
  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphabetical characters and spaces
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setCardName(value);
    if (cardNameError) {
      setCardNameError('');
    }
  };

  const validateCardName = () => {
    if (!cardName.trim()) {
      setCardNameError('Cardholder name is required');
      return false;
    } else if (cardName.trim().length < 3) {
      setCardNameError('Please enter a valid name');
      return false;
    } else {
      setCardNameError('');
      return true;
    }
  };

  // Credit Card Fee - always 2.9% for Quick Pay
  const creditCardFee = billing.subtotal * 0.029;
  const finalTotal = billing.subtotal + creditCardFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isCardNumberValid = validateCardNumber();
    const isCardExpiryValid = validateCardExpiry();
    const isCardCVVValid = validateCardCVV();
    const isCardNameValid = validateCardName();

    // If any validation fails, prevent submission
    if (!isEmailValid || !isCardNumberValid || !isCardExpiryValid || !isCardCVVValid || !isCardNameValid) {
      return;
    }

    setIsProcessing(true);

    const paymentInfo: PaymentInfo = {
      paymentMethod: 'Credit Card',
      email,
      phone,
      cardNumber,
      cardExpiry,
      cardCVV
    };

    setTimeout(() => {
      onConfirmPayment(paymentInfo);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Swissport</span>
            <span className="text-sm text-gray-500">Payment Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay</h1>
          <p className="text-lg text-gray-600">AWB: {billing.awbNumber}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Payment Form */}
            <div className="space-y-6">
              {/* Email */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      required
                      className={emailError ? 'border-red-500' : ''}
                    />
                    {emailError && (
                      <p className="text-sm text-red-500 mt-1">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Credit Card Details */}
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Credit Card Details</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      className={cardNumberError ? 'border-red-500' : ''}
                    />
                    {cardNumberError && (
                      <p className="text-sm text-red-500 mt-1">{cardNumberError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        required
                        className={cardExpiryError ? 'border-red-500' : ''}
                      />
                      {cardExpiryError && (
                        <p className="text-sm text-red-500 mt-1">{cardExpiryError}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={cardCVV}
                        onChange={handleCardCVVChange}
                        required
                        className={cardCVVError ? 'border-red-500' : ''}
                      />
                      {cardCVVError && (
                        <p className="text-sm text-red-500 mt-1">{cardCVVError}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={handleCardNameChange}
                      required
                      className={cardNameError ? 'border-red-500' : ''}
                    />
                    {cardNameError && (
                      <p className="text-sm text-red-500 mt-1">{cardNameError}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Billing Address */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Main Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Popover open={openCountry} onOpenChange={setOpenCountry}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCountry}
                            className="w-full justify-between text-left font-normal"
                          >
                            {country
                              ? countries.find((c) => c.value === country)?.label
                              : 'Select country...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries.map((c) => (
                                  <CommandItem
                                    key={c.value}
                                    value={c.value}
                                    onSelect={handleCountryChange}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        country === c.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {c.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Popover open={openState} onOpenChange={setOpenState}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openState}
                            className="w-full justify-between text-left font-normal"
                            disabled={!country || availableStates.length === 0}
                          >
                            {state
                              ? availableStates.find((s) => s.value === state)?.label
                              : 'Select state...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state/province found.</CommandEmpty>
                              <CommandGroup>
                                {availableStates.map((s) => (
                                  <CommandItem
                                    key={s.value}
                                    value={s.value}
                                    onSelect={(value) => {
                                      setState(value);
                                      setOpenState(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        state === s.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {s.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numeric input
                        if (value === '' || /^\d+$/.test(value)) {
                          setZipCode(value);
                        }
                      }}
                      required
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div>
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>AWB Number</span>
                    <span className="font-semibold text-gray-900">{billing.awbNumber}</span>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fee</span>
                      <span className="font-medium">${billing.serviceFee.toFixed(2)}</span>
                    </div>

                    {billing.storageFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Storage Fee</span>
                        <span className="font-medium">${billing.storageFee.toFixed(2)}</span>
                      </div>
                    )}

                    {billing.otherCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Other Charges</span>
                        <span className="font-medium">${billing.otherCharge.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Processing Fee (2.5%)</span>
                      <span className="font-medium">${billing.processingFee.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-semibold text-gray-900">Subtotal</span>
                      <span className="font-semibold">${billing.subtotal.toFixed(2)}</span>
                    </div>

                    {/* Credit Card Fee - Always shown for Quick Pay */}
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Credit Card Fee (2.9%)</span>
                      <span className="font-medium">${creditCardFee.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Not Signed In Notice */}
                <div className="mb-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-2">
                    <User className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-green-800 font-medium mb-1">
                        You are not signed in
                      </p>
                      <p className="text-xs text-green-700">
                        Sign in for faster payments, bulk processing, and comprehensive reporting
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base mb-2"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>

                {/* Sign in & Pay Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={isProcessing}
                  className="w-full h-10 text-sm mb-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in & Pay
                </Button>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-700 text-center">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </form>

        {/* Frequent Customer Banner */}
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
    </div>
  );
}
