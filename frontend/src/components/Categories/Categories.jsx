import React, { useState, useEffect } from 'react';
import { 
    FiPlus, 
    FiEdit2, 
    FiTrash2, 
    FiTrendingUp, 
    FiTrendingDown,
    FiCheck,
    FiX
} from 'react-icons/fi';
import { categoriesAPI } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../UI/ToastContainer';
import './Categories.css';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const { toasts, removeToast, success, error: showError, warning } = useToast();
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense',
        color: '#E74C3C',
        monthlyLimit: ''
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await categoriesAPI.getAll();
            setCategories(response.data);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            showError('Не удалось загрузить категории');
        } finally {
            setLoading(false);
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
            setCategories([...categories, response.data]);
            setNewCategory({ name: '', type: 'expense', color: '#E74C3C', monthlyLimit: '' });
            setShowForm(false);
            success(`Категория "${newCategory.name}" успешно создана`);
        } catch (error) {
            console.error('Ошибка создания категории:', error);
            showError(error.response?.data?.error || 'Не удалось создать категорию');
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
        
        try {
            await categoriesAPI.delete(id);
            setCategories(categories.filter(c => c.id !== id));
            success(`Категория "${name}" удалена`);
        } catch (error) {
            console.error('Ошибка удаления категории:', error);
            showError('Не удалось удалить категорию');
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
            setCategories(categories.map(c => c.id === id ? response.data : c));
            setEditingId(null);
            setEditForm({});
            success(`Категория "${editForm.name}" обновлена`);
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
                                    placeholder="0,00"
                                    step="0.01"
                                />
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
                                            <button className="btn-delete" onClick={() => handleDeleteCategory(category.id, category.name)}>
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
                                            <button className="btn-delete" onClick={() => handleDeleteCategory(category.id, category.name)}>
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