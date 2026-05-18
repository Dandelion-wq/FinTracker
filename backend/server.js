const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const accountsRoutes = require('./routes/accountsRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const budgetsRoutes = require('./routes/budgetsRoutes');
const swaggerSpec = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);

// Проверка подключения к БД
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Подключение к PostgreSQL успешно установлено');
        
        await sequelize.sync({ alter: false });
        console.log('Синхронизация моделей завершена');
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
            console.log(`Swagger документация: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Ошибка при запуске сервера:', error);
    }
};

startServer();