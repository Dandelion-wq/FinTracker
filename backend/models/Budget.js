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
    periodType: {
        type: DataTypes.ENUM('week', 'month', 'year', 'custom'),
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    totalLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    currentSpent: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    }
}, {
    tableName: 'Budgets',
    timestamps: true
});

module.exports = Budget;