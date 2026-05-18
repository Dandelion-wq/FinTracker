import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('request');
    const [userId, setUserId] = useState(null);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await authAPI.forgotPassword({ email });
            setUserId(response.data.userId);
            setSuccess('Код для сброса пароля отправлен на вашу почту');
            setStep('reset');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при отправке кода');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        if (newPassword.length < 6) {
            setError('Пароль должен содержать не менее 6 символов');
            return;
        }
        
        setLoading(true);
        
        try {
            await authAPI.resetPassword({ userId, code, newPassword });
            setSuccess('Пароль успешно изменен! Сейчас вы будете перенаправлены на страницу входа.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при сбросе пароля');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'reset') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">FinTracker</div>
                    <h2>Восстановление пароля</h2>
                    {success && <div className="auth-success">{success}</div>}
                    {error && <div className="auth-error">{error}</div>}
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label>Код из письма</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Введите 6-значный код"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Новый пароль</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Подтверждение пароля</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сменить пароль'}
                        </button>
                    </form>
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
                <h2>Забыли пароль?</h2>
                {success && <div className="auth-success">{success}</div>}
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleRequestCode}>
                    <div className="form-group">
                        <label>Электронная почта</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ivan@example.com"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Отправка...' : 'Отправить код'}
                    </button>
                </form>
                <p className="auth-link">
                    <Link to="/login">Вернуться ко входу</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;