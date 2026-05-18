import React, { useState } from 'react';
import './AddTransactionForm.css';

function AddTransactionForm({ onAddTransaction, accounts, categories }) {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        categoryId: categories.find(c => c.type === 'expense')?.id || '',
        accountId: accounts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // При смене типа, сбрасываем категорию на первую подходящую
        if (name === 'type') {
            const firstCategory = categories.find(c => c.type === value);
            if (firstCategory) {
                setFormData(prev => ({ ...prev, categoryId: firstCategory.id }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.amount || formData.amount <= 0) {
            alert('Введите корректную сумму');
            return;
        }
        onAddTransaction({
            ...formData,
            amount: parseFloat(formData.amount),
            id: Date.now()
        });
        setFormData({
            amount: '',
            type: 'expense',
            categoryId: categories.find(c => c.type === 'expense')?.id || '',
            accountId: accounts[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            description: ''
        });
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <div className="add-transaction-form">
            <h3>Добавить транзакцию</h3>
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
                    <label>Тип</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="expense">Расход</option>
                        <option value="income">Доход</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Категория</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                        {filteredCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Счет</label>
                    <select name="accountId" value={formData.accountId} onChange={handleChange}>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Дата</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
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
                <button type="submit" className="btn-submit">Добавить</button>
            </form>
        </div>
    );
}

export default AddTransactionForm;