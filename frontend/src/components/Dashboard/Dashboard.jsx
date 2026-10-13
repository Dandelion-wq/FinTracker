import React, { useState, useEffect } from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import BalanceCard from './BalanceCard';
import AddTransactionForm from './AddTransactionForm';
import RecentTransactions from './RecentTransactions';
import ExpenseChart from './ExpenseChart';
import { transactionsAPI, accountsAPI, categoriesAPI, budgetsAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../UI/ToastContainer';
import './Dashboard.css';

function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toasts, removeToast, success, error: showError, warning } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsRes, accountsRes, categoriesRes, budgetsRes] = await Promise.all([
                transactionsAPI.getAll(),
                accountsAPI.getAll(),
                categoriesAPI.getAll(),
                budgetsAPI.getAll()
            ]);
            setTransactions(transactionsRes.data);
            setAccounts(accountsRes.data);
            setCategories(categoriesRes.data);
            setBudgets(budgetsRes.data);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            showError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    //проверка бюджетов после добавления транзакции
    const checkBudgetsAfterTransaction = (newTransaction, currentBudgets, allTransactions) => {
        const now = new Date();
        const transactionDate = new Date(newTransaction.date);

        //проверка расходных бюджетов
        const expenseBudgets = currentBudgets.filter(b => b.type === 'expense');
        for (const budget of expenseBudgets) {
            const startDate = new Date(budget.startDate);
            const endDate = new Date(budget.endDate);

            if (transactionDate >= startDate && transactionDate <= endDate && newTransaction.type === 'expense') {
                const budgetTransactions = allTransactions.filter(t =>
                    t.type === 'expense' &&
                    new Date(t.date) >= startDate &&
                    new Date(t.date) <= endDate
                );
                const totalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

                if (totalSpent > budget.targetAmount) {
                    warning(`Бюджет "${budget.name}" превышен! Потрачено ${totalSpent.toLocaleString()} BYN при лимите ${budget.targetAmount.toLocaleString()} BYN`);
                } else if (totalSpent === budget.targetAmount) {
                    success(`Бюджет "${budget.name}" достигнут! Потрачено ровно ${totalSpent.toLocaleString()} BYN`);
                }
            }
        }

        //проверка накопительных бюджетов
        const savingBudgets = currentBudgets.filter(b => b.type === 'saving');
        for (const budget of savingBudgets) {
            const startDate = new Date(budget.startDate);
            const endDate = new Date(budget.endDate);

            if (transactionDate >= startDate && transactionDate <= endDate && newTransaction.savingAction) {
                const budgetTransactions = allTransactions.filter(t =>
                    t.savingAction &&
                    t.budgetId === budget.id &&
                    new Date(t.date) >= startDate &&
                    new Date(t.date) <= endDate
                );
                const totalSaved = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

                if (totalSaved >= budget.targetAmount && (budget.currentAmount || 0) < budget.targetAmount) {
                    success(`Поздравляем! Вы достигли цели "${budget.name}"! Накоплено ${totalSaved.toLocaleString()} BYN из ${budget.targetAmount.toLocaleString()} BYN`);
                }
            }
        }
    };

    const handleAddTransaction = async (transactionData, selectedBudget, savingAction) => {
        console.log('handleAddTransaction получила:', { transactionData, selectedBudget, savingAction });

        try {
            let response;

            if (selectedBudget && selectedBudget.type === 'saving') {
                console.log('Это накопительный бюджет!');
                const transactionToSend = {
                    amount: transactionData.amount,
                    accountId: transactionData.accountId,
                    date: transactionData.date,
                    description: transactionData.description,
                    type: 'expense',
                    savingAction: 'deposit',   
                    budgetId: selectedBudget.id 
                };
                console.log('Отправляем на сервер:', transactionToSend);
                response = await transactionsAPI.create(transactionToSend);
            } else {
                response = await transactionsAPI.create(transactionData);
            }

            console.log('Ответ сервера:', response.data);

            //обновляем все данные
            await loadData();

        } catch (error) {
            console.error('Ошибка:', error);
            showError(error.response?.data?.error || 'Ошибка при добавлении транзакции');
        }
    };

    const calculateTotalBalance = () => {
        if (!accounts || accounts.length === 0) return 0;
        const total = accounts.reduce((sum, account) => {
            const balance = typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0;
            return sum + balance;
        }, 0);
        return total;
    };

    const getCategoryName = (categoryId) => {
        const category = categories?.find(c => c.id === categoryId);
        return category ? category.name : 'Без категории';
    };

    const getAccountName = (accountId) => {
        const account = accounts?.find(a => a.id === accountId);
        return account ? account.name : 'Без счета';
    };

    if (loading) {
        return (
            <div className="dashboard">
                <h1 className="page-title">
                    <FiBarChart2 className="page-icon" />
                    Главная
                </h1>
                <div className="loading-container">Загрузка данных...</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <h1 className="page-title">
                <FiBarChart2 className="page-icon" />
                Главная
            </h1>

            <BalanceCard totalBalance={calculateTotalBalance()} />

            <div className="dashboard-grid">
                <AddTransactionForm
                    onAddTransaction={handleAddTransaction}
                    accounts={accounts || []}
                    categories={categories || []}
                    budgets={budgets || []}
                />
                <ExpenseChart transactions={transactions || []} categories={categories || []} />
            </div>

            <RecentTransactions
                transactions={(transactions || []).slice(0, 5)}
                getCategoryName={getCategoryName}
                getAccountName={getAccountName}
            />
        </div>
    );
}

export default Dashboard;