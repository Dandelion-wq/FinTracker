import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await authAPI.login({ email, password });
            const { user } = response.data;
            onLogin(user);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Ошибка при входе в систему';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">FinTracker</div>
                <h2>Вход в аккаунт</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="form-group">
                        <label>Электронная почта</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ivan@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group password-group">
                        <label>Пароль</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <div className="auth-links">
                        <Link to="/forgot-password" className="forgot-link">Забыли пароль?</Link>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                <p className="auth-link">
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;