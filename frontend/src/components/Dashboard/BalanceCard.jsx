import React from 'react';
import './BalanceCard.css';

function BalanceCard({ totalBalance }) {
    const formatBalance = (balance) => {
        const num = Number(balance);
        if (isNaN(num)) return '0.00';
        return num.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="balance-card">
            <div className="balance-label">ТЕКУЩИЙ БАЛАНС</div>
            <div className="balance-amount">{formatBalance(totalBalance)} BYN</div>
            <div className="balance-sub">Общая сумма всех счетов</div>
        </div>
    );
}

export default BalanceCard;