import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        patronymic: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [userId, setUserId] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 6) {
            setError('Пароль должен содержать не менее 6 символов');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({
                email: formData.email,
                password: formData.password,
                lastName: formData.lastName,
                firstName: formData.firstName,
                patronymic: formData.patronymic || undefined
            });

            setUserId(response.data.userId);
            setSuccess('Регистрация успешна! Код подтверждения отправлен на вашу почту.');
            setShowVerification(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.verifyEmail({ userId, code: verificationCode });
            setSuccess('Email подтвержден! Теперь вы можете войти.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка подтверждения email');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setLoading(true);

        try {
            await authAPI.resendVerification({ email: formData.email });
            setSuccess('Новый код подтверждения отправлен на вашу почту');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при отправке кода');
        } finally {
            setLoading(false);
        }
    };

    if (showVerification) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">FinTracker</div>
                    <h2>Подтверждение email</h2>
                    {success && <div className="auth-success">{success}</div>}
                    {error && <div className="auth-error">{error}</div>}
                    <form onSubmit={handleVerifyEmail}>
                        <div className="form-group">
                            <label>Код подтверждения</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Введите 6-значный код"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Проверка...' : 'Подтвердить email'}
                        </button>
                    </form>
                    <p className="auth-link">
                        Не пришел код?{' '}
                        <button onClick={handleResendCode} className="link-button" disabled={loading}>
                            Отправить снова
                        </button>
                    </p>
                    <p className="auth-link">
                        <Link to="/login">Вернуться ко входу</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">FinTracker</div>
                <h2>Регистрация</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    {success && <div className="auth-success">{success}</div>}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Фамилия</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Иванов"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Имя</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Иван"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Отчество (необязательно)</label>
                        <input
                            type="text"
                            name="patronymic"
                            value={formData.patronymic}
                            onChange={handleChange}
                            placeholder="Иванович"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Электронная почта</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ivan@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group password-group">
                            <label>Пароль</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
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
                        <div className="form-group password-group">
                            <label>Подтверждение пароля</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                <p className="auth-link">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;