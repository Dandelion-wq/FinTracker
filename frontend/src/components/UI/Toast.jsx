import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <FiCheckCircle />,
        error: <FiAlertCircle />,
        warning: <FiAlertCircle />,
        info: <FiInfo />
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-content">
                <div className="toast-message">{message}</div>
            </div>
            <button className="toast-close" onClick={onClose}>
                <FiX />
            </button>
        </div>
    );
};

export default Toast;