const { Budget, Transaction } = require('../models');
const { Op } = require('sequelize');
const { convertToBYN } = require('../services/currencyService');

// Получить все бюджеты пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const budgets = await Budget.findAll({
            where: { userId },
            order: [['type', 'ASC'], ['startDate', 'DESC']]
        });
        
        console.log(`\n📊 Загрузка бюджетов для пользователя ${userId}`);
        
        const budgetsWithCurrent = await Promise.all(budgets.map(async (budget) => {
            let currentAmount = 0;
            
            console.log(`\n🔍 Обработка бюджета ${budget.id} (${budget.name}), тип: ${budget.type}`);
            console.log(`   Период: ${budget.startDate} - ${budget.endDate}`);
            
            if (budget.type === 'expense') {
                // Для расходного бюджета считаем все расходы за период
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        type: 'expense',
                        date: {
                            [Op.between]: [budget.startDate, budget.endDate]
                        },
                        budgetId: null // Не учитываем накопительные транзакции
                    }
                });
                
                console.log(`   Найдено расходных транзакций: ${transactions.length}`);
                
                currentAmount = transactions.reduce((sum, t) => {
                    const amountInBYN = parseFloat(t.amountInBYN || t.amount);
                    console.log(`      - Транзакция ${t.id}: ${t.amount} ${t.currency} = ${amountInBYN} BYN, дата: ${t.date}`);
                    return sum + amountInBYN;
                }, 0);
                
                console.log(`   Итого расходов: ${currentAmount} BYN`);
            } else {
                // Для накопительного бюджета считаем только пополнения (deposit)
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
                
                console.log(`   Найдено пополнений: ${transactions.length}`);
                
                currentAmount = transactions.reduce((sum, t) => {
                    const amountInBYN = parseFloat(t.amountInBYN || t.amount);
                    console.log(`      - Транзакция ${t.id}: amount=${t.amount}, amountInBYN=${t.amountInBYN}, currency=${t.currency}, savingAction=${t.savingAction}, date=${t.date}`);
                    return sum + amountInBYN;
                }, 0);
                
                console.log(`   Итого накоплено: ${currentAmount} BYN`);
            }
            
            return {
                ...budget.toJSON(),
                currentAmount
            };
        }));
        
        console.log(`\n✅ Загрузка бюджетов завершена\n`);
        res.json(budgetsWithCurrent);
    } catch (error) {
        console.error('❌ Get budgets error:', error);
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
        
        console.log(`✅ Создан бюджет: ${budget.id} (${budget.name})`);
        
        res.status(201).json(budget);
    } catch (error) {
        console.error('❌ Create budget error:', error);
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
        
        if (currentAmount !== undefined) {
            updateData.currentAmount = currentAmount;
        }
        
        await budget.update(updateData);
        
        console.log(`✅ Обновлен бюджет: ${budgetId} (${updateData.name})`);
        
        res.json(budget);
    } catch (error) {
        console.error('❌ Update budget error:', error);
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
        
        console.log(`✅ Удален бюджет: ${budgetId} (${budget.name})`);
        
        res.json({ message: 'Бюджет удален' });
    } catch (error) {
        console.error('❌ Delete budget error:', error);
        res.status(500).json({ error: 'Ошибка при удалении бюджета' });
    }
};

// Получить статистику по бюджетам
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        
        console.log(`\n📊 Получение статистики бюджетов для пользователя ${userId}`);
        console.log(`   Текущая дата: ${currentDate}`);
        
        const budgets = await Budget.findAll({
            where: {
                userId,
                startDate: { [Op.lte]: currentDate },
                endDate: { [Op.gte]: currentDate }
            }
        });
        
        console.log(`   Найдено активных бюджетов: ${budgets.length}`);
        
        const budgetsWithStats = await Promise.all(budgets.map(async (budget) => {
            let currentAmount = 0;
            
            console.log(`\n🔍 Бюджет ${budget.id} (${budget.name}), тип: ${budget.type}`);
            console.log(`   Период: ${budget.startDate} - ${budget.endDate}`);
            
            if (budget.type === 'expense') {
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        type: 'expense',
                        date: { [Op.between]: [budget.startDate, budget.endDate] },
                        budgetId: null
                    }
                });
                
                console.log(`   Найдено расходных транзакций: ${transactions.length}`);
                
                currentAmount = transactions.reduce((sum, t) => {
                    const amountInBYN = parseFloat(t.amountInBYN || t.amount);
                    console.log(`      - Транзакция ${t.id}: ${amountInBYN} BYN`);
                    return sum + amountInBYN;
                }, 0);
            } else {
                const transactions = await Transaction.findAll({
                    where: {
                        userId,
                        budgetId: budget.id,
                        savingAction: 'deposit',
                        date: { [Op.between]: [budget.startDate, budget.endDate] }
                    }
                });
                
                console.log(`   Найдено пополнений: ${transactions.length}`);
                
                currentAmount = transactions.reduce((sum, t) => {
                    const amountInBYN = parseFloat(t.amountInBYN || t.amount);
                    console.log(`      - Транзакция ${t.id}: amount=${t.amount}, amountInBYN=${amountInBYN}, currency=${t.currency}`);
                    return sum + amountInBYN;
                }, 0);
            }
            
            const progress = (currentAmount / budget.targetAmount) * 100;
            const remaining = budget.targetAmount - currentAmount;
            const isCompleted = currentAmount >= budget.targetAmount;
            
            console.log(`   Текущая сумма: ${currentAmount} / ${budget.targetAmount} (${progress.toFixed(1)}%)`);
            
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
        
        console.log(`\n✅ Статистика бюджетов получена\n`);
        
        res.json(budgetsWithStats);
    } catch (error) {
        console.error('❌ Get budget stats error:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики бюджетов' });
    }
};

// Обновить сумму накоплений
exports.updateSavingAmount = async (req, res) => {
    try {
        const { budgetId, amount, action } = req.body;
        const userId = req.user.userId;
        
        console.log(`\n💰 Обновление накоплений: budgetId=${budgetId}, amount=${amount}, action=${action}`);
        
        const budget = await Budget.findOne({
            where: { id: budgetId, userId, type: 'saving' }
        });
        
        if (!budget) {
            console.log(`❌ Бюджет ${budgetId} не найден или не является накопительным`);
            return res.status(404).json({ error: 'Накопительный бюджет не найден' });
        }
        
        let newCurrentAmount = budget.currentAmount;
        if (action === 'deposit') {
            newCurrentAmount = budget.currentAmount + amount;
            console.log(`   Пополнение: ${budget.currentAmount} + ${amount} = ${newCurrentAmount}`);
        } else if (action === 'withdrawal') {
            newCurrentAmount = Math.max(0, budget.currentAmount - amount);
            console.log(`   Снятие: ${budget.currentAmount} - ${amount} = ${newCurrentAmount}`);
        }
        
        await budget.update({ currentAmount: newCurrentAmount });
        
        console.log(`✅ Накопления обновлены: ${newCurrentAmount} BYN\n`);
        
        res.json({ success: true, currentAmount: newCurrentAmount });
    } catch (error) {
        console.error('❌ Update saving amount error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении суммы накоплений' });
    }
};

// Дополнительный метод для пересчета всех накопительных бюджетов
exports.recalculateAllSavings = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        console.log(`\n🔄 Пересчет всех накопительных бюджетов для пользователя ${userId}`);
        
        const savingBudgets = await Budget.findAll({
            where: { userId, type: 'saving' }
        });
        
        console.log(`   Найдено накопительных бюджетов: ${savingBudgets.length}`);
        
        const results = [];
        
        for (const budget of savingBudgets) {
            console.log(`\n🔍 Обработка бюджета ${budget.id} (${budget.name})`);
            console.log(`   Период: ${budget.startDate} - ${budget.endDate}`);
            
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
            
            console.log(`   Найдено пополнений: ${transactions.length}`);
            
            let totalAmount = 0;
            transactions.forEach(t => {
                const amountInBYN = parseFloat(t.amountInBYN || t.amount);
                console.log(`      - Транзакция ${t.id}: ${t.amount} ${t.currency} = ${amountInBYN} BYN`);
                totalAmount += amountInBYN;
            });
            
            console.log(`   Итого: ${totalAmount} BYN`);
            
            await budget.update({ currentAmount: totalAmount });
            console.log(`   ✅ Бюджет обновлен: currentAmount = ${totalAmount}`);
            
            results.push({
                id: budget.id,
                name: budget.name,
                oldAmount: budget.currentAmount,
                newAmount: totalAmount,
                diff: totalAmount - budget.currentAmount
            });
        }
        
        console.log(`\n✅ Пересчет завершен\n`);
        
        res.json({
            message: 'Пересчет завершен',
            results
        });
    } catch (error) {
        console.error('❌ Recalculate error:', error);
        res.status(500).json({ error: 'Ошибка при пересчете бюджетов' });
    }
};