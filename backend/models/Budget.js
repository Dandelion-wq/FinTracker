const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING(20),
        defaultValue: 'expense',
        allowNull: false,
        validate: {
            isIn: [['expense', 'saving']]
        }
    },
    periodType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['week', 'month', 'year', 'custom']]
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    targetAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    currentAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    }
}, {
    tableName: 'Budgets',
    timestamps: true
});

module.exports = Budget;