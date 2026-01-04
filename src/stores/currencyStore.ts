import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-EU' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', locale: 'da-DK' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', locale: 'pl-PL' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', locale: 'es-MX' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', locale: 'ko-KR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'en-HK' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', locale: 'en-NZ' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', locale: 'tr-TR' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', locale: 'ar-SA' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', locale: 'ar-EG' },
];

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  initializeCurrency: () => Promise<void>;
}

const CURRENCY_STORAGE_KEY = '@familyhq_currency_preference';

const defaultCurrency: Currency = CURRENCIES[0]; // USD

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: defaultCurrency,

  initializeCurrency: async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency) {
        const parsed = JSON.parse(savedCurrency) as Currency;
        // Validate that the saved currency is still in our list
        const validCurrency = CURRENCIES.find(c => c.code === parsed.code) || defaultCurrency;
        set({ currency: validCurrency });
      }
    } catch (error) {
      console.error('Failed to load currency preference:', error);
    }
  },

  setCurrency: async (currency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
      set({ currency });
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  },
}));

