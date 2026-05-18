const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - lastName
 *               - firstName
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               lastName:
 *                 type: string
 *                 example: Иванов
 *               firstName:
 *                 type: string
 *                 example: Иван
 *               patronymic:
 *                 type: string
 *                 example: Иванович
 *     responses:
 *       201:
 *         description: Регистрация успешна
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Неверный email или пароль
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Обновление access токена
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Новый access токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Недействительный или истекший refresh token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход из системы (завершение сессии)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Выход выполнен успешно
 *       500:
 *         description: Ошибка сервера
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Подтверждение email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email подтвержден
 *       400:
 *         description: Неверный код
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Запрос на восстановление пароля
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Код отправлен на почту
 *       404:
 *         description: Пользователь не найден
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Сброс пароля
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *       400:
 *         description: Неверный код или истек срок
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Повторная отправка кода подтверждения
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Новый код отправлен
 *       404:
 *         description: Пользователь не найден
 */
router.post('/resend-verification', authController.resendVerificationCode);

module.exports = router;