const axios = require('axios');

// Базовая валюта для отображения
const BASE_CURRENCY = 'BYN';

// Кэш курсов валют (обновляется раз в час)
let currencyRatesCache = null;
let lastUpdateTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 час

// API для получения курсов (бесплатный)
const API_URL = 'https://api.exchangerate-api.com/v4/latest/BYN';

// Альтернативный API (если первый не работает)
const API_URL_ALT = 'https://api.exchangerate.host/latest?base=BYN';

async function fetchRates() {
    try {
        const response = await axios.get(API_URL);
        return response.data.rates;
    } catch (error) {
        console.error('Error fetching rates from primary API:', error.message);
        try {
            const response = await axios.get(API_URL_ALT);
            return response.data.rates;
        } catch (altError) {
            console.error('Error fetching rates from alt API:', altError.message);
            // Возвращаем заглушку, если API недоступен
            return {
                USD: 3.2,
                EUR: 3.5,
                RUB: 0.035,
                BYN: 1
            };
        }
    }
}

// Получение актуальных курсов валют
async function getCurrencyRates() {
    const now = Date.now();
    
    if (!currencyRatesCache || (now - lastUpdateTime) > CACHE_DURATION) {
        currencyRatesCache = await fetchRates();
        lastUpdateTime = now;
        console.log('Currency rates updated:', currencyRatesCache);
    }
    
    return currencyRatesCache;
}

// Конвертация суммы из одной валюты в BYN
async function convertToBYN(amount, fromCurrency) {
    if (fromCurrency === BASE_CURRENCY || fromCurrency === 'BYN') {
        return amount;
    }
    
    try {
        const rates = await getCurrencyRates();
        const rate = rates[fromCurrency];
        
        if (!rate) {
            console.warn(`Rate not found for currency: ${fromCurrency}`);
            return amount; // Возвращаем исходную сумму, если курс не найден
        }
        
        // amount в fromCurrency → BYN
        return amount / rate;
    } catch (error) {
        console.error('Conversion error:', error);
        return amount;
    }
}

// Конвертация суммы из BYN в указанную валюту
async function convertFromBYN(amount, toCurrency) {
    if (toCurrency === BASE_CURRENCY || toCurrency === 'BYN') {
        return amount;
    }
    
    try {
        const rates = await getCurrencyRates();
        const rate = rates[toCurrency];
        
        if (!rate) {
            console.warn(`Rate not found for currency: ${toCurrency}`);
            return amount;
        }
        
        // amount в BYN → toCurrency
        return amount * rate;
    } catch (error) {
        console.error('Conversion error:', error);
        return amount;
    }
}

// Получить текущий курс для отображения
async function getExchangeRate(fromCurrency, toCurrency = BASE_CURRENCY) {
    if (fromCurrency === toCurrency) {
        return 1;
    }
    
    try {
        const rates = await getCurrencyRates();
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        
        if (!fromRate || !toRate) {
            return null;
        }
        
        // Курс fromCurrency → toCurrency
        return toRate / fromRate;
    } catch (error) {
        console.error('Get exchange rate error:', error);
        return null;
    }
}

module.exports = {
    BASE_CURRENCY,
    convertToBYN,
    convertFromBYN,
    getExchangeRate,
    getCurrencyRates
};