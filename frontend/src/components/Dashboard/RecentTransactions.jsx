import React from 'react';
import { Link } from 'react-router-dom';
import './RecentTransactions.css';

function RecentTransactions({ transactions, getCategoryName, getAccountName }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    return (
        <div className="recent-transactions">
            <div className="section-header">
                <h3>Последние транзакции</h3>
                <Link to="/transactions" className="text-link">Показать все →</Link>
            </div>
            <table className="transactions-table">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Категория</th>
                        <th>Счет</th>
                        <th>Описание</th>
                        <th>Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td>{formatDate(transaction.date)}</td>
                            <td>{getCategoryName(transaction.categoryId)}</td>
                            <td>{getAccountName(transaction.accountId)}</td>
                            <td>{transaction.description || '—'}</td>
                            <td className={transaction.type === 'income' ? 'income-text' : 'expense-text'}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {Number(transaction.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BYN
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan="5" className="empty-message">Нет транзакций</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default RecentTransactions;