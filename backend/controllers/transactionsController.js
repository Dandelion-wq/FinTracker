const { Transaction, Account, Category, Budget } = require('../models');
const { Op } = require('sequelize');

// Вспомогательная функция для конвертации валют (заглушка, нужно реализовать реальный сервис)
// В реальном проекте используйте API курсов валют
async function convertToBYN(amount, currency) {
    if (currency === 'BYN') return amount;
    
    // Заглушка: для примера используем фиксированные курсы
    // В реальном проекте нужно получать актуальные курсы из внешнего API
    const rates = {
        'USD': 3.2,
        'EUR': 3.5,
        'RUB': 0.035,
        'UAH': 0.085,
        'PLN': 0.8,
        'GBP': 4.1,
        'CNY': 0.45
    };
    
    const rate = rates[currency];
    if (!rate) return amount;
    
    return parseFloat(amount) * rate;
}

// Получение всех транзакций пользователя
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
                { model: Account, attributes: ['name', 'currency'] }
            ]
        });

        // Добавляем отображаемую сумму и конвертацию для статистики
        const transactionsWithDisplay = transactions.map(t => ({
            ...t.toJSON(),
            displayAmount: t.type === 'income' ? t.amount : -t.amount,
            amountInBYN: t.amountInBYN || t.amount
        }));

        res.json(transactionsWithDisplay);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Ошибка при получении транзакций' });
    }
};

// Создание транзакции
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
            budgetId,
            currency = 'BYN'
        } = req.body;

        console.log('📥 Создание транзакции:', { amount, type, accountId, date, savingAction, budgetId, currency });

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

        // Определяем валюту транзакции (из счета)
        const transactionCurrency = account.currency || currency || 'BYN';
        
        // Конвертируем сумму в BYN для отчетов
        const amountInBYN = await convertToBYN(amount, transactionCurrency);
        console.log(`Конвертация: ${amount} ${transactionCurrency} = ${amountInBYN} BYN`);

        let finalType = type;
        let finalCategoryId = categoryId;

        if (budgetId && savingAction) {
            const budget = await Budget.findOne({ where: { id: budgetId, userId } });
            if (budget && budget.type === 'saving') {
                if (savingAction === 'deposit') {
                    finalType = 'expense';
                    finalCategoryId = null;
                    // Проверка баланса для пополнения накоплений
                    if (parseFloat(account.balance) < parseFloat(amount)) {
                        return res.status(400).json({
                            error: `Недостаточно средств на счете "${account.name}"! Доступно: ${parseFloat(account.balance).toLocaleString()} ${transactionCurrency}`
                        });
                    }
                } else if (savingAction === 'withdrawal') {
                    finalType = 'income';
                    finalCategoryId = null;
                }
            }
        }

        // Проверка баланса для обычного расхода
        if (finalType === 'expense') {
            if (parseFloat(account.balance) < parseFloat(amount)) {
                return res.status(400).json({
                    error: `Недостаточно средств на счете "${account.name}"! Доступно: ${parseFloat(account.balance).toLocaleString()} ${transactionCurrency}`
                });
            }
        }

        // Создание транзакции с валютой
        const transaction = await Transaction.create({
            userId,
            amount,
            currency: transactionCurrency,
            amountInBYN: amountInBYN,
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

        console.log('✅ Транзакция создана:', transaction.id);

        // Обновление баланса счета
        const newBalance = finalType === 'income'
            ? parseFloat(account.balance) + parseFloat(amount)
            : parseFloat(account.balance) - parseFloat(amount);
        await account.update({ balance: newBalance });
        console.log(`💰 Баланс счета ${accountId} обновлен: ${newBalance} ${transactionCurrency}`);

        // Обработка перевода между счетами
        if (isTransfer && transferAccountId) {
            const targetAccount = await Account.findByPk(transferAccountId);
            if (targetAccount) {
                // При переводе нужно конвертировать сумму в валюту целевого счета
                const targetCurrency = targetAccount.currency || 'BYN';
                let amountInTargetCurrency = amount;
                
                if (transactionCurrency !== targetCurrency) {
                    // Конвертируем сумму в валюту целевого счета
                    amountInTargetCurrency = amount * (await getExchangeRate(transactionCurrency, targetCurrency));
                }
                
                const newTargetBalance = parseFloat(targetAccount.balance) + parseFloat(amountInTargetCurrency);
                await targetAccount.update({ balance: newTargetBalance });
                console.log(`💰 Баланс целевого счета ${transferAccountId} обновлен: ${newTargetBalance} ${targetCurrency}`);
            }
        }

        // Обновление бюджета для накопительных транзакций
        if (budgetId && savingAction) {
            const budget = await Budget.findOne({ where: { id: budgetId, userId } });
            if (budget && budget.type === 'saving') {
                let newCurrentAmount = parseFloat(budget.currentAmount) || 0;

                if (savingAction === 'deposit') {
                    newCurrentAmount += parseFloat(amount);
                    console.log(`📈 Пополнение бюджета ${budgetId}: +${amount}, теперь ${newCurrentAmount}`);
                } else if (savingAction === 'withdrawal') {
                    newCurrentAmount = Math.max(0, newCurrentAmount - parseFloat(amount));
                    console.log(`📉 Снятие с бюджета ${budgetId}: -${amount}, теперь ${newCurrentAmount}`);
                }

                await budget.update({ currentAmount: newCurrentAmount });
                console.log(`✅ Бюджет ${budgetId} обновлен: currentAmount = ${newCurrentAmount}`);
            }
        }

        const newTransaction = await Transaction.findByPk(transaction.id, {
            include: [
                { model: Category, attributes: ['name', 'color'] },
                { model: Account, attributes: ['name', 'currency'] }
            ]
        });

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error('❌ Ошибка создания транзакции:', error);
        res.status(500).json({ error: 'Ошибка при создании транзакции' });
    }
};

// Вспомогательная функция для получения курса обмена
async function getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    // Заглушка для курсов валют
    const rates = {
        'BYN_USD': 1 / 3.2,
        'USD_BYN': 3.2,
        'BYN_EUR': 1 / 3.5,
        'EUR_BYN': 3.5,
        'BYN_RUB': 1 / 0.035,
        'RUB_BYN': 0.035,
        // Добавьте другие пары по необходимости
    };
    
    const key = `${fromCurrency}_${toCurrency}`;
    return rates[key] || 1;
}

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

        // Откатываем изменения баланса старого счета
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

        // Обновляем транзакцию
        const newAmount = amount || transaction.amount;
        const newType = type || transaction.type;
        const newAccountId = accountId || transaction.accountId;
        
        // Получаем новый счет для пересчета валюты
        const newAccount = await Account.findByPk(newAccountId);
        const newCurrency = newAccount?.currency || transaction.currency;
        
        // Пересчитываем сумму в BYN если изменилась валюта или сумма
        let newAmountInBYN = transaction.amountInBYN;
        if (newAmount !== transaction.amount || newCurrency !== transaction.currency) {
            newAmountInBYN = await convertToBYN(newAmount, newCurrency);
        }

        await transaction.update({
            amount: newAmount,
            currency: newCurrency,
            amountInBYN: newAmountInBYN,
            type: newType,
            categoryId: finalCategoryId,
            accountId: newAccountId,
            date: date || transaction.date,
            description: description !== undefined ? description : transaction.description
        });

        // Применяем изменения баланса нового счета
        if (newAccount) {
            const newBalance = newType === 'income'
                ? parseFloat(newAccount.balance) + parseFloat(newAmount)
                : parseFloat(newAccount.balance) - parseFloat(newAmount);
            await newAccount.update({ balance: newBalance });
        }

        const updatedTransaction = await Transaction.findByPk(transaction.id, {
            include: [
                { model: Category, attributes: ['name', 'color'] },
                { model: Account, attributes: ['name', 'currency'] }
            ]
        });

        res.json(updatedTransaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Ошибка при обновлении транзакции' });
    }
};

// Удаление транзакции
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

// Получение статистики для графиков (в BYN)
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

        // Используем amountInBYN для статистики (единая валюта)
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amountInBYN || t.amount), 0);
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amountInBYN || t.amount), 0);

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

            const amountInBYN = parseFloat(transaction.amountInBYN || transaction.amount);
            const key = categoryName;
            const current = expenseByCategoryMap.get(key) || { total: 0, color: categoryColor };
            current.total += amountInBYN;
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