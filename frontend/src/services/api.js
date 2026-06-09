import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

//перехватчик для добавления access токена
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

//перехватчик для обработки ошибок и обновления токенов
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                              originalRequest?.url?.includes('/auth/register') ||
                              originalRequest?.url?.includes('/auth/refresh-token') ||
                              originalRequest?.url?.includes('/auth/forgot-password') ||
                              originalRequest?.url?.includes('/auth/reset-password');
        if (isAuthEndpoint || error.response?.status !== 401) {
            return Promise.reject(error);
        }
    
        if (!originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            try {
                const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
                const { accessToken } = response.data;
                
                localStorage.setItem('accessToken', accessToken);
                processQueue(null, accessToken);
                
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    },
    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    resendVerification: (data) => api.post('/auth/resend-verification', data)
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    changePassword: (data) => api.post('/users/change-password', data),
    deleteAccount: (data) => api.delete('/users/account', { data })
};

export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`)
};

export const accountsAPI = {
    getAll: () => api.get('/accounts'),
    create: (data) => api.post('/accounts', data),
    update: (id, data) => api.put(`/accounts/${id}`, data),
    delete: (id) => api.delete(`/accounts/${id}`)
};

export const transactionsAPI = {
    getAll: (params) => api.get('/transactions', { params }),
    create: (data) => api.post('/transactions', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
    getStats: (period) => api.get('/transactions/stats', { params: { period } })
};

export const budgetsAPI = {
    getAll: () => api.get('/budgets'),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`)
};

export default api;