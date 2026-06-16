const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('Account', {
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
        type: DataTypes.ENUM('cash', 'card', 'ewallet', 'deposit'),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'BYN'
    },
    balance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Accounts',
    timestamps: true
});

module.exports = Account;