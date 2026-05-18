import React, { useState, useEffect } from 'react';
import { budgetsAPI } from '../../services/api';
import './Budgets.css';

function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newBudget, setNewBudget] = useState({
        name: '',
        periodType: 'month',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        totalLimit: ''
    });

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const response = await budgetsAPI.getAll();
            setBudgets(response.data);
        } catch (error) {
            console.error('Ошибка загрузки бюджетов:', error);
            alert('Не удалось загрузить бюджеты');
        } finally {
            setLoading(false);
        }
    };

    const getPeriodTypeName = (type) => {
        const types = {
            week: 'Неделя',
            month: 'Месяц',
            year: 'Год',
            custom: 'Произвольный'
        };
        return types[type] || type;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const calculateProgress = (spent, limit) => {
        if (!limit || limit === 0) return 0;
        return Math.min(100, (spent / limit) * 100);
    };

    const handleAddBudget = async () => {
        if (!newBudget.name || !newBudget.totalLimit) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        if (parseFloat(newBudget.totalLimit) <= 0) {
            alert('Лимит должен быть больше 0');
            return;
        }
        
        if (newBudget.periodType === 'custom' && !newBudget.endDate) {
            alert('Для произвольного периода укажите дату окончания');
            return;
        }
        
        try {
            const response = await budgetsAPI.create({
                name: newBudget.name,
                periodType: newBudget.periodType,
                startDate: newBudget.startDate,
                endDate: newBudget.periodType === 'custom' ? newBudget.endDate : undefined,
                totalLimit: parseFloat(newBudget.totalLimit)
            });
            setBudgets([...budgets, response.data]);
            setNewBudget({
                name: '',
                periodType: 'month',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                totalLimit: ''
            });
            setShowForm(false);
        } catch (error) {
            console.error('Ошибка создания бюджета:', error);
            alert(error.response?.data?.error || 'Не удалось создать бюджет');
        }
    };

    const handleDeleteBudget = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот бюджет?')) return;
        
        try {
            await budgetsAPI.delete(id);
            setBudgets(budgets.filter(b => b.id !== id));
        } catch (error) {
            console.error('Ошибка удаления бюджета:', error);
            alert('Не удалось удалить бюджет');
        }
    };

    const handleEdit = (budget) => {
        setEditingId(budget.id);
        setEditForm({
            name: budget.name,
            periodType: budget.periodType,
            startDate: budget.startDate,
            endDate: budget.endDate,
            totalLimit: budget.totalLimit
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const response = await budgetsAPI.update(id, {
                name: editForm.name,
                periodType: editForm.periodType,
                startDate: editForm.startDate,
                endDate: editForm.periodType === 'custom' ? editForm.endDate : undefined,
                totalLimit: parseFloat(editForm.totalLimit)
            });
            setBudgets(budgets.map(b => b.id === id ? response.data : b));
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Ошибка обновления бюджета:', error);
            alert('Не удалось обновить бюджет');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    if (loading) {
        return <div className="loading-container">Загрузка бюджетов...</div>;
    }

    return (
        <div className="budgets-page">
            <div className="page-header">
                <h1 className="page-title">Бюджеты</h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    + Создать бюджет
                </button>
            </div>

            {showForm && (
                <div className="add-budget-form">
                    <h3>Новый бюджет</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Название</label>
                            <input
                                type="text"
                                value={newBudget.name}
                                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                                placeholder="Бюджет на месяц, отпуск..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Период</label>
                            <select
                                value={newBudget.periodType}
                                onChange={(e) => setNewBudget({ ...newBudget, periodType: e.target.value })}
                            >
                                <option value="week">Неделя</option>
                                <option value="month">Месяц</option>
                                <option value="year">Год</option>
                                <option value="custom">Произвольный</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Дата начала</label>
                            <input
                                type="date"
                                value={newBudget.startDate}
                                onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
                            />
                        </div>
                        {newBudget.periodType === 'custom' && (
                            <div className="form-group">
                                <label>Дата окончания</label>
                                <input
                                    type="date"
                                    value={newBudget.endDate}
                                    onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Лимит (BYN)</label>
                            <input
                                type="number"
                                value={newBudget.totalLimit}
                                onChange={(e) => setNewBudget({ ...newBudget, totalLimit: e.target.value })}
                                placeholder="0,00"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button className="btn-submit" onClick={handleAddBudget}>Создать</button>
                        <button className="btn-cancel" onClick={() => setShowForm(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="budgets-list">
                {budgets.map(budget => {
                    const progress = calculateProgress(budget.currentSpent || 0, budget.totalLimit);
                    const isOverBudget = (budget.currentSpent || 0) > budget.totalLimit;
                    const remaining = budget.totalLimit - (budget.currentSpent || 0);
                    
                    return (
                        <div key={budget.id} className="budget-card">
                            {editingId === budget.id ? (
                                <div className="budget-edit-form">
                                    <div className="edit-fields">
                                        <input
                                            type="text"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleEditChange}
                                            placeholder="Название"
                                        />
                                        <select name="periodType" value={editForm.periodType} onChange={handleEditChange}>
                                            <option value="week">Неделя</option>
                                            <option value="month">Месяц</option>
                                            <option value="year">Год</option>
                                            <option value="custom">Произвольный</option>
                                        </select>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={editForm.startDate}
                                            onChange={handleEditChange}
                                        />
                                        {editForm.periodType === 'custom' && (
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={editForm.endDate}
                                                onChange={handleEditChange}
                                            />
                                        )}
                                        <input
                                            type="number"
                                            name="totalLimit"
                                            value={editForm.totalLimit}
                                            onChange={handleEditChange}
                                            step="0.01"
                                            placeholder="Лимит"
                                        />
                                    </div>
                                    <div className="actions">
                                        <button className="btn-save" onClick={() => handleEditSubmit(budget.id)}>✓</button>
                                        <button className="btn-cancel" onClick={handleCancelEdit}>✗</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="budget-header">
                                        <div className="budget-info">
                                            <h3 className="budget-name">{budget.name}</h3>
                                            <span className="budget-period">
                                                {getPeriodTypeName(budget.periodType)} | {formatDate(budget.startDate)}
                                                {budget.endDate && ` - ${formatDate(budget.endDate)}`}
                                            </span>
                                        </div>
                                        <button className="btn-delete" onClick={() => handleDeleteBudget(budget.id)}>🗑️</button>
                                    </div>
                                    <div className="budget-stats">
                                        <div className="budget-numbers">
                                            <span className="spent">
                                                Потрачено: <strong>{(budget.currentSpent || 0).toLocaleString()} BYN</strong>
                                            </span>
                                            <span className="limit">
                                                Лимит: {budget.totalLimit.toLocaleString()} BYN
                                            </span>
                                            {isOverBudget && <span className="warning">⚠️ Превышение лимита!</span>}
                                        </div>
                                        <div className="progress-container">
                                            <div 
                                                className={`progress-bar ${isOverBudget ? 'over' : ''}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                        <div className="remaining">
                                            Осталось: <strong className={remaining < 0 ? 'negative' : ''}>
                                                {remaining.toLocaleString()} BYN
                                            </strong>
                                        </div>
                                    </div>
                                    <button className="btn-edit-budget" onClick={() => handleEdit(budget)}>
                                        ✏️ Редактировать
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
                {budgets.length === 0 && (
                    <div className="empty-message">Нет созданных бюджетов. Создайте первый бюджет для контроля расходов!</div>
                )}
            </div>
        </div>
    );
}

export default Budgets;