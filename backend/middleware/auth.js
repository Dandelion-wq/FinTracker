const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Доступ запрещен. Токен не предоставлен.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId, email: decoded.email };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Токен истек. Выполните вход заново.' });
        }
        return res.status(401).json({ error: 'Недействительный токен.' });
    }
};