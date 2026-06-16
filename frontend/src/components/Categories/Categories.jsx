import React, { useState, useEffect, useRef } from 'react';
import { 
    FiPlus, FiEdit2, FiTrash2, FiTrendingUp, FiTrendingDown,
    FiCheck, FiX, FiAlertCircle
} from 'react-icons/fi';
import { categoriesAPI, transactionsAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../UI/ToastContainer';
import ConfirmModal from '../UI/ConfirmModal';
import './Categories.css';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const { toasts, removeToast, success, error: showError, warning } = useToast();
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        categoryId: null,
        categoryName: ''
    });
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense',
        color: '#E74C3C',
        monthlyLimit: ''
    });
    
    // Для отслеживания уже показанных уведомлений
    const notifiedLimitsRef = useRef(new Set());

    useEffect(() => {
        loadCategories();
        
        // Очищаем Set при размонтировании
        return () => {
            notifiedLimitsRef.current.clear();
        };
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await categoriesAPI.getAll();
            setCategories(response.data);
            
            // Проверяем лимиты после загрузки
            await checkCategoryLimits(response.data, true);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            showError('Не удалось загрузить категории');
        } finally {
            setLoading(false);
        }
    };

    // Получение транзакций за месяц
    const getMonthlyTransactions = async () => {
        const response = await transactionsAPI.getAll();
        return response.data || [];
    };

    // Расчет суммы расходов по категории за текущий месяц
    const calculateCategorySpending = (transactions, categoryId, currentMonth) => {
        const categoryTransactions = transactions.filter(t => 
            t.type === 'expense' && 
            t.categoryId === categoryId &&
            t.date.startsWith(currentMonth)
        );
        return categoryTransactions.reduce((sum, t) => sum + (t.amountInBYN || t.amount), 0);
    };

    // Проверка лимитов категорий
    const checkCategoryLimits = async (categoriesList, isInitialLoad = false) => {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        
        // Получаем транзакции
        const transactions = await getMonthlyTransactions();
        
        const expenseCategories = categoriesList.filter(c => c.type === 'expense' && c.monthlyLimit && c.monthlyLimit > 0);
        
        // Создаем ключ для текущего месяца
        const monthKey = currentMonth;
        
        for (const category of expenseCategories) {
            const totalSpent = calculateCategorySpending(transactions, category.id, currentMonth);
            const limit = category.monthlyLimit;
            const overspendAmount = totalSpent - limit;
            
            // Создаем уникальный ключ для уведомления о превышении
            const overspendKey = `${category.id}-${monthKey}-overspend`;
            // Создаем ключ для предупреждения о 90% лимита
            const warningKey = `${category.id}-${monthKey}-warning`;
            
            // Проверка превышения лимита
            if (totalSpent > limit) {
                // Показываем уведомление только если оно еще не было показано
                if (!notifiedLimitsRef.current.has(overspendKey)) {
                    notifiedLimitsRef.current.add(overspendKey);
                    // Удаляем ключ предупреждения, если был
                    if (notifiedLimitsRef.current.has(warningKey)) {
                        notifiedLimitsRef.current.delete(warningKey);
                    }
                    
                    const overspendAmountFormatted = overspendAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    warning(`Превышение лимита на категорию "${category.name}"! Лимит превышен на ${overspendAmountFormatted} BYN`);
                }
            } 
            // Проверка на 90% лимита (только если нет превышения)
            else if (totalSpent >= limit * 0.9 && !notifiedLimitsRef.current.has(overspendKey)) {
                if (!notifiedLimitsRef.current.has(warningKey)) {
                    notifiedLimitsRef.current.add(warningKey);
                    const remaining = (limit - totalSpent).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    warning(`Внимание! В категории "${category.name}" осталось ${remaining} BYN до лимита.`);
                }
            }
            // Если траты меньше 90%, удаляем ключи уведомлений
            else if (totalSpent < limit * 0.9) {
                if (notifiedLimitsRef.current.has(warningKey)) {
                    notifiedLimitsRef.current.delete(warningKey);
                }
                if (notifiedLimitsRef.current.has(overspendKey)) {
                    notifiedLimitsRef.current.delete(overspendKey);
                }
            }
        }
    };

    // Проверка лимитов после добавления/изменения транзакции
    const recheckLimits = async () => {
        await checkCategoryLimits(categories, false);
    };

    // Открытие модального окна подтверждения удаления
    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            categoryId: id,
            categoryName: name
        });
    };

    // Закрытие модального окна
    const closeDeleteConfirm = () => {
        setConfirmModal({
            isOpen: false,
            categoryId: null,
            categoryName: ''
        });
    };

    // Подтверждение удаления
    const confirmDelete = async () => {
        const { categoryId, categoryName } = confirmModal;
        
        try {
            await categoriesAPI.delete(categoryId);
            const updatedCategories = categories.filter(c => c.id !== categoryId);
            setCategories(updatedCategories);
            success(`Категория "${categoryName}" удалена`);
            
            // Очищаем уведомления для удаленной категории
            for (const key of notifiedLimitsRef.current) {
                if (key.startsWith(`${categoryId}-`)) {
                    notifiedLimitsRef.current.delete(key);
                }
            }
        } catch (error) {
            console.error('Ошибка удаления категории:', error);
            showError('Не удалось удалить категорию');
        } finally {
            closeDeleteConfirm();
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const handleAddCategory = async () => {
        if (!newCategory.name) {
            showError('Введите название категории');
            return;
        }
        
        try {
            const dataToSend = {
                name: newCategory.name,
                type: newCategory.type,
                color: newCategory.color,
                monthlyLimit: newCategory.monthlyLimit === '' ? null : parseFloat(newCategory.monthlyLimit)
            };
            
            const response = await categoriesAPI.create(dataToSend);
            const updatedCategories = [...categories, response.data];
            setCategories(updatedCategories);
            setNewCategory({ name: '', type: 'expense', color: '#E74C3C', monthlyLimit: '' });
            setShowForm(false);
            success(`Категория "${newCategory.name}" успешно создана`);
            
            // Проверяем лимиты для новой категории
            await checkCategoryLimits(updatedCategories);
        } catch (error) {
            console.error('Ошибка создания категории:', error);
            showError(error.response?.data?.error || 'Не удалось создать категорию');
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setEditForm({
            name: category.name,
            color: category.color,
            monthlyLimit: category.monthlyLimit !== null ? category.monthlyLimit : ''
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const dataToSend = {
                name: editForm.name,
                color: editForm.color,
                monthlyLimit: editForm.monthlyLimit === '' ? null : parseFloat(editForm.monthlyLimit)
            };
            
            const response = await categoriesAPI.update(id, dataToSend);
            const updatedCategories = categories.map(c => c.id === id ? response.data : c);
            setCategories(updatedCategories);
            setEditingId(null);
            setEditForm({});
            success(`Категория "${editForm.name}" обновлена`);
            
            // Очищаем уведомления для обновленной категории
            for (const key of notifiedLimitsRef.current) {
                if (key.startsWith(`${id}-`)) {
                    notifiedLimitsRef.current.delete(key);
                }
            }
            
            // Проверяем лимиты заново
            await checkCategoryLimits(updatedCategories);
        } catch (error) {
            console.error('Ошибка обновления категории:', error);
            showError('Не удалось обновить категорию');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    if (loading) {
        return <div className="loading-container">Загрузка категорий...</div>;
    }

    return (
        <div className="categories-page">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeDeleteConfirm}
                onConfirm={confirmDelete}
                title="Удаление категории"
                message={`Вы уверены, что хотите удалить категорию "${confirmModal.categoryName}"? Все связанные транзакции будут потеряны.`}
                confirmText="Удалить"
                cancelText="Отмена"
                type="danger"
            />
            
            <div className="page-header">
                <h1 className="page-title">Категории</h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> Добавить категорию
                </button>
            </div>

            {showForm && (
                <div className="add-category-form">
                    <h3>Новая категория</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Название</label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                placeholder="Продукты, транспорт..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Тип</label>
                            <select
                                value={newCategory.type}
                                onChange={(e) => {
                                    setNewCategory({ 
                                        ...newCategory, 
                                        type: e.target.value,
                                        color: e.target.value === 'expense' ? '#E74C3C' : '#27AE60'
                                    });
                                }}
                            >
                                <option value="expense">Расход</option>
                                <option value="income">Доход</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Цвет</label>
                            <input
                                type="color"
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                            />
                        </div>
                        {newCategory.type === 'expense' && (
                            <div className="form-group">
                                <label>Месячный лимит (BYN)</label>
                                <input
                                    type="number"
                                    value={newCategory.monthlyLimit}
                                    onChange={(e) => setNewCategory({ ...newCategory, monthlyLimit: e.target.value })}
                                    placeholder="0,00 (0 - без лимита)"
                                    step="0.01"
                                />
                                <small className="form-hint">При превышении лимита вы получите уведомление</small>
                            </div>
                        )}
                    </div>
                    <div className="form-actions">
                        <button className="btn-submit" onClick={handleAddCategory}>Создать</button>
                        <button className="btn-cancel" onClick={() => setShowForm(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="categories-sections">
                <div className="category-section">
                    <h2 className="section-title expense-title">
                        <FiTrendingDown /> Расходы
                    </h2>
                    <div className="category-list">
                        {expenseCategories.map(category => (
                            <div key={category.id} className="category-card">
                                {editingId === category.id ? (
                                    <>
                                        <div className="edit-fields">
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                                placeholder="Название"
                                            />
                                            <input
                                                type="color"
                                                name="color"
                                                value={editForm.color}
                                                onChange={handleEditChange}
                                            />
                                            <input
                                                type="number"
                                                name="monthlyLimit"
                                                value={editForm.monthlyLimit}
                                                onChange={handleEditChange}
                                                placeholder="Лимит"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="actions">
                                            <button className="btn-save" onClick={() => handleEditSubmit(category.id)}>
                                                <FiCheck />
                                            </button>
                                            <button className="btn-cancel" onClick={handleCancelEdit}>
                                                <FiX />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="category-info">
                                            <span className="color-dot" style={{ backgroundColor: category.color }}></span>
                                            <span className="category-name">{category.name}</span>
                                        </div>
                                        <div className="category-stats">
                                            {category.monthlyLimit > 0 && (
                                                <span className="category-limit">Лимит: {category.monthlyLimit} BYN</span>
                                            )}
                                            <button className="btn-edit" onClick={() => handleEdit(category)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="btn-delete" onClick={() => openDeleteConfirm(category.id, category.name)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {expenseCategories.length === 0 && (
                            <div className="empty-message">Нет категорий расходов. Создайте первую!</div>
                        )}
                    </div>
                </div>

                <div className="category-section">
                    <h2 className="section-title income-title">
                        <FiTrendingUp /> Доходы
                    </h2>
                    <div className="category-list">
                        {incomeCategories.map(category => (
                            <div key={category.id} className="category-card">
                                {editingId === category.id ? (
                                    <>
                                        <div className="edit-fields">
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                                placeholder="Название"
                                            />
                                            <input
                                                type="color"
                                                name="color"
                                                value={editForm.color}
                                                onChange={handleEditChange}
                                            />
                                        </div>
                                        <div className="actions">
                                            <button className="btn-save" onClick={() => handleEditSubmit(category.id)}>
                                                <FiCheck />
                                            </button>
                                            <button className="btn-cancel" onClick={handleCancelEdit}>
                                                <FiX />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="category-info">
                                            <span className="color-dot" style={{ backgroundColor: category.color }}></span>
                                            <span className="category-name">{category.name}</span>
                                        </div>
                                        <div className="category-stats">
                                            <button className="btn-edit" onClick={() => handleEdit(category)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="btn-delete" onClick={() => openDeleteConfirm(category.id, category.name)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {incomeCategories.length === 0 && (
                            <div className="empty-message">Нет категорий доходов. Создайте первую!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Categories;