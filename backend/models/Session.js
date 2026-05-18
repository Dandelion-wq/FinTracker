const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
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
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'Sessions',
    timestamps: true
});

module.exports = Session;