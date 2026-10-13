const sequelize = require('../config/database');

const User = require('./User');
const Category = require('./Category');
const VerificationCode = require('./VerificationCode');
const Session = require('./Session');
const Account = require('./Account');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(VerificationCode, { foreignKey: 'userId', onDelete: 'CASCADE' });
VerificationCode.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Session, { foreignKey: 'userId', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Account.hasMany(Transaction, { foreignKey: 'accountId', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'accountId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    Category,
    VerificationCode,
    Session,
    Account,
    Transaction,
    Budget
};