const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
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
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
    },
    color: {
        type: DataTypes.STRING(7),
        defaultValue: '#27AE60'
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    monthlyLimit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Categories',
    timestamps: true
});

module.exports = Category;