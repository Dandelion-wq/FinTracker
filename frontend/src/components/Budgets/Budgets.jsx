import React, { useState, useEffect } from 'react';
import { 
    FiPlus, FiEdit2, FiTrash2, FiTarget, FiTrendingDown, 
    FiTrendingUp, FiCheck, FiX, FiAlertCircle, FiDollarSign
} from 'react-icons/fi';
import { budgetsAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../UI/ToastContainer';
import './Budgets.css';

function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [filterType, setFilterType] = useState('active');
    const { toasts, removeToast, success, error: showError } = useToast();
    const [newBudget, setNewBudget] = useState({
        name: '',
        type: 'expense',
        periodType: 'month',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        targetAmount: ''
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
            showError('Не удалось загрузить бюджеты');
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

    const calculateProgress = (current, target) => {
        if (!target || target === 0) return 0;
        return Math.min(100, (current / target) * 100);
    };

    // Фильтрация бюджетов по дате
    const getFilteredBudgets = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return budgets.filter(budget => {
            const start = new Date(budget.startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(budget.endDate);
            end.setHours(23, 59, 59, 999);
            
            switch (filterType) {
                case 'active':
                    return now >= start && now <= end;
                case 'future':
                    return now < start;
                case 'expired':
                    return now > end;
                default:
                    return true;
            }
        });
    };

    const handleAddBudget = async () => {
        if (!newBudget.name || !newBudget.targetAmount) {
            showError('Заполните все обязательные поля');
            return;
        }
        
        if (parseFloat(newBudget.targetAmount) <= 0) {
            showError('Целевая сумма должна быть больше 0');
            return;
        }
        
        if (newBudget.periodType === 'custom' && !newBudget.endDate) {
            showError('Для произвольного периода укажите дату окончания');
            return;
        }
        
        try {
            const response = await budgetsAPI.create({
                name: newBudget.name,
                type: newBudget.type,
                periodType: newBudget.periodType,
                startDate: newBudget.startDate,
                endDate: newBudget.periodType === 'custom' ? newBudget.endDate : undefined,
                targetAmount: parseFloat(newBudget.targetAmount)
            });
            setBudgets([...budgets, response.data]);
            setNewBudget({
                name: '',
                type: 'expense',
                periodType: 'month',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                targetAmount: ''
            });
            setShowForm(false);
            success(`Бюджет "${newBudget.name}" успешно создан`);
        } catch (error) {
            console.error('Ошибка создания бюджета:', error);
            showError(error.response?.data?.error || 'Не удалось создать бюджет');
        }
    };

    const handleDeleteBudget = async (id, name) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот бюджет?')) return;
        
        try {
            await budgetsAPI.delete(id);
            setBudgets(budgets.filter(b => b.id !== id));
            success(`Бюджет "${name}" удален`);
        } catch (error) {
            console.error('Ошибка удаления бюджета:', error);
            showError('Не удалось удалить бюджет');
        }
    };

    const handleEdit = (budget) => {
        setEditingId(budget.id);
        setEditForm({
            name: budget.name,
            type: budget.type,
            periodType: budget.periodType,
            startDate: budget.startDate,
            endDate: budget.endDate,
            targetAmount: budget.targetAmount
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
                type: editForm.type,
                periodType: editForm.periodType,
                startDate: editForm.startDate,
                endDate: editForm.periodType === 'custom' ? editForm.endDate : undefined,
                targetAmount: parseFloat(editForm.targetAmount)
            });
            setBudgets(budgets.map(b => b.id === id ? response.data : b));
            setEditingId(null);
            setEditForm({});
            success(`Бюджет "${editForm.name}" обновлен`);
        } catch (error) {
            console.error('Ошибка обновления бюджета:', error);
            showError('Не удалось обновить бюджет');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const filteredBudgets = getFilteredBudgets();
    const activeCount = budgets.filter(b => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = new Date(b.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(b.endDate);
        end.setHours(23, 59, 59, 999);
        return now >= start && now <= end;
    }).length;
    const futureCount = budgets.filter(b => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = new Date(b.startDate);
        start.setHours(0, 0, 0, 0);
        return now < start;
    }).length;
    const expiredCount = budgets.filter(b => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const end = new Date(b.endDate);
        end.setHours(23, 59, 59, 999);
        return now > end;
    }).length;

    if (loading) {
        return <div className="loading-container">Загрузка бюджетов...</div>;
    }

    return (
        <div className="budgets-page">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <div className="page-header">
                <h1 className="page-title">
                    Бюджеты
                </h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> Создать бюджет
                </button>
            </div>

            <div className="budgets-filters">
                <button 
                    className={`filter-btn ${filterType === 'active' ? 'active' : ''}`}
                    onClick={() => setFilterType('active')}
                >
                    Действующие ({activeCount})
                </button>
                <button 
                    className={`filter-btn ${filterType === 'future' ? 'active' : ''}`}
                    onClick={() => setFilterType('future')}
                >
                    Будущие ({futureCount})
                </button>
                <button 
                    className={`filter-btn ${filterType === 'expired' ? 'active' : ''}`}
                    onClick={() => setFilterType('expired')}
                >
                    Архив ({expiredCount})
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
                                placeholder="Бюджет на месяц, Накопления..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Тип бюджета</label>
                            <select
                                value={newBudget.type}
                                onChange={(e) => setNewBudget({ ...newBudget, type: e.target.value })}
                            >
                                <option value="expense">Расходный бюджет</option>
                                <option value="saving">Накопительный бюджет</option>
                            </select>
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
                            <label>{newBudget.type === 'expense' ? 'Лимит (BYN)' : 'Цель накопления (BYN)'}</label>
                            <input
                                type="number"
                                value={newBudget.targetAmount}
                                onChange={(e) => setNewBudget({ ...newBudget, targetAmount: e.target.value })}
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
                {filteredBudgets.length === 0 && (
                    <div className="empty-message">
                        {filterType === 'active' && 'Нет действующих бюджетов. Создайте первый бюджет для контроля расходов или накоплений!'}
                        {filterType === 'future' && 'Нет будущих бюджетов. Создайте бюджет, который начнется позже!'}
                        {filterType === 'expired' && 'Нет завершенных бюджетов в архиве.'}
                    </div>
                )}
                
                {filteredBudgets.map(budget => {
                    const progress = calculateProgress(budget.currentAmount || 0, budget.targetAmount);
                    const isExpenseBudget = budget.type === 'expense';
                    const isCompleted = (budget.currentAmount || 0) >= budget.targetAmount;
                    const remaining = budget.targetAmount - (budget.currentAmount || 0);
                    
                    return (
                        <div key={budget.id} className={`budget-card ${isExpenseBudget ? '' : 'saving'} ${filterType === 'expired' ? 'expired' : ''}`}>
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
                                        <select name="type" value={editForm.type} onChange={handleEditChange}>
                                            <option value="expense">Расходный бюджет</option>
                                            <option value="saving">Накопительный бюджет</option>
                                        </select>
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
                                            name="targetAmount"
                                            value={editForm.targetAmount}
                                            onChange={handleEditChange}
                                            step="0.01"
                                            placeholder={isExpenseBudget ? "Лимит" : "Цель"}
                                        />
                                    </div>
                                    <div className="actions">
                                        <button className="btn-save" onClick={() => handleEditSubmit(budget.id)}>
                                            <FiCheck />
                                        </button>
                                        <button className="btn-cancel" onClick={handleCancelEdit}>
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="budget-header">
                                        <div className="budget-info">
                                            <div className="budget-title">
                                                {isExpenseBudget ? (
                                                    <FiTrendingDown className="budget-type-icon expense" />
                                                ) : (
                                                    <FiDollarSign className="budget-type-icon saving" />
                                                )}
                                                <h3 className="budget-name">{budget.name}</h3>
                                            </div>
                                            <span className="budget-period">
                                                {getPeriodTypeName(budget.periodType)} | {formatDate(budget.startDate)}
                                                {budget.endDate && ` - ${formatDate(budget.endDate)}`}
                                            </span>
                                        </div>
                                        <button className="btn-delete" onClick={() => handleDeleteBudget(budget.id, budget.name)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    <div className="budget-stats">
                                        <div className="budget-numbers">
                                            <span className={isExpenseBudget ? "spent" : "saved"}>
                                                {isExpenseBudget ? 'Потрачено:' : 'Накоплено:'}
                                                <strong>{(budget.currentAmount || 0).toLocaleString()} BYN</strong>
                                            </span>
                                            <span className="target">
                                                {isExpenseBudget ? 'Лимит:' : 'Цель:'}
                                                <strong>{budget.targetAmount.toLocaleString()} BYN</strong>
                                            </span>
                                            {isCompleted && (
                                                <span className="completed-badge">
                                                    <FiCheck /> {isExpenseBudget ? 'Лимит достигнут' : 'Цель достигнута!'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="progress-container">
                                            <div 
                                                className={`progress-bar ${isCompleted ? 'completed' : ''} ${isExpenseBudget && remaining < 0 ? 'over' : ''}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                        <div className="remaining">
                                            {isExpenseBudget ? (
                                                remaining < 0 ? (
                                                    <span className="negative">Превышение: {Math.abs(remaining).toLocaleString()} BYN</span>
                                                ) : (
                                                    <span>Осталось: <strong>{remaining.toLocaleString()} BYN</strong></span>
                                                )
                                            ) : (
                                                <span>Осталось накопить: <strong>{remaining.toLocaleString()} BYN</strong></span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="btn-edit-budget" onClick={() => handleEdit(budget)}>
                                        <FiEdit2 /> Редактировать
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Budgets;