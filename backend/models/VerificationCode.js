const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VerificationCode = sequelize.define('VerificationCode', {
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
    code: {
        type: DataTypes.STRING(6),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'VerificationCodes',
    timestamps: true
});

module.exports = VerificationCode;