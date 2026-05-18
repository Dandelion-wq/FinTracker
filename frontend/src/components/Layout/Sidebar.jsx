import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ onLogout, user, isOpen, onClose }) {
    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    return (
        <>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">FinTracker</div>
                
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                        <span className="nav-icon">📊</span>
                        <span>Главная</span>
                    </NavLink>
                    <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                        <span className="nav-icon">📋</span>
                        <span>Транзакции</span>
                    </NavLink>
                    <NavLink to="/accounts" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                        <span className="nav-icon">💰</span>
                        <span>Счета</span>
                    </NavLink>
                    <NavLink to="/categories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                        <span className="nav-icon">📂</span>
                        <span>Категории</span>
                    </NavLink>
                    <NavLink to="/budgets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                        <span className="nav-icon">🎯</span>
                        <span>Бюджеты</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-name">{user?.lastName} {user?.firstName}</div>
                        <div className="user-email">{user?.email}</div>
                    </div>
                    <button onClick={() => { onLogout(); handleLinkClick(); }} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span>Выйти</span>
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;