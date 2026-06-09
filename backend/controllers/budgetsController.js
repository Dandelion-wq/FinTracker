const { Budget, Transaction } = require('../models');
const { Op } = require('sequelize');

// Получить все бюджеты пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;

        const budgets = await Budget.findAll({
            where: { userId },
            order: [['type', 'ASC'], ['startDate', 'DESC']]
        });

        const budgetsWithCurrent = await Promise.all(budgets.map(async (budget) => {
            let currentAmount = 0;

            if (budget.type === 'expense') {
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        type: 'expense',
                        date: {
                            [Op.between]: [budget.startDate, budget.endDate]
                        },
                        budgetId: null  // Только транзакции без привязки к бюджету
                    }
                });
                currentAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            }
            else if (budget.type === 'saving') {
                // Суммируем все транзакции с savingAction = 'deposit' для этого бюджета
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        budgetId: budget.id,
                        savingAction: 'deposit',
                        date: {
                            [Op.between]: [budget.startDate, budget.endDate]
                        }
                    }
                });
                currentAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            } else {
                // Для накопительного бюджета считаем транзакции с savingAction = 'deposit'
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        budgetId: budget.id,
                        savingAction: 'deposit',
                        date: {
                            [Op.between]: [budget.startDate, budget.endDate]
                        }
                    }
                });
                currentAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            }

            return {
                ...budget.toJSON(),
                currentAmount
            };
        }));

        res.json(budgetsWithCurrent);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Ошибка при получении бюджетов' });
    }
};

// Создать новый бюджет
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, type, periodType, startDate, endDate, targetAmount } = req.body;

        if (!name || !periodType || !startDate || !targetAmount) {
            return res.status(400).json({ error: 'Название, тип периода, дата начала и целевая сумма обязательны' });
        }

        if (targetAmount <= 0) {
            return res.status(400).json({ error: 'Целевая сумма должна быть больше 0' });
        }

        let finalEndDate = endDate;
        if (periodType !== 'custom') {
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
            type: type || 'expense',
            periodType,
            startDate,
            endDate: finalEndDate,
            targetAmount,
            currentAmount: 0
        });

        res.status(201).json(budget);
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
        const { name, type, periodType, startDate, endDate, targetAmount, currentAmount } = req.body;

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

        const updateData = {
            name: name || budget.name,
            type: type || budget.type,
            periodType: periodType || budget.periodType,
            startDate: startDate || budget.startDate,
            endDate: finalEndDate || budget.endDate,
            targetAmount: targetAmount || budget.targetAmount
        };

        // Если передано currentAmount, обновляем его
        if (currentAmount !== undefined) {
            updateData.currentAmount = currentAmount;
        }

        await budget.update(updateData);

        res.json(budget);
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

// Получить статистику по бюджетам
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        const budgets = await Budget.findAll({
            where: {
                userId,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });

        const budgetsWithStats = await Promise.all(budgets.map(async (budget) => {
            let currentAmount = 0;
            if (budget.type === 'expense') {
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        type: 'expense',
                        date: { [Op.between]: [budget.startDate, budget.endDate] },
                        budgetId: null
                    }
                });
                currentAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            } else {
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        budgetId: budget.id,
                        savingAction: 'deposit',
                        date: { [Op.between]: [budget.startDate, budget.endDate] }
                    }
                });
                currentAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            }

            const progress = (currentAmount / budget.targetAmount) * 100;
            const remaining = budget.targetAmount - currentAmount;
            const isCompleted = currentAmount >= budget.targetAmount;

            return {
                id: budget.id,
                name: budget.name,
                type: budget.type,
                targetAmount: budget.targetAmount,
                currentAmount,
                progress: Math.min(100, progress),
                remaining,
                isCompleted,
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

// Обновить сумму накоплений (вызывается из транзакций)
exports.updateSavingAmount = async (req, res) => {
    try {
        const { budgetId, amount, action } = req.body;
        const userId = req.user.userId;

        const budget = await Budget.findOne({
            where: { id: budgetId, userId, type: 'saving' }
        });

        if (!budget) {
            return res.status(404).json({ error: 'Накопительный бюджет не найден' });
        }

        let newCurrentAmount = budget.currentAmount;
        if (action === 'deposit') {
            newCurrentAmount = budget.currentAmount + amount;
        } else if (action === 'withdrawal') {
            newCurrentAmount = Math.max(0, budget.currentAmount - amount);
        }

        await budget.update({ currentAmount: newCurrentAmount });

        res.json({ success: true, currentAmount: newCurrentAmount });
    } catch (error) {
        console.error('Update saving amount error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении суммы накоплений' });
    }
};