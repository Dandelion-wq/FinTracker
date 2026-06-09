const { Transaction, Account, Category, Budget } = require('../models');
const { Op } = require('sequelize');

//получение всех транзакций пользователя
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

//создание транзакции
exports.create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            amount,
            type,
            categoryId,
            accountId,
            date,
            description,
            isTransfer,
            transferAccountId,
            savingAction,
            budgetId
        } = req.body;

        console.log('📥 Создание транзакции:', { amount, type, accountId, date, savingAction, budgetId });

        if (!amount || !accountId || !date) {
            return res.status(400).json({ error: 'Сумма, счет и дата обязательны' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть больше 0' });
        }

        const account = await Account.findByPk(accountId);
        if (!account) {
            return res.status(404).json({ error: 'Счет не найден' });
        }

        let finalType = type;
        let finalCategoryId = categoryId;

        if (budgetId && savingAction) {
            const budget = await Budget.findOne({ where: { id: budgetId, userId } });
            if (budget && budget.type === 'saving') {
                if (savingAction === 'deposit') {
                    finalType = 'expense';
                    finalCategoryId = null;
                    //проверка баланса для пополнения накоплений
                    if (parseFloat(account.balance) < parseFloat(amount)) {
                        return res.status(400).json({
                            error: `Недостаточно средств на счете "${account.name}"! Доступно: ${parseFloat(account.balance).toLocaleString()} BYN`
                        });
                    }
                } else if (savingAction === 'withdrawal') {
                    finalType = 'income';
                    finalCategoryId = null;
                }
            }
        }

        //проверка баланса для обычного расхода
        if (finalType === 'expense') {
            if (parseFloat(account.balance) < parseFloat(amount)) {
                return res.status(400).json({
                    error: `Недостаточно средств на счете "${account.name}"! Доступно: ${parseFloat(account.balance).toLocaleString()} BYN`
                });
            }
        }

        //создание транзакции
        const transaction = await Transaction.create({
            userId,
            amount,
            type: finalType,
            categoryId: finalCategoryId,
            accountId,
            date,
            description: description || null,
            isTransfer: isTransfer || false,
            transferAccountId: transferAccountId || null,
            savingAction: savingAction || null,
            budgetId: budgetId || null
        });

        console.log('Транзакция создана:', transaction.id);

        //обновление баланса счета
        const newBalance = finalType === 'income'
            ? parseFloat(account.balance) + parseFloat(amount)
            : parseFloat(account.balance) - parseFloat(amount);
        await account.update({ balance: newBalance });
        console.log(`Баланс счета ${accountId} обновлен: ${newBalance}`);

        if (isTransfer && transferAccountId) {
            const targetAccount = await Account.findByPk(transferAccountId);
            if (targetAccount) {
                const newTargetBalance = parseFloat(targetAccount.balance) + parseFloat(amount);
                await targetAccount.update({ balance: newTargetBalance });
            }
        }

        //обновление бюджета для накопительных транзакций
        if (budgetId && savingAction) {
            const budget = await Budget.findOne({ where: { id: budgetId, userId } });
            if (budget && budget.type === 'saving') {
                let newCurrentAmount = parseFloat(budget.currentAmount) || 0;

                if (savingAction === 'deposit') {
                    newCurrentAmount += parseFloat(amount);
                    console.log(`Пополнение бюджета ${budgetId}: +${amount}, теперь ${newCurrentAmount}`);
                } else if (savingAction === 'withdrawal') {
                    newCurrentAmount = Math.max(0, newCurrentAmount - parseFloat(amount));
                    console.log(`Снятие с бюджета ${budgetId}: -${amount}, теперь ${newCurrentAmount}`);
                }

                await budget.update({ currentAmount: newCurrentAmount });
                console.log(`Бюджет ${budgetId} обновлен: currentAmount = ${newCurrentAmount}`);
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
        console.error('Ошибка создания транзакции:', error);
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

        const oldAccount = await Account.findByPk(transaction.accountId);
        if (oldAccount) {
            const oldBalance = transaction.type === 'income'
                ? parseFloat(oldAccount.balance) - parseFloat(transaction.amount)
                : parseFloat(oldAccount.balance) + parseFloat(transaction.amount);
            await oldAccount.update({ balance: oldBalance });
        }

        let finalCategoryId = categoryId;
        if (categoryId === '' || categoryId === null || categoryId === undefined) {
            finalCategoryId = null;
        } else {
            finalCategoryId = parseInt(categoryId);
        }

        await transaction.update({
            amount: amount || transaction.amount,
            type: type || transaction.type,
            categoryId: finalCategoryId,
            accountId: accountId || transaction.accountId,
            date: date || transaction.date,
            description: description !== undefined ? description : transaction.description
        });

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

//удаление транзакции
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

//получение статистики для графиков
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

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

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