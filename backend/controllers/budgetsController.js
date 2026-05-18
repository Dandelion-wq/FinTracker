const { Budget, Transaction, Category } = require('../models');
const { Op } = require('sequelize');

// Получить все бюджеты пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        const budgets = await Budget.findAll({
            where: { userId },
            order: [['startDate', 'DESC']]
        });
        
        // Для каждого бюджета рассчитываем текущие расходы
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const currentSpent = await calculateCurrentSpent(userId, budget);
            return {
                ...budget.toJSON(),
                currentSpent
            };
        }));
        
        res.json(budgetsWithSpent);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Ошибка при получении бюджетов' });
    }
};

// Создать новый бюджет
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, periodType, startDate, endDate, totalLimit } = req.body;
        
        if (!name || !periodType || !startDate || !totalLimit) {
            return res.status(400).json({ error: 'Название, тип периода, дата начала и лимит обязательны' });
        }
        
        if (totalLimit <= 0) {
            return res.status(400).json({ error: 'Лимит должен быть больше 0' });
        }
        
        // Для произвольного периода проверяем endDate
        let finalEndDate = endDate;
        if (periodType !== 'custom') {
            // Рассчитываем дату окончания в зависимости от типа периода
            const start = new Date(startDate);
            finalEndDate = new Date(start);
            switch (periodType) {
                case 'week':
                    finalEndDate.setDate(start.getDate() + 7);
                    break;
                case 'month':
                    finalEndDate.setMonth(start.getMonth() + 1);
                    break;
                case 'year':
                    finalEndDate.setFullYear(start.getFullYear() + 1);
                    break;
            }
            finalEndDate = finalEndDate.toISOString().split('T')[0];
        }
        
        if (!finalEndDate) {
            return res.status(400).json({ error: 'Дата окончания обязательна' });
        }
        
        const budget = await Budget.create({
            userId,
            name,
            periodType,
            startDate,
            endDate: finalEndDate,
            totalLimit,
            currentSpent: 0
        });
        
        // Рассчитываем текущие расходы
        const currentSpent = await calculateCurrentSpent(userId, budget);
        
        res.status(201).json({
            ...budget.toJSON(),
            currentSpent
        });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Ошибка при создании бюджета' });
    }
};

// Обновить бюджет
exports.update = async (req, res) => {
    try {
        const userId = req.user.userId;
        const budgetId = req.params.id;
        const { name, periodType, startDate, endDate, totalLimit } = req.body;
        
        const budget = await Budget.findOne({
            where: { id: budgetId, userId }
        });
        
        if (!budget) {
            return res.status(404).json({ error: 'Бюджет не найден' });
        }
        
        let finalEndDate = endDate;
        if (periodType && periodType !== 'custom' && startDate) {
            const start = new Date(startDate);
            finalEndDate = new Date(start);
            switch (periodType) {
                case 'week':
                    finalEndDate.setDate(start.getDate() + 7);
                    break;
                case 'month':
                    finalEndDate.setMonth(start.getMonth() + 1);
                    break;
                case 'year':
                    finalEndDate.setFullYear(start.getFullYear() + 1);
                    break;
            }
            finalEndDate = finalEndDate.toISOString().split('T')[0];
        }
        
        await budget.update({
            name: name || budget.name,
            periodType: periodType || budget.periodType,
            startDate: startDate || budget.startDate,
            endDate: finalEndDate || budget.endDate,
            totalLimit: totalLimit || budget.totalLimit
        });
        
        const currentSpent = await calculateCurrentSpent(userId, budget);
        
        res.json({
            ...budget.toJSON(),
            currentSpent
        });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении бюджета' });
    }
};

// Удалить бюджет
exports.delete = async (req, res) => {
    try {
        const userId = req.user.userId;
        const budgetId = req.params.id;
        
        const budget = await Budget.findOne({
            where: { id: budgetId, userId }
        });
        
        if (!budget) {
            return res.status(404).json({ error: 'Бюджет не найден' });
        }
        
        await budget.destroy();
        res.json({ message: 'Бюджет удален' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Ошибка при удалении бюджета' });
    }
};

// Вспомогательная функция для расчета текущих расходов по бюджету
async function calculateCurrentSpent(userId, budget) {
    const transactions = await Transaction.findAll({
        where: {
            userId,
            type: 'expense',
            date: {
                [Op.between]: [budget.startDate, budget.endDate]
            }
        }
    });
    
    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return total;
}

// Получить статистику по бюджетам
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        
        // Получаем активные бюджеты (текущий месяц)
        const activeBudgets = await Budget.findAll({
            where: {
                userId,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });
        
        const budgetsWithStats = await Promise.all(activeBudgets.map(async (budget) => {
            const currentSpent = await calculateCurrentSpent(userId, budget);
            const progress = (currentSpent / budget.totalLimit) * 100;
            const remaining = budget.totalLimit - currentSpent;
            
            return {
                id: budget.id,
                name: budget.name,
                totalLimit: budget.totalLimit,
                currentSpent,
                progress: Math.min(100, progress),
                remaining,
                isOverBudget: currentSpent > budget.totalLimit,
                periodType: budget.periodType,
                startDate: budget.startDate,
                endDate: budget.endDate
            };
        }));
        
        res.json(budgetsWithStats);
    } catch (error) {
        console.error('Get budget stats error:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики бюджетов' });
    }
};