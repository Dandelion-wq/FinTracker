const { Transaction, Account, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

// Получить все транзакции пользователя
exports.getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, type, categoryId } = req.query;
        
        const whereClause = { userId };
        
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        }
        if (type && type !== 'all') {
            whereClause.type = type;
        }
        if (categoryId && categoryId !== 'all') {
            whereClause.categoryId = parseInt(categoryId);
        }
        
        const transactions = await Transaction.findAll({
            where: whereClause,
            order: [['date', 'DESC']],
            include: [
                { model: Category, attributes: ['name', 'color'] },
                { model: Account, attributes: ['name'] }
            ]
        });
        
        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Ошибка при получении транзакций' });
    }
};

// Создать новую транзакцию
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { amount, type, categoryId, accountId, date, description, isTransfer, transferAccountId } = req.body;
        
        if (!amount || !type || !accountId || !date) {
            return res.status(400).json({ error: 'Сумма, тип, счет и дата обязательны' });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть больше 0' });
        }
        
        // Создание транзакции
        const transaction = await Transaction.create({
            userId,
            amount,
            type,
            categoryId: categoryId || null,
            accountId,
            date,
            description: description || null,
            isTransfer: isTransfer || false,
            transferAccountId: transferAccountId || null
        });
        
        // Обновление баланса счета
        const account = await Account.findByPk(accountId);
        if (account) {
            const newBalance = type === 'income'
                ? parseFloat(account.balance) + parseFloat(amount)
                : parseFloat(account.balance) - parseFloat(amount);
            await account.update({ balance: newBalance });
        }
        
        // Если это перевод, обновляем баланс целевого счета
        if (isTransfer && transferAccountId) {
            const targetAccount = await Account.findByPk(transferAccountId);
            if (targetAccount) {
                const newBalance = parseFloat(targetAccount.balance) + parseFloat(amount);
                await targetAccount.update({ balance: newBalance });
            }
        }
        
        const newTransaction = await Transaction.findByPk(transaction.id, {
            include: [
                { model: Category, attributes: ['name', 'color'] },
                { model: Account, attributes: ['name'] }
            ]
        });
        
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Ошибка при создании транзакции' });
    }
};

// Обновить транзакцию
exports.update = async (req, res) => {
    try {
        const userId = req.user.userId;
        const transactionId = req.params.id;
        const { amount, type, categoryId, accountId, date, description } = req.body;
        
        const transaction = await Transaction.findOne({
            where: { id: transactionId, userId }
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Транзакция не найдена' });
        }
        
        // Откатываем изменение баланса старого счета
        const oldAccount = await Account.findByPk(transaction.accountId);
        if (oldAccount) {
            const oldBalance = transaction.type === 'income'
                ? parseFloat(oldAccount.balance) - parseFloat(transaction.amount)
                : parseFloat(oldAccount.balance) + parseFloat(transaction.amount);
            await oldAccount.update({ balance: oldBalance });
        }
        
        // Обновляем транзакцию
        await transaction.update({
            amount: amount || transaction.amount,
            type: type || transaction.type,
            categoryId: categoryId !== undefined ? categoryId : transaction.categoryId,
            accountId: accountId || transaction.accountId,
            date: date || transaction.date,
            description: description !== undefined ? description : transaction.description
        });
        
        // Применяем изменение баланса нового счета
        const newAccount = await Account.findByPk(transaction.accountId);
        if (newAccount) {
            const newBalance = transaction.type === 'income'
                ? parseFloat(newAccount.balance) + parseFloat(transaction.amount)
                : parseFloat(newAccount.balance) - parseFloat(transaction.amount);
            await newAccount.update({ balance: newBalance });
        }
        
        const updatedTransaction = await Transaction.findByPk(transaction.id, {
            include: [
                { model: Category, attributes: ['name', 'color'] },
                { model: Account, attributes: ['name'] }
            ]
        });
        
        res.json(updatedTransaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении транзакции' });
    }
};

// Удалить транзакцию
exports.delete = async (req, res) => {
    try {
        const userId = req.user.userId;
        const transactionId = req.params.id;
        
        const transaction = await Transaction.findOne({
            where: { id: transactionId, userId }
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Транзакция не найдена' });
        }
        
        // Откатываем изменение баланса
        const account = await Account.findByPk(transaction.accountId);
        if (account) {
            const newBalance = transaction.type === 'income'
                ? parseFloat(account.balance) - parseFloat(transaction.amount)
                : parseFloat(account.balance) + parseFloat(transaction.amount);
            await account.update({ balance: newBalance });
        }
        
        await transaction.destroy();
        res.json({ message: 'Транзакция удалена' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Ошибка при удалении транзакции' });
    }
};

// Получить статистику (для графиков)
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month' } = req.query;
        
        let startDate;
        const endDate = new Date();
        
        switch (period) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
        }
        
        // Форматируем даты для SQL
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Получаем все транзакции за период
        const transactions = await Transaction.findAll({
            where: {
                userId,
                date: { [Op.between]: [startDateStr, endDateStr] }
            }
        });
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        // Расходы по категориям
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const expenseByCategoryMap = new Map();
        
        for (const transaction of expenseTransactions) {
            let categoryName = 'Без категории';
            let categoryColor = '#7F8C8D';
            
            if (transaction.categoryId) {
                const category = await Category.findByPk(transaction.categoryId);
                if (category) {
                    categoryName = category.name;
                    categoryColor = category.color;
                }
            }
            
            const key = categoryName;
            const current = expenseByCategoryMap.get(key) || { total: 0, color: categoryColor };
            current.total += parseFloat(transaction.amount);
            expenseByCategoryMap.set(key, current);
        }
        
        const expenseByCategory = Array.from(expenseByCategoryMap.entries()).map(([name, data]) => ({
            categoryName: name,
            categoryColor: data.color,
            total: data.total
        }));
        
        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            expenseByCategory
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики' });
    }
};