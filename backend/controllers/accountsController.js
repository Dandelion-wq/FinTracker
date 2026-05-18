const { Account } = require('../models');

// Получить все счета пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accounts = await Account.findAll({
            where: { userId, isActive: true },
            order: [['type', 'ASC'], ['name', 'ASC']]
        });
        res.json(accounts);
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Ошибка при получении счетов' });
    }
};

// Создать новый счет
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, type, currency, balance, icon } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ error: 'Название и тип счета обязательны' });
        }
        
        const account = await Account.create({
            userId,
            name,
            type,
            currency: currency || 'BYN',
            balance: balance || 0,
            icon: icon || getIconByType(type),
            isActive: true
        });
        
        res.status(201).json(account);
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Ошибка при создании счета' });
    }
};

// Обновить счет
exports.update = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accountId = req.params.id;
        const { name, type, currency, icon, isActive } = req.body;
        
        const account = await Account.findOne({
            where: { id: accountId, userId }
        });
        
        if (!account) {
            return res.status(404).json({ error: 'Счет не найден' });
        }
        
        await account.update({
            name: name || account.name,
            type: type || account.type,
            currency: currency || account.currency,
            icon: icon !== undefined ? icon : account.icon,
            isActive: isActive !== undefined ? isActive : account.isActive
        });
        
        res.json(account);
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении счета' });
    }
};

// Удалить счет (мягкое удаление - просто деактивируем)
exports.delete = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accountId = req.params.id;
        
        const account = await Account.findOne({
            where: { id: accountId, userId }
        });
        
        if (!account) {
            return res.status(404).json({ error: 'Счет не найден' });
        }
        
        // Мягкое удаление - просто деактивируем
        await account.update({ isActive: false });
        res.json({ message: 'Счет удален' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Ошибка при удалении счета' });
    }
};

// Вспомогательная функция для иконки по умолчанию
function getIconByType(type) {
    const icons = {
        cash: '💵',
        card: '💳',
        ewallet: '📱',
        deposit: '🏦'
    };
    return icons[type] || '💰';
}