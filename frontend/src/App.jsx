import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import Accounts from './components/Accounts/Accounts';
import Categories from './components/Categories/Categories';
import Budgets from './components/Budgets/Budgets';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import ForgotPassword from './components/Login/ForgotPassword';
import api, { authAPI } from './services/api';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Проверка сессии при загрузке приложения
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const savedUser = localStorage.getItem('user');
            
            if (!accessToken || !refreshToken) {
                setLoading(false);
                return;
            }
            
            try {
                // Пробуем обновить access токен
                const response = await authAPI.refreshToken(refreshToken);
                if (response.data.accessToken) {
                    localStorage.setItem('accessToken', response.data.accessToken);
                    if (savedUser) {
                        setUser(JSON.parse(savedUser));
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Session check failed:', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    const handleLogin = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = async () => {
        await authAPI.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    if (loading) {
        return <div className="loading-app">Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return (
            <Router>
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        );
    }

    return (
        <Router>
            <div className="app">
                <Sidebar onLogout={handleLogout} user={user} />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;