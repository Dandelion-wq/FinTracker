const axios = require('axios');
const BASE_CURRENCY = 'BYN';

//кэш курсов валют
let currencyRatesCache = null;
let lastUpdateTime = null;
const CACHE_DURATION = 60 * 60 * 1000;

//API для получения курсов 
const API_URL = 'https://api.exchangerate-api.com/v4/latest/BYN';
//альтернативный API 
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
            return {
                USD: 3.2,
                EUR: 3.5,
                RUB: 0.035,
                BYN: 1
            };
        }
    }
}

//получение курсов валют
async function getCurrencyRates() {
    const now = Date.now();
    
    if (!currencyRatesCache || (now - lastUpdateTime) > CACHE_DURATION) {
        currencyRatesCache = await fetchRates();
        lastUpdateTime = now;
        console.log('Currency rates updated:', currencyRatesCache);
    }
    
    return currencyRatesCache;
}

//конвертация валюты в бел. руб
async function convertToBYN(amount, fromCurrency) {
    if (fromCurrency === BASE_CURRENCY || fromCurrency === 'BYN') {
        return amount;
    }
    
    try {
        const rates = await getCurrencyRates();
        const rate = rates[fromCurrency];
        
        if (!rate) {
            console.warn(`Rate not found for currency: ${fromCurrency}`);
            return amount; 
        }
        
        return amount / rate;
    } catch (error) {
        console.error('Conversion error:', error);
        return amount;
    }
}

//конвертация суммы из бел. руб
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
        
        return amount * rate;
    } catch (error) {
        console.error('Conversion error:', error);
        return amount;
    }
}

//получение текущего куса для отображения
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