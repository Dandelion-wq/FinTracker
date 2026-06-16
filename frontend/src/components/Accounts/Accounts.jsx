import React, { useState, useEffect } from 'react';
import {
    FiDollarSign,
    FiCreditCard,
    FiSmartphone,
    FiHome,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX
} from 'react-icons/fi';
import { accountsAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../UI/ToastContainer';
import ConfirmModal from '../UI/ConfirmModal';
import './Accounts.css';

const accountIcons = {
    cash: <FiDollarSign size={24} />,
    card: <FiCreditCard size={24} />,
    ewallet: <FiSmartphone size={24} />,
    deposit: <FiHome size={24} />
};

const currencySymbols = {
    BYN: 'BYN',
    USD: '$',
    EUR: '€',
    RUB: '₽'
};

function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const { toasts, removeToast, success, error: showError } = useToast();
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        accountId: null,
        accountName: ''
    });
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'cash',
        currency: 'BYN',
        balance: ''
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
            showError('Не удалось загрузить счета');
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

    // Открытие модального окна подтверждения удаления
    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            accountId: id,
            accountName: name
        });
    };

    // Закрытие модального окна
    const closeDeleteConfirm = () => {
        setConfirmModal({
            isOpen: false,
            accountId: null,
            accountName: ''
        });
    };

    // Подтверждение удаления
    const confirmDelete = async () => {
        const { accountId, accountName } = confirmModal;
        
        try {
            await accountsAPI.delete(accountId);
            setAccounts(accounts.filter(a => a.id !== accountId));
            success(`Счет "${accountName}" удален`);
        } catch (error) {
            console.error('Ошибка удаления счета:', error);
            showError('Не удалось удалить счет');
        } finally {
            closeDeleteConfirm();
        }
    };

    const handleAddAccount = async () => {
        if (!newAccount.name) {
            showError('Введите название счета');
            return;
        }

        try {
            const response = await accountsAPI.create({
                name: newAccount.name,
                type: newAccount.type,
                currency: newAccount.currency,
                balance: parseFloat(newAccount.balance) || 0
            });
            setAccounts([...accounts, response.data]);
            setNewAccount({ name: '', type: 'cash', currency: 'BYN', balance: '' });
            setShowForm(false);
            success(`Счет "${newAccount.name}" успешно создан`);
        } catch (error) {
            console.error('Ошибка создания счета:', error);
            showError('Не удалось создать счет');
        }
    };

    const handleEdit = (account) => {
        setEditingId(account.id);
        setEditForm({
            name: account.name,
            type: account.type,
            currency: account.currency
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const response = await accountsAPI.update(id, {
                name: editForm.name,
                type: editForm.type,
                currency: editForm.currency
            });
            setAccounts(accounts.map(a => a.id === id ? response.data : a));
            setEditingId(null);
            setEditForm({});
            success(`Счет "${editForm.name}" обновлен`);
        } catch (error) {
            console.error('Ошибка обновления счета:', error);
            showError('Не удалось обновить счет');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleTypeChange = (type) => {
        setNewAccount({
            ...newAccount,
            type
        });
    };

    // Общий баланс в BYN (для отображения в главной валюте)
    const totalBalanceBYN = accounts.reduce((sum, acc) => {
        const balance = typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance) || 0;
        return sum + balance;
    }, 0);

    if (loading) {
        return <div className="loading-container">Загрузка счетов...</div>;
    }

    return (
        <div className="accounts-page">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDelete}
                title="Удаление счета"
                message={`Вы уверены, что хотите удалить счет "${confirmModal.accountName}"? Все связанные транзакции также будут удалены.`}
                confirmText="Удалить"
                cancelText="Отмена"
                type="danger"
            />
            
            <div className="page-header">
                <h1 className="page-title">Счета</h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> Добавить счет
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
                                <option value="BYN">BYN (Белорусский рубль)</option>
                                <option value="USD">USD (Доллар США)</option>
                                <option value="EUR">EUR (Евро)</option>
                                <option value="RUB">RUB (Российский рубль)</option>
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
                            <>
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
                                        <button className="btn-save" onClick={() => handleEditSubmit(account.id)}>
                                            <FiCheck />
                                        </button>
                                        <button className="btn-cancel" onClick={handleCancelEdit}>
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="account-icon">
                                    {accountIcons[account.type] || <FiDollarSign size={24} />}
                                </div>
                                <div className="account-info">
                                    <div className="account-name">{account.name}</div>
                                    <div className="account-type">{getTypeName(account.type)}</div>
                                    <div className="account-currency">{currencySymbols[account.currency] || account.currency}</div>
                                </div>
                                <div className="account-balance">
                                    {Number(account.balance).toLocaleString()} {currencySymbols[account.currency] || account.currency}
                                </div>
                                <div className="account-actions">
                                    <button className="btn-edit" onClick={() => handleEdit(account)}>
                                        <FiEdit2 />
                                    </button>
                                    <button className="btn-delete" onClick={() => openDeleteConfirm(account.id, account.name)}>
                                        <FiTrash2 />
                                    </button>
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
                <span>Общий баланс (в BYN)</span>
                <strong>{totalBalanceBYN.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BYN</strong>
            </div>
        </div>
    );
}

export default Accounts;