import React, { useState, useEffect } from 'react';
import { accountsAPI } from '../../services/api';
import './Accounts.css';

function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'cash',
        currency: 'BYN',
        balance: '',
        icon: '💵'
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await accountsAPI.getAll();
            setAccounts(response.data);
        } catch (error) {
            console.error('Ошибка загрузки счетов:', error);
            alert('Не удалось загрузить счета');
        } finally {
            setLoading(false);
        }
    };

    const getTypeName = (type) => {
        const types = {
            cash: 'Наличные',
            card: 'Банковская карта',
            ewallet: 'Электронный кошелек',
            deposit: 'Депозит'
        };
        return types[type] || type;
    };

    const getIconByType = (type) => {
        const icons = {
            cash: '💵',
            card: '💳',
            ewallet: '📱',
            deposit: '🏦'
        };
        return icons[type] || '💰';
    };

    const handleAddAccount = async () => {
        if (!newAccount.name) {
            alert('Введите название счета');
            return;
        }

        try {
            const response = await accountsAPI.create({
                ...newAccount,
                balance: parseFloat(newAccount.balance) || 0
            });
            setAccounts([...accounts, response.data]);
            setNewAccount({ name: '', type: 'cash', currency: 'BYN', balance: '', icon: '💵' });
            setShowForm(false);
        } catch (error) {
            console.error('Ошибка создания счета:', error);
            alert('Не удалось создать счет');
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот счет? Все связанные транзакции также будут удалены.')) return;

        try {
            await accountsAPI.delete(id);
            setAccounts(accounts.filter(a => a.id !== id));
        } catch (error) {
            console.error('Ошибка удаления счета:', error);
            alert('Не удалось удалить счет');
        }
    };

    const handleEdit = (account) => {
        setEditingId(account.id);
        setEditForm({
            name: account.name,
            type: account.type,
            currency: account.currency,
            icon: account.icon
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const response = await accountsAPI.update(id, editForm);
            setAccounts(accounts.map(a => a.id === id ? response.data : a));
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Ошибка обновления счета:', error);
            alert('Не удалось обновить счет');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleTypeChange = (type) => {
        setNewAccount({
            ...newAccount,
            type,
            icon: getIconByType(type)
        });
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    if (loading) {
        return <div className="loading-container">Загрузка счетов...</div>;
    }

    return (
        <div className="accounts-page">
            <div className="page-header">
                <h1 className="page-title">Счета</h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    + Добавить счет
                </button>
            </div>

            {showForm && (
                <div className="add-account-form">
                    <h3>Новый счет</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Название</label>
                            <input
                                type="text"
                                value={newAccount.name}
                                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                placeholder="Наличные, Карта Visa..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Тип</label>
                            <select
                                value={newAccount.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                            >
                                <option value="cash">Наличные</option>
                                <option value="card">Банковская карта</option>
                                <option value="ewallet">Электронный кошелек</option>
                                <option value="deposit">Депозит</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Валюта</label>
                            <select
                                value={newAccount.currency}
                                onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                            >
                                <option value="BYN">BYN</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="RUB">RUB</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Начальный баланс</label>
                            <input
                                type="number"
                                value={newAccount.balance}
                                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                                placeholder="0,00"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button className="btn-submit" onClick={handleAddAccount}>Создать</button>
                        <button className="btn-cancel" onClick={() => setShowForm(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="accounts-grid">
                {accounts.map(account => (
                    <div key={account.id} className="account-card">
                        {editingId === account.id ? (
                            <div className="account-edit-form">
                                <div className="edit-fields">
                                    <input
                                        type="text"
                                        name="name"
                                        value={editForm.name}
                                        onChange={handleEditChange}
                                        placeholder="Название"
                                    />
                                    <select name="type" value={editForm.type} onChange={handleEditChange}>
                                        <option value="cash">Наличные</option>
                                        <option value="card">Банковская карта</option>
                                        <option value="ewallet">Электронный кошелек</option>
                                        <option value="deposit">Депозит</option>
                                    </select>
                                    <select name="currency" value={editForm.currency} onChange={handleEditChange}>
                                        <option value="BYN">BYN</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="RUB">RUB</option>
                                    </select>
                                </div>
                                <div className="actions">
                                    <button className="btn-save" onClick={() => handleEditSubmit(account.id)}>✓</button>
                                    <button className="btn-cancel" onClick={handleCancelEdit}>✗</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="account-icon">{account.icon}</div>
                                <div className="account-info">
                                    <div className="account-name">{account.name}</div>
                                    <div className="account-type">{getTypeName(account.type)}</div>
                                </div>
                                <div className="account-balance">
                                    {Number(account.balance).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
                                </div>
                                <div className="account-actions">
                                    <button className="btn-edit" onClick={() => handleEdit(account)}>✏️</button>
                                    <button className="btn-delete" onClick={() => handleDeleteAccount(account.id)}>🗑️</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div className="empty-message">Нет счетов. Создайте первый счет!</div>
                )}
            </div>

            <div className="total-balance">
                <span>Общий баланс всех счетов</span>
                <strong>{Number(totalBalance).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BYN</strong>
            </div>
        </div>
    );
}

export default Accounts;