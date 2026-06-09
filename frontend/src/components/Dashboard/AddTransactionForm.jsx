import React, { useState } from 'react';
import { FiPlus, FiTrendingUp, FiTrendingDown, FiDollarSign, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import './AddTransactionForm.css';

function AddTransactionForm({ onAddTransaction, accounts, categories, budgets = [] }) {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        categoryId: categories.find(c => c.type === 'expense')?.id || '',
        accountId: accounts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        budgetId: '',
        savingAction: 'deposit'
    });

    const [selectedBudget, setSelectedBudget] = useState(null);
    const [balanceError, setBalanceError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setBalanceError('');
        
        if (name === 'type') {
            setSelectedBudget(null);
            setFormData(prev => ({ ...prev, budgetId: '', savingAction: 'deposit' }));
            
            const firstCategory = categories.find(c => c.type === value);
            if (firstCategory) {
                setFormData(prev => ({ ...prev, categoryId: firstCategory.id }));
            }
        }
        
        if (name === 'budgetId') {
            const budget = budgets.find(b => b.id === parseInt(value));
            setSelectedBudget(budget);
        }
        
        if (name === 'savingAction') {
            setFormData(prev => ({ ...prev, savingAction: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setBalanceError('');
        
        if (!formData.amount || formData.amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }
        
        const amount = parseFloat(formData.amount);
        const selectedAccount = accounts.find(acc => acc.id === parseInt(formData.accountId));
        const currentBalance = selectedAccount?.balance || 0;
        
        if (formData.type === 'expense' && !selectedBudget) {
            if (currentBalance < amount) {
                setBalanceError(`Недостаточно средств на счете "${selectedAccount?.name}"! Доступно: ${currentBalance.toLocaleString()} BYN`);
                return;
            }
        }
        
        if (selectedBudget?.type === 'saving' && formData.savingAction === 'deposit') {
            if (currentBalance < amount) {
                setBalanceError(`Недостаточно средств на счете "${selectedAccount?.name}"! Доступно: ${currentBalance.toLocaleString()} BYN`);
                return;
            }
        }
        
        const transactionData = {
            amount: amount,
            accountId: parseInt(formData.accountId),
            date: formData.date,
            description: formData.description
        };
        
        if (selectedBudget && selectedBudget.type === 'saving') {
            if (formData.savingAction === 'deposit') {
                transactionData.type = 'expense';
                transactionData.savingAction = 'deposit';
                transactionData.budgetId = selectedBudget.id;
                transactionData.categoryId = null;
                transactionData.description = `Пополнение накоплений "${selectedBudget.name}": +${amount} BYN`;
            } else {
                transactionData.type = 'income';
                transactionData.savingAction = 'withdrawal';
                transactionData.budgetId = selectedBudget.id;
                transactionData.categoryId = null;
                transactionData.description = `Снятие с накоплений "${selectedBudget.name}": -${amount} BYN`;
            }
        } else {
            transactionData.type = formData.type;
            transactionData.categoryId = parseInt(formData.categoryId);
        }
        
        onAddTransaction(transactionData, selectedBudget, formData.savingAction);
        
        setFormData({
            amount: '',
            type: 'expense',
            categoryId: categories.find(c => c.type === 'expense')?.id || '',
            accountId: accounts[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            budgetId: '',
            savingAction: 'deposit'
        });
        setSelectedBudget(null);
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);
    
    const visibleBudgets = budgets.filter(budget => {
        if (budget.type === 'expense') return true;
        if (budget.type === 'saving' && formData.type === 'expense') return true;
        return false;
    });

    const savingBudgetsForWithdrawal = budgets.filter(b => b.type === 'saving');

    const selectedAccount = accounts.find(acc => acc.id === parseInt(formData.accountId));

    return (
        <div className="add-transaction-form">
            <h3><FiPlus /> Добавить транзакцию</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Сумма (BYN)</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0,00"
                        step="0.01"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Счет</label>
                    <select name="accountId" value={formData.accountId} onChange={handleChange}>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} (доступно: {acc.balance.toLocaleString()} BYN)
                            </option>
                        ))}
                    </select>
                    {selectedAccount && (
                        <small className="form-hint balance-hint">
                            Доступно: {selectedAccount.balance.toLocaleString()} BYN
                        </small>
                    )}
                </div>
                
                <div className="form-group">
                    <label>Тип операции</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="expense">Расход</option>
                        <option value="income">Доход</option>
                    </select>
                </div>
                
                {formData.type === 'expense' && visibleBudgets.length > 0 && (
                    <div className="form-group">
                        <label>Пополнить накопления (необязательно)</label>
                        <select name="budgetId" value={formData.budgetId} onChange={handleChange}>
                            <option value="">-- Не привязывать к бюджету --</option>
                            {visibleBudgets.map(budget => (
                                <option key={budget.id} value={budget.id}>
                                    {budget.name} ({budget.type === 'expense' ? `лимит: ${budget.targetAmount} BYN` : `цель: ${budget.targetAmount} BYN`})
                                </option>
                            ))}
                        </select>
                        {selectedBudget?.type === 'saving' && (
                            <small className="form-hint"><FiArrowDown /> Пополнение накопительного бюджета. Средства будут отмечены как накопленные.</small>
                        )}
                    </div>
                )}
                
                {formData.type === 'income' && savingBudgetsForWithdrawal.length > 0 && (
                    <div className="form-group">
                        <label>Снять с накоплений</label>
                        <select name="budgetId" value={formData.budgetId} onChange={handleChange}>
                            <option value="">-- Не привязывать к бюджету --</option>
                            {savingBudgetsForWithdrawal.map(budget => (
                                <option key={budget.id} value={budget.id}>
                                    {budget.name} (накоплено: {(budget.currentAmount || 0).toLocaleString()} / {budget.targetAmount} BYN)
                                </option>
                            ))}
                        </select>
                        {selectedBudget?.type === 'saving' && (
                            <small className="form-hint"><FiArrowUp /> Снятие с накопительного бюджета. Средства вернутся на ваш счет.</small>
                        )}
                    </div>
                )}
                
                {selectedBudget?.type === 'saving' && formData.type === 'expense' && (
                    <div className="form-group">
                        <label>Действие</label>
                        <select name="savingAction" value={formData.savingAction} onChange={handleChange}>
                            <option value="deposit">Пополнить накопления</option>
                        </select>
                    </div>
                )}
                
                {selectedBudget?.type === 'saving' && formData.type === 'income' && (
                    <div className="form-group">
                        <label>Действие</label>
                        <select name="savingAction" value={formData.savingAction} onChange={handleChange}>
                            <option value="withdrawal">Снять с накоплений</option>
                        </select>
                    </div>
                )}
                
                {!selectedBudget && formData.type === 'expense' && (
                    <div className="form-group">
                        <label>Категория</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {formData.type === 'income' && !selectedBudget && (
                    <div className="form-group">
                        <label>Категория</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="form-group">
                    <label>Дата</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                    <label>Описание (необязательно)</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Например: продукты в магазине"
                    />
                </div>
                
                {balanceError && (
                    <div className="balance-error">{balanceError}</div>
                )}
                
                <button type="submit" className="btn-submit">
                    {selectedBudget?.type === 'saving' && formData.savingAction === 'deposit' && <><FiArrowDown /> Пополнить накопления</>}
                    {selectedBudget?.type === 'saving' && formData.savingAction === 'withdrawal' && <><FiArrowUp /> Снять с накоплений</>}
                    {(!selectedBudget || selectedBudget?.type !== 'saving') && <><FiPlus /> Добавить транзакцию</>}
                </button>
            </form>
        </div>
    );
}

export default AddTransactionForm;