import React from 'react';
import { Link } from 'react-router-dom';
import './RecentTransactions.css';

// Символы валют
const currencySymbols = {
    'BYN': 'BYN',
    'USD': '$',
    'EUR': '€',
    'RUB': '₽'
};

function RecentTransactions({ transactions, getCategoryName, getAccountName }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const getCurrencySymbol = (currency) => {
        return currencySymbols[currency] || currency;
    };

    return (
        <div className="recent-transactions">
            <div className="section-header">
                <h3>Последние транзакции</h3>
                <Link to="/transactions" className="text-link">Показать все →</Link>
            </div>
            
            {/* Десктопная таблица */}
            <div className="desktop-table">
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
                                    {Number(transaction.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencySymbol(transaction.currency || 'BYN')}
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
            
            {/* Мобильные карточки */}
            <div className="mobile-cards">
                {transactions.map(transaction => (
                    <div key={transaction.id} className="transaction-card">
                        <div className="transaction-card-header">
                            <span className="transaction-date">{formatDate(transaction.date)}</span>
                            <span className={`transaction-amount ${transaction.type === 'income' ? 'income-text' : 'expense-text'}`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {Number(transaction.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencySymbol(transaction.currency || 'BYN')}
                            </span>
                        </div>
                        <div className="transaction-card-body">
                            <div className="transaction-row">
                                <span className="transaction-label">Категория:</span>
                                <span className="transaction-value">{getCategoryName(transaction.categoryId)}</span>
                            </div>
                            <div className="transaction-row">
                                <span className="transaction-label">Счет:</span>
                                <span className="transaction-value">{getAccountName(transaction.accountId)}</span>
                            </div>
                            {transaction.description && (
                                <div className="transaction-row">
                                    <span className="transaction-label">Описание:</span>
                                    <span className="transaction-value">{transaction.description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {transactions.length === 0 && (
                    <div className="empty-message-mobile">Нет транзакций</div>
                )}
            </div>
        </div>
    );
}

export default RecentTransactions;