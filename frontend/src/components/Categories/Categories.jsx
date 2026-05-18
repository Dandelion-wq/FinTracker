import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';
import './Categories.css';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
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
            alert('Не удалось загрузить категории');
        } finally {
            setLoading(false);
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const handleAddCategory = async () => {
        if (!newCategory.name) {
            alert('Введите название категории');
            return;
        }
        
        try {
            const response = await categoriesAPI.create(newCategory);
            setCategories([...categories, response.data]);
            setNewCategory({ name: '', type: 'expense', color: '#E74C3C', monthlyLimit: '' });
            setShowForm(false);
        } catch (error) {
            console.error('Ошибка создания категории:', error);
            alert('Не удалось создать категорию');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
        
        try {
            await categoriesAPI.delete(id);
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            console.error('Ошибка удаления категории:', error);
            alert('Не удалось удалить категорию');
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setEditForm({
            name: category.name,
            color: category.color,
            monthlyLimit: category.monthlyLimit || ''
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (id) => {
        try {
            const response = await categoriesAPI.update(id, editForm);
            setCategories(categories.map(c => c.id === id ? response.data : c));
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Ошибка обновления категории:', error);
            alert('Не удалось обновить категорию');
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
            <div className="page-header">
                <h1 className="page-title">Категории</h1>
                <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                    + Добавить категорию
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
                    <h2 className="section-title expense-title">Расходы</h2>
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
                                            <button className="btn-save" onClick={() => handleEditSubmit(category.id)}>✓</button>
                                            <button className="btn-cancel" onClick={handleCancelEdit}>✗</button>
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
                                            <button className="btn-edit" onClick={() => handleEdit(category)}>✏️</button>
                                            <button className="btn-delete" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
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
                    <h2 className="section-title income-title">Доходы</h2>
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
                                            <button className="btn-save" onClick={() => handleEditSubmit(category.id)}>✓</button>
                                            <button className="btn-cancel" onClick={handleCancelEdit}>✗</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="category-info">
                                            <span className="color-dot" style={{ backgroundColor: category.color }}></span>
                                            <span className="category-name">{category.name}</span>
                                        </div>
                                        <div className="category-stats">
                                            <button className="btn-edit" onClick={() => handleEdit(category)}>✏️</button>
                                            <button className="btn-delete" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
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