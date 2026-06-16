import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Удалить', cancelText = 'Отмена', type = 'danger' }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <FiX />
                </button>
                
                <div className={`modal-icon ${type}`}>
                    <FiAlertTriangle />
                </div>
                
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                
                <div className="modal-buttons">
                    <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
                        <FiTrash2 /> {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;