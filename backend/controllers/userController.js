const bcrypt = require('bcrypt');
const { User } = require('../models');

// Получение профиля пользователя
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'email', 'lastName', 'firstName', 'patronymic', 'isVerified', 'createdAt']
        });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Смена пароля (когда пользователь авторизован и помнит старый пароль)
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Введите старый и новый пароль' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен содержать не менее 6 символов' });
        }
        
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Проверка старого пароля
        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный старый пароль' });
        }
        
        // Хеширование нового пароля
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ passwordHash: hashedPassword });
        
        res.json({ message: 'Пароль успешно изменен' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Обновление профиля (ФИО)
exports.updateProfile = async (req, res) => {
    try {
        const { lastName, firstName, patronymic } = req.body;
        
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        await user.update({ lastName, firstName, patronymic });
        
        res.json({
            message: 'Профиль обновлен',
            user: {
                id: user.id,
                email: user.email,
                lastName: user.lastName,
                firstName: user.firstName,
                patronymic: user.patronymic
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Удаление аккаунта
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Введите пароль для подтверждения' });
        }
        
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }
        
        await user.destroy();
        
        res.json({ message: 'Аккаунт успешно удален' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};