const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Category, VerificationCode, Session } = require('../models');
const { sendVerificationCode } = require('../config/mailer');
const generateCode = require('../utils/generateCode');
require('dotenv').config();

//константы для токенов для токенов
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; 

//генерация access токена
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

//генерация refresh токена
const generateRefreshToken = () => {
    return jwt.sign(
        { random: Math.random().toString() },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

//базовые категории
const DEFAULT_CATEGORIES = [
    { name: 'Продукты', type: 'expense', color: '#E74C3C', isDefault: true },
    { name: 'Транспорт', type: 'expense', color: '#F39C12', isDefault: true },
    { name: 'Кафе и рестораны', type: 'expense', color: '#E67E22', isDefault: true },
    { name: 'Коммунальные услуги', type: 'expense', color: '#3498DB', isDefault: true },
    { name: 'Развлечения', type: 'expense', color: '#9B59B6', isDefault: true },
    { name: 'Здоровье', type: 'expense', color: '#1ABC9C', isDefault: true },
    { name: 'Зарплата', type: 'income', color: '#27AE60', isDefault: true },
    { name: 'Фриланс', type: 'income', color: '#1ABC9C', isDefault: true }
];

//регистрация
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
        
        //создание базовых категорий для нового пользователя
        const categories = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            userId: user.id
        }));
        await Category.bulkCreate(categories);
        
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

//подтверждение почты
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

//вход
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
        
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        
        //сохранение сессии
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

//обновление access токена
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token не предоставлен' });
        }
        
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
        
        const newAccessToken = generateAccessToken(session.User);
        
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении токена' });
    }
};

//удаление сессии(выход)
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

//запрос на восстановление пароля
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Введите email' });
        }
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь с таким email не найден' });
        }
        
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

// сброс пароля
exports.resetPassword = async (req, res) => {
    try {
        const { userId, code, newPassword } = req.body;
        
        if (!userId || !code || !newPassword) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
        }
        
        //поиск кода подтверждения
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
        
        if (new Date() > resetCode.expiresAt) {
            return res.status(400).json({ error: 'Код сброса истек. Запросите новый.' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await User.update({ passwordHash: hashedPassword }, { where: { id: userId } });
        await resetCode.update({ isUsed: true });
        
        res.json({ message: 'Пароль успешно изменен. Теперь вы можете войти.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Ошибка сервера при сбросе пароля' });
    }
};

//повторная отправка кода подтверждения
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