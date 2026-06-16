import React, { useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
    const toastRef = useRef(null);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Обработчики касаний для свайпа
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setStartX(touch.clientX);
        setCurrentX(touch.clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        
        // Только свайп вправо (для закрытия)
        if (deltaX > 0) {
            setCurrentX(touch.clientX);
            if (toastRef.current) {
                toastRef.current.style.transform = `translateX(${deltaX}px)`;
                toastRef.current.style.opacity = `${1 - deltaX / 200}`;
            }
        }
    };

    const handleTouchEnd = (e) => {
        setIsDragging(false);
        const deltaX = currentX - startX;
        
        // Если смахнули более чем на 100px - закрываем
        if (deltaX > 100) {
            handleClose();
        } else {
            // Иначе возвращаем на место
            if (toastRef.current) {
                toastRef.current.style.transform = '';
                toastRef.current.style.opacity = '';
            }
        }
        
        setStartX(0);
        setCurrentX(0);
    };

    // Обработчики мыши для десктопа (опционально)
    const handleMouseDown = (e) => {
        setStartX(e.clientX);
        setCurrentX(e.clientX);
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        if (deltaX > 0) {
            setCurrentX(e.clientX);
            if (toastRef.current) {
                toastRef.current.style.transform = `translateX(${deltaX}px)`;
                toastRef.current.style.opacity = `${1 - deltaX / 200}`;
            }
        }
    };

    const handleMouseUp = (e) => {
        setIsDragging(false);
        const deltaX = currentX - startX;
        
        if (deltaX > 100) {
            handleClose();
        } else {
            if (toastRef.current) {
                toastRef.current.style.transform = '';
                toastRef.current.style.opacity = '';
            }
        }
        
        setStartX(0);
        setCurrentX(0);
    };

    // Добавляем глобальные обработчики при перетаскивании
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, currentX, startX]);

    const icons = {
        success: <FiCheckCircle />,
        error: <FiAlertCircle />,
        warning: <FiAlertCircle />,
        info: <FiInfo />
    };

    return (
        <div 
            ref={toastRef}
            className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
        >
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-content">
                <div className="toast-message">{message}</div>
            </div>
            <button className="toast-close" onClick={handleClose}>
                <FiX />
            </button>
            {/* Индикатор свайпа (только на мобильных) */}
            <div className="toast-swipe-indicator"></div>
        </div>
    );
};

export default Toast;