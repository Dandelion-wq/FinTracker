import React, { useState, useEffect } from 'react';
import {
    FiTrendingUp, FiTrendingDown, FiDownload, FiSearch,
    FiEdit2, FiTrash2, FiCheck, FiX, FiPlus, FiFilter
} from 'react-icons/fi';
import { transactionsAPI, categoriesAPI, accountsAPI } from '../../services/api';
import './Transactions.css';

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDate, setFilterDate] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        loadData();
    }, [filterType, filterCategory, filterDate]);

    const loadData = async () => {
        try {
            setLoading(true);

            const now = new Date();
            let startDate;
            if (filterDate === 'week') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
            } else if (filterDate === 'month') {
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (filterDate === 'year') {
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
            } else {
                startDate = null;
            }

            const params = {
                type: filterType,
                categoryId: filterCategory
            };
            if (startDate) {
                params.startDate = startDate.toISOString().split('T')[0];
                params.endDate = now.toISOString().split('T')[0];
            }

            const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
                transactionsAPI.getAll(params),
                categoriesAPI.getAll(),
                accountsAPI.getAll()
            ]);

            setTransactions(transactionsRes.data || []);
            setCategories(categoriesRes.data || []);
            setAccounts(accountsRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Без категории';
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? account.name : 'Без счета';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const formatAmount = (amount) => {
        const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return num.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) return;

        try {
            await transactionsAPI.delete(id);
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить транзакцию');
        }
    };

    const handleEdit = (transaction) => {
        setEditingId(transaction.id);
        setEditForm({
            amount: transaction.amount,
            type: transaction.type,
            categoryId: transaction.categoryId || '',
            accountId: transaction.accountId,
            date: transaction.date,
            description: transaction.description || ''
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const dataToSend = {
                amount: editForm.amount,
                type: editForm.type,
                categoryId: editForm.categoryId === '' ? null : parseInt(editForm.categoryId),
                accountId: parseInt(editForm.accountId),
                date: editForm.date,
                description: editForm.description
            };

            const response = await transactionsAPI.update(id, dataToSend);
            setTransactions(transactions.map(t => t.id === id ? response.data : t));
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Ошибка обновления:', error);
            alert('Не удалось обновить транзакцию');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleExportCSV = () => {
        const filtered = transactions;
        const delimiter = ';';

        const headers = ['Дата', 'Тип', 'Категория', 'Счет', 'Описание', 'Сумма'];

        const rows = filtered.map(t => [
            t.date,
            t.type === 'income' ? 'Доход' : 'Расход',
            getCategoryName(t.categoryId),
            getAccountName(t.accountId),
            t.description || '',
            t.type === 'income' ? t.amount : -t.amount
        ]);

        const escapeCell = (cell) => {
            const cellStr = String(cell);
            if (cellStr.includes('"') || cellStr.includes(delimiter) || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };

        const csvRows = [
            headers.map(escapeCell).join(delimiter),
            ...rows.map(row => row.map(escapeCell).join(delimiter))
        ];

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(t.categoryId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="loading-container">Загрузка транзакций...</div>;
    }

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1 className="page-title">Транзакции</h1>
                <button className="btn-export" onClick={handleExportCSV}>
                    <FiDownload /> Экспорт CSV
                </button>
            </div>

            <div className="transactions-summary">
                <div className="summary-card income">
                    <FiTrendingUp />
                    <span>Доходы</span>
                    <strong>+{formatAmount(totalIncome)} BYN</strong>
                </div>
                <div className="summary-card expense">
                    <FiTrendingDown />
                    <span>Расходы</span>
                    <strong>-{formatAmount(totalExpense)} BYN</strong>
                </div>
            </div>

            <div className="filter-bar">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">Все операции</option>
                    <option value="income">Доходы</option>
                    <option value="expense">Расходы</option>
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">Все категории</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                    <option value="all">За все время</option>
                    <option value="week">За неделю</option>
                    <option value="month">За месяц</option>
                    <option value="year">За год</option>
                </select>
                <div className="search-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="transactions-table-container">
                <table className="transactions-table-full">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Тип</th>
                            <th>Категория</th>
                            <th>Счет</th>
                            <th>Описание</th>
                            <th>Сумма</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(transaction => (
                            <tr key={transaction.id}>
                                {editingId === transaction.id ? (
                                    <>
                                        <td>
                                            <input
                                                type="date"
                                                name="date"
                                                value={editForm.date}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        <td>
                                            <select name="type" value={editForm.type} onChange={handleEditChange}>
                                                <option value="expense">Расход</option>
                                                <option value="income">Доход</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select name="categoryId" value={editForm.categoryId} onChange={handleEditChange}>
                                                <option value="">Без категории</option>
                                                {categories.filter(c => c.type === editForm.type).map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select name="accountId" value={editForm.accountId} onChange={handleEditChange}>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="description"
                                                value={editForm.description}
                                                onChange={handleEditChange}
                                                placeholder="Описание"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={editForm.amount}
                                                onChange={handleEditChange}
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="actions">
                                            <button className="btn-save" onClick={() => handleEditSubmit(transaction.id)}>
                                                <FiCheck />
                                            </button>
                                            <button className="btn-cancel" onClick={handleCancelEdit}>
                                                <FiX />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{formatDate(transaction.date)}</td>
                                        <td>
                                            <span className={`type-badge ${transaction.type}`}>
                                                {transaction.type === 'income' ? 'Доход' : 'Расход'}
                                            </span>
                                        </td>
                                        <td>{getCategoryName(transaction.categoryId)}</td>
                                        <td>{getAccountName(transaction.accountId)}</td>
                                        <td>{transaction.description || '—'}</td>
                                        <td className={transaction.type === 'income' ? 'income-text' : 'expense-text'}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)} BYN
                                        </td>
                                        <td className="actions">
                                            <button className="btn-edit" onClick={() => handleEdit(transaction)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(transaction.id)}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty-message">Нет транзакций</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Transactions;