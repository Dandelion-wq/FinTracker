import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FiHome, 
    FiList, 
    FiCreditCard, 
    FiFolder, 
    FiTarget, 
    FiLogOut, 
    FiUser, 
    FiMail,
    FiBarChart2
} from 'react-icons/fi';
import './Sidebar.css';

function Sidebar({ onLogout, user, isOpen, onClose }) {
    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    // Формируем полное ФИО с отчеством
    const getFullName = () => {
        if (!user) return '';
        const parts = [user.lastName, user.firstName];
        if (user.patronymic) {
            parts.push(user.patronymic);
        }
        return parts.filter(Boolean).join(' ');
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <FiBarChart2 className="logo-icon" />
                <span>FinTracker</span>
            </div>
            
            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <FiHome />
                    <span>Главная</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <FiList />
                    <span>Транзакции</span>
                </NavLink>
                <NavLink to="/accounts" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <FiCreditCard />
                    <span>Счета</span>
                </NavLink>
                <NavLink to="/categories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <FiFolder />
                    <span>Категории</span>
                </NavLink>
                <NavLink to="/budgets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <FiTarget />
                    <span>Бюджеты</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <FiUser className="user-icon" />
                    <div>
                        <div className="user-name">{getFullName()}</div>
                        <div className="user-email">
                            <FiMail size={12} />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => { onLogout(); handleLinkClick(); }} className="logout-btn">
                    <FiLogOut />
                    <span>Выйти</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;