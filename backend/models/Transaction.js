const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - accountId
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор
 *         userId:
 *           type: integer
 *           description: ID пользователя
 *         accountId:
 *           type: integer
 *           description: ID счета
 *         categoryId:
 *           type: integer
 *           description: ID категории
 *         amount:
 *           type: number
 *           description: Сумма транзакции
 *         type:
 *           type: string
 *           enum: [income, expense]
 *           description: Тип транзакции (доход/расход)
 *         date:
 *           type: string
 *           format: date
 *           description: Дата транзакции
 *         description:
 *           type: string
 *           description: Описание транзакции
 *         isTransfer:
 *           type: boolean
 *           description: Является ли переводом
 *         transferAccountId:
 *           type: integer
 *           description: ID счета получателя при переводе
 *         savingAction:
 *           type: string
 *           enum: [deposit, withdrawal]
 *           description: deposit - пополнение накоплений, withdrawal - снятие
 *         budgetId:
 *           type: integer
 *           description: ID бюджета (для накопительных бюджетов)
 */
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
    },
    savingAction: {
        type: DataTypes.ENUM('deposit', 'withdrawal'),
        allowNull: true
    },
    budgetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Budgets',
            key: 'id'
        }
    }
}, {
    tableName: 'Transactions',
    timestamps: true
});

module.exports = Transaction;