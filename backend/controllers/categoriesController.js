const { Category } = require('../models');

// Получить все категории пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        const categories = await Category.findAll({
            where: { userId },
            order: [['type', 'ASC'], ['name', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Ошибка при получении категорий' });
    }
};

// Создать новую категорию
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, type, color, icon, monthlyLimit } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ error: 'Название и тип категории обязательны' });
        }
        
        const category = await Category.create({
            userId,
            name,
            type,
            color: color || (type === 'expense' ? '#E74C3C' : '#27AE60'),
            icon: icon || null,
            monthlyLimit: type === 'expense' ? monthlyLimit : null,
            isDefault: false
        });
        
        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Ошибка при создании категории' });
    }
};

// Обновить категорию
exports.update = async (req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = req.params.id;
        const { name, color, icon, monthlyLimit } = req.body;
        
        const category = await Category.findOne({
            where: { id: categoryId, userId }
        });
        
        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        await category.update({
            name: name || category.name,
            color: color || category.color,
            icon: icon !== undefined ? icon : category.icon,
            monthlyLimit: category.type === 'expense' ? monthlyLimit : null
        });
        
        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении категории' });
    }
};

// Удалить категорию
exports.delete = async (req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = req.params.id;
        
        const category = await Category.findOne({
            where: { id: categoryId, userId }
        });
        
        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        await category.destroy();
        res.json({ message: 'Категория удалена' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Ошибка при удалении категории' });
    }
};