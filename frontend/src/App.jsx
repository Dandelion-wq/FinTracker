import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import Accounts from './components/Accounts/Accounts';
import Categories from './components/Categories/Categories';
import Budgets from './components/Budgets/Budgets';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import ForgotPassword from './components/Login/ForgotPassword';
import { authAPI } from './services/api';
import './App.css';

function RouteChangeHandler({ children }) {
    const location = useLocation();
    
    useEffect(() => {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }, [location]);
    
    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    //проверка сессии при загрузке
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

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            
            if (!newIsMobile && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
            
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobileMenuOpen]);

    const handleLogin = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = async () => {
        await authAPI.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
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
            <RouteChangeHandler>
                <div className="app">
                    <button className="menu-toggle" onClick={toggleMobileMenu}>
                        ☰
                    </button>
                    
                    <div 
                        className={`menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
                        onClick={closeMobileMenu}
                    ></div>
                    
                    <Sidebar 
                        onLogout={handleLogout} 
                        user={user} 
                        isOpen={isMobileMenuOpen} 
                        onClose={closeMobileMenu} 
                    />
                    
                    <div className={`main-content ${isMobile ? 'mobile-view' : 'desktop-view'}`}>
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
            </RouteChangeHandler>
        </Router>
    );
}

export default App;