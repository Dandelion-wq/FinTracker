const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Category, VerificationCode, Session } = require('../models');
const { sendVerificationCode } = require('../config/mailer');
const generateCode = require('../utils/generateCode');
require('dotenv').config();

// Константы для токенов
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 дней в миллисекундах

// Генерация access токена
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

// Генерация refresh токена
const generateRefreshToken = () => {
    return jwt.sign(
        { random: Math.random().toString() },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// Базовые категории для новых пользователей
const DEFAULT_CATEGORIES = [
    { name: 'Продукты', type: 'expense', color: '#E74C3C', icon: '🥑', isDefault: true },
    { name: 'Транспорт', type: 'expense', color: '#F39C12', icon: '🚗', isDefault: true },
    { name: 'Кафе и рестораны', type: 'expense', color: '#E67E22', icon: '☕', isDefault: true },
    { name: 'Коммунальные услуги', type: 'expense', color: '#3498DB', icon: '💡', isDefault: true },
    { name: 'Развлечения', type: 'expense', color: '#9B59B6', icon: '🎬', isDefault: true },
    { name: 'Здоровье', type: 'expense', color: '#1ABC9C', icon: '💊', isDefault: true },
    { name: 'Зарплата', type: 'income', color: '#27AE60', icon: '💰', isDefault: true },
    { name: 'Фриланс', type: 'income', color: '#1ABC9C', icon: '💻', isDefault: true }
];

// Регистрация
exports.register = async (req, res) => {
    try {
        const { email, password, lastName, firstName, patronymic } = req.body;
        
        if (!email || !password || !lastName || !firstName) {
            return res.status(400).json({ error: 'Заполните все обязательные поля' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
        }
        
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            lastName,
            firstName,
            patronymic: patronymic || null,
            isVerified: false
        });
        
        // Создание базовых категорий
        const categories = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            userId: user.id
        }));
        await Category.bulkCreate(categories);
        
        // Генерация кода подтверждения
        const verificationCode = generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        await VerificationCode.create({
            userId: user.id,
            code: verificationCode,
            type: 'email_verification',
            expiresAt,
            isUsed: false
        });
        
        await sendVerificationCode(email, verificationCode, 'email_verification');
        
        res.status(201).json({
            message: 'Регистрация успешна. Код подтверждения отправлен на вашу почту.',
            userId: user.id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
};

// Подтверждение email
exports.verifyEmail = async (req, res) => {
    try {
        const { userId, code } = req.body;
        
        const verificationCode = await VerificationCode.findOne({
            where: { userId, code, type: 'email_verification', isUsed: false }
        });
        
        if (!verificationCode) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }
        
        if (new Date() > verificationCode.expiresAt) {
            return res.status(400).json({ error: 'Код подтверждения истек. Запросите новый.' });
        }
        
        await User.update({ isVerified: true }, { where: { id: userId } });
        await verificationCode.update({ isUsed: true });
        
        res.json({ message: 'Email успешно подтвержден' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Вход с созданием сессии
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ error: 'Подтвердите email перед входом. Проверьте почту.' });
        }
        
        // Генерация токенов
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        
        // Сохранение сессии (только refreshToken, без token)
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY);
        await Session.create({
            userId: user.id,
            refreshToken,         
            expiresAt,
            userAgent,
            ipAddress,
            isRevoked: false
        });
        
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                lastName: user.lastName,
                firstName: user.firstName,
                patronymic: user.patronymic
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
};

// Обновление access токена
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token не предоставлен' });
        }
        
        // Поиск сессии по refreshToken
        const session = await Session.findOne({
            where: { refreshToken, isRevoked: false },
            include: [{ model: User, attributes: ['id', 'email'] }]
        });
        
        if (!session) {
            return res.status(401).json({ error: 'Недействительный refresh token' });
        }
        
        if (new Date() > session.expiresAt) {
            await session.update({ isRevoked: true });
            return res.status(401).json({ error: 'Refresh token истек. Выполните вход заново.' });
        }
        
        // Генерация нового access токена
        const newAccessToken = generateAccessToken(session.User);
        
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении токена' });
    }
};

// Выход (удаление сессии)
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await Session.update({ isRevoked: true }, { where: { refreshToken } });
        }
        
        res.json({ message: 'Выход выполнен успешно' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Ошибка при выходе' });
    }
};

// Запрос на восстановление пароля
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Введите email' });
        }
        
        // Поиск пользователя
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь с таким email не найден' });
        }
        
        // Генерация кода сброса
        const resetCode = generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        await VerificationCode.create({
            userId: user.id,
            code: resetCode,
            type: 'password_reset',
            expiresAt,
            isUsed: false
        });
        
        // Отправка кода на email
        await sendVerificationCode(email, resetCode, 'password_reset');
        
        res.json({
            message: 'Код для сброса пароля отправлен на вашу почту',
            userId: user.id
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Ошибка сервера при запросе сброса пароля' });
    }
};

// Сброс пароля (после подтверждения кода)
exports.resetPassword = async (req, res) => {
    try {
        const { userId, code, newPassword } = req.body;
        
        if (!userId || !code || !newPassword) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
        }
        
        // Поиск кода
        const resetCode = await VerificationCode.findOne({
            where: {
                userId,
                code,
                type: 'password_reset',
                isUsed: false
            }
        });
        
        if (!resetCode) {
            return res.status(400).json({ error: 'Неверный код сброса' });
        }
        
        // Проверка срока действия
        if (new Date() > resetCode.expiresAt) {
            return res.status(400).json({ error: 'Код сброса истек. Запросите новый.' });
        }
        
        // Хеширование нового пароля
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Обновление пароля
        await User.update({ passwordHash: hashedPassword }, { where: { id: userId } });
        await resetCode.update({ isUsed: true });
        
        res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Ошибка сервера при сбросе пароля' });
    }
};

// Повторная отправка кода подтверждения
exports.resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Введите email' });
        }
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ error: 'Email уже подтвержден' });
        }
        
        // Генерация нового кода
        const verificationCode = generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        await VerificationCode.create({
            userId: user.id,
            code: verificationCode,
            type: 'email_verification',
            expiresAt,
            isUsed: false
        });
        
        await sendVerificationCode(email, verificationCode, 'email_verification');
        
        res.json({ message: 'Новый код подтверждения отправлен на вашу почту', userId: user.id });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};