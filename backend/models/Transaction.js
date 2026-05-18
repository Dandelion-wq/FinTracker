const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accountId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isTransfer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    transferAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    receiptImage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Transactions',
    timestamps: true
});

module.exports = Transaction;