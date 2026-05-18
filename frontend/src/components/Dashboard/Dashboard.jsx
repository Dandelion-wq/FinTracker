import React, { useState, useEffect } from 'react';
import BalanceCard from './BalanceCard';
import AddTransactionForm from './AddTransactionForm';
import RecentTransactions from './RecentTransactions';
import ExpenseChart from './ExpenseChart';
import { transactionsAPI, accountsAPI, categoriesAPI } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsRes, accountsRes, categoriesRes, statsRes] = await Promise.all([
                transactionsAPI.getAll(),
                accountsAPI.getAll(),
                categoriesAPI.getAll(),
                transactionsAPI.getStats('month')
            ]);
            setTransactions(transactionsRes.data);
            setAccounts(accountsRes.data);
            setCategories(categoriesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalBalance = () => {
        if (!accounts || accounts.length === 0) return 0;
        const total = accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
        return total;
    };

    const handleAddTransaction = async (newTransaction) => {
        try {
            const response = await transactionsAPI.create(newTransaction);
            setTransactions([response.data, ...transactions]);
            await loadData();
        } catch (error) {
            console.error('Ошибка добавления транзакции:', error);
            alert(error.response?.data?.error || 'Ошибка при добавлении транзакции');
        }
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
                <h1 className="page-title">Главная</h1>
                <div className="loading-container">Загрузка данных...</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <h1 className="page-title">Главная</h1>

            <BalanceCard totalBalance={calculateTotalBalance()} />

            <div className="dashboard-grid">
                <AddTransactionForm
                    onAddTransaction={handleAddTransaction}
                    accounts={accounts || []}
                    categories={categories || []}
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